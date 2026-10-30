import csv
import re
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Count, Avg, Q
from rest_framework import views, generics, status, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import (
    Complaint,
    ComplaintImage,
    StaffAssignment,
    ComplaintStatusHistory,
    WorkLog,
    Feedback
)
from .serializers import (
    ComplaintListSerializer,
    ComplaintDetailSerializer,
    ComplaintCreateSerializer,
    ComplaintImageSerializer,
    StaffAssignmentSerializer,
    ComplaintStatusHistorySerializer,
    WorkLogSerializer,
    FeedbackSerializer
)
from accounts.models import User
from accounts.permissions import IsStudent, IsStaffMember, IsAdminUserRole, IsStaffOrAdmin
from notifications.models import send_notification
from activity_logs.models import log_activity
from .utils import validate_working_hours_and_future_time



class ComplaintListCreateView(generics.ListCreateAPIView):
    """
    List complaints (filtered by role and query params)
    or create a new complaint (Student only).
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ComplaintCreateSerializer
        return ComplaintListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Complaint.objects.select_related('student').prefetch_related('assignments__staff').all()

        # Enforce Role-Based Visibility
        if user.is_student:
            queryset = queryset.filter(student=user)
        elif user.is_maintenance_staff:
            # Staff see active complaints assigned to them (excluding reset/pending)
            queryset = queryset.filter(assignments__staff=user, assignments__is_current=True).exclude(status='PENDING')
        # Admins see all complaints

        # Query Filters
        status_filter = self.request.query_params.get('status')
        category_filter = self.request.query_params.get('category')
        priority_filter = self.request.query_params.get('priority')
        search_query = self.request.query_params.get('search')

        if status_filter:
            queryset = queryset.filter(status=status_filter.upper())
        if category_filter:
            queryset = queryset.filter(category=category_filter.upper())
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter.upper())
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(complaint_number__icontains=search_query) |
                Q(room_number_snapshot__icontains=search_query)
            )

        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        user = request.user
        if not user.is_student:
            return Response(
                {'error': 'Only registered students can file a maintenance complaint.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Save with student association and room snapshot
        complaint = serializer.save(
            student=user,
            hostel_block_snapshot=user.hostel_block or 'Block A',
            room_number_snapshot=user.room_number or 'Unspecified'
        )

        images = request.FILES.getlist('images')
        for img in images:
            ComplaintImage.objects.create(
                complaint=complaint,
                image=img,
                uploader=user
            )

        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            previous_status='NONE',
            new_status='PENDING',
            changed_by=user,
            remarks='Complaint submitted by student.'
        )

        log_activity(
            user,
            'COMPLAINT_CREATED',
            f"Raised complaint {complaint.complaint_number}: {complaint.title}",
            complaint
        )

        admin_users = User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True), is_active=True)
        for admin_usr in admin_users:
            send_notification(
                recipient=admin_usr,
                title="New Complaint Filed",
                message=f"Student {user.full_name} filed {complaint.complaint_number} ({complaint.get_category_display()}) in {complaint.room_number_snapshot}.",
                complaint=complaint
            )

        return Response(
            {
                'message': f"Complaint {complaint.complaint_number} created successfully.",
                'complaint': ComplaintDetailSerializer(complaint).data
            },
            status=status.HTTP_201_CREATED
        )


class ComplaintDetailView(generics.RetrieveAPIView):
    """Retrieve full details of a specific complaint with authorization checks."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ComplaintDetailSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        user = self.request.user
        queryset = Complaint.objects.select_related('student', 'feedback') \
            .prefetch_related('images', 'assignments__staff', 'status_history__changed_by', 'work_logs__staff')

        if user.is_student:
            return queryset.filter(student=user)
        elif user.is_maintenance_staff:
            return queryset.filter(assignments__staff=user, assignments__is_current=True).exclude(status='PENDING')
        return queryset.all()


class ComplaintAssignStaffView(views.APIView):
    """Administrator-only: Assign or reassign complaint to maintenance staff."""
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        if complaint.status in ['RESOLVED', 'CLOSED'] or hasattr(complaint, 'feedback'):
            return Response(
                {'error': 'Cannot assign or reassign staff while complaint is resolved or closed. Reopen to In Progress or Pending first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        staff_id = request.data.get('staff_id')
        remarks = request.data.get('remarks', '').strip()
        estimated_visit_time = request.data.get('estimated_visit_time', '').strip()

        if not staff_id:
            return Response({'staff_id': ['Staff member must be selected.']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            staff_user = User.objects.get(pk=staff_id, role='STAFF', is_active=True)
        except User.DoesNotExist:
            return Response({'staff_id': ['Selected staff member does not exist or is inactive.']}, status=status.HTTP_400_BAD_REQUEST)

        # Get previous current assignee before updating
        prev_assignee = complaint.assignments.filter(is_current=True).first()
        is_reassignment = prev_assignee and prev_assignee.staff != staff_user

        # Deactivate previous assignments
        complaint.assignments.filter(is_current=True).update(is_current=False)

        # Create new current assignment
        StaffAssignment.objects.create(
            complaint=complaint,
            staff=staff_user,
            assigned_by=request.user,
            is_current=True,
            remarks=remarks
        )

        # If reassigned to a new person, clear old visit timing and authorization
        if is_reassignment:
            complaint.estimated_visit_time = ''
            complaint.visit_approved = False
            complaint.visit_approved_at = None

        if estimated_visit_time:
            valid, err_msg = validate_working_hours_and_future_time(estimated_visit_time)
            if not valid:
                return Response({'estimated_visit_time': [err_msg], 'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)
            complaint.estimated_visit_time = estimated_visit_time

        # If complaint was PENDING, advance status to ASSIGNED
        prev_status = complaint.status
        if complaint.status == 'PENDING':
            complaint.status = 'ASSIGNED'

        complaint.save()

        # Notify previous technician if reassigned
        if is_reassignment and prev_assignee and prev_assignee.staff:
            send_notification(
                recipient=prev_assignee.staff,
                title="Complaint Reassigned",
                message=f"Complaint {complaint.complaint_number} has been reassigned to {staff_user.full_name} by administrator ({request.user.full_name}) and removed from your tasks.",
                complaint=complaint
            )

        if prev_status == 'PENDING':
            ComplaintStatusHistory.objects.create(
                complaint=complaint,
                previous_status=prev_status,
                new_status='ASSIGNED',
                changed_by=request.user,
                remarks=f"Assigned to {staff_user.full_name}. {remarks}"
            )

        # Log Activity
        log_activity(
            request.user,
            'STAFF_ASSIGNED',
            f"Assigned {complaint.complaint_number} to {staff_user.full_name}",
            complaint
        )

        # Build accommodation text for staff
        accommodations = []
        if complaint.require_warden_presence:
            accommodations.append("Warden / authorized staff presence requested")
        if complaint.keep_door_open:
            accommodations.append("Keep room door open during repair")
        if complaint.preferred_slot:
            accommodations.append(f"Preferred time: {complaint.preferred_slot}")
        if complaint.custom_accommodation:
            accommodations.append(f"Accommodation: {complaint.custom_accommodation}")
        if complaint.preferred_worker_gender != 'ANY':
            accommodations.append(f"Worker gender requested: {complaint.get_preferred_worker_gender_display()}")
        acc_text = f" | Visit Protocols: {'; '.join(accommodations)}" if accommodations else ""

        # Send Notifications
        send_notification(
            recipient=staff_user,
            title="New Maintenance Task Assigned",
            message=f"You have been assigned complaint {complaint.complaint_number} in {complaint.room_number_snapshot}. Notes: {remarks or 'None'}{acc_text}",
            complaint=complaint
        )
        time_note = f" Estimated arrival time: {complaint.estimated_visit_time}." if complaint.estimated_visit_time else ""
        send_notification(
            recipient=complaint.student,
            title="Complaint Assigned to Staff",
            message=f"Your complaint {complaint.complaint_number} has been assigned to maintenance staff {staff_user.full_name} ({staff_user.get_gender_display()}).{time_note}",
            complaint=complaint
        )

        return Response({
            'message': f"Assigned to {staff_user.full_name} successfully.",
            'complaint': ComplaintDetailSerializer(complaint).data
        })


class ComplaintUpdateStatusView(views.APIView):
    """
    Update complaint status:
    Staff can set IN_PROGRESS or RESOLVED.
    Admin can set IN_PROGRESS, RESOLVED, CLOSED, or REOPENED.
    """
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        if complaint.status == 'CLOSED' or hasattr(complaint, 'feedback'):
            return Response(
                {'error': 'This complaint has been closed with final resident feedback and is finalized. No status change can be made by admin or staff.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        new_status = request.data.get('status', '').upper()
        remarks = request.data.get('remarks', '').strip()

        if new_status == 'CLOSED':
            return Response(
                {'error': 'Complaints cannot be manually closed. A complaint is automatically closed once the resident submits feedback.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_statuses = dict(Complaint.STATUS_CHOICES).keys()
        if new_status not in valid_statuses:
            return Response(
                {'status': [f"Invalid status '{new_status}'. Choices are: {', '.join(valid_statuses)}"]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If staff, ensure they are assigned to this complaint
        if user.is_maintenance_staff:
            has_assignment = complaint.assignments.filter(staff=user, is_current=True).exists()
            if not has_assignment:
                return Response({'error': 'You can only update status on complaints assigned to you.'}, status=status.HTTP_403_FORBIDDEN)
            if new_status not in ['IN_PROGRESS', 'RESOLVED']:
                return Response({'error': 'Staff can only change status to IN_PROGRESS or RESOLVED.'}, status=status.HTTP_403_FORBIDDEN)

        # Enforce student visit approval before staff can advance from PENDING/ASSIGNED to IN_PROGRESS or RESOLVED, or mark IN_PROGRESS to RESOLVED
        if not user.is_admin_user and not complaint.visit_approved:
            if complaint.status in ['PENDING', 'ASSIGNED'] and new_status in ['IN_PROGRESS', 'RESOLVED']:
                action_name = "start work (In Progress)" if new_status == 'IN_PROGRESS' else "mark completed (Resolved)"
                return Response(
                    {
                        'error': f'Visit entry has not been approved by the student resident yet. You cannot {action_name} until the resident approves that you can come.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            if complaint.status == 'IN_PROGRESS' and new_status == 'RESOLVED':
                return Response(
                    {
                        'error': 'Visit entry has not been approved by the student resident yet. You cannot mark completed (Resolved) until the resident approves that you can come.'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        estimated_visit_time = request.data.get('estimated_visit_time', '').strip()
        if estimated_visit_time:
            valid, err_msg = validate_working_hours_and_future_time(estimated_visit_time)
            if not valid:
                return Response({'estimated_visit_time': [err_msg], 'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)
            complaint.estimated_visit_time = estimated_visit_time

        # If admin reopening a resolved complaint
        if new_status in ['IN_PROGRESS', 'PENDING'] and complaint.status == 'RESOLVED':
            if not user.is_admin_user:
                return Response({'error': 'Only administrators can reopen a complaint.'}, status=status.HTTP_403_FORBIDDEN)
            if not remarks:
                return Response({'remarks': ['A reason must be recorded when reopening a complaint.']}, status=status.HTTP_400_BAD_REQUEST)

        prev_status = complaint.status
        prev_assignee = complaint.assignments.filter(is_current=True).first()
        complaint.status = new_status

        if new_status == 'PENDING':
            # Deactivate all active staff assignments so the complaint is unassigned
            complaint.assignments.filter(is_current=True).update(is_current=False)
            # Reset visit scheduling and visit approval
            complaint.estimated_visit_time = ''
            complaint.visit_approved = False
            complaint.visit_approved_at = None
            complaint.resolved_at = None
            complaint.closed_at = None
        elif prev_status == 'RESOLVED' and new_status == 'IN_PROGRESS':
            # Reset visit time and approval so staff asks resident again for visit time
            complaint.estimated_visit_time = ''
            complaint.visit_approved = False
            complaint.visit_approved_at = None
            complaint.resolved_at = None

        if new_status == 'RESOLVED' and not complaint.resolved_at:
            complaint.resolved_at = timezone.now()
        elif new_status == 'CLOSED' and not complaint.closed_at:
            complaint.closed_at = timezone.now()

        complaint.save()

        # Log history
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            previous_status=prev_status,
            new_status=new_status,
            changed_by=user,
            remarks=remarks
        )

        # Log activity
        log_activity(
            user,
            'STATUS_CHANGE',
            f"Changed {complaint.complaint_number} status from {prev_status} to {new_status}. Remarks: {remarks}",
            complaint
        )

        # Send notifications
        visit_prefix = ""
        if new_status == 'IN_PROGRESS' and complaint.notify_before_visit:
            visit_prefix = f"🔔 Pre-Visit Alert: Maintenance staff is arriving/commencing repair for room {complaint.room_number_snapshot}. "

        send_notification(
            recipient=complaint.student,
            title=f"Pre-Visit Alert: Work In Progress" if (new_status == 'IN_PROGRESS' and complaint.notify_before_visit) else f"Complaint Status: {complaint.get_status_display()}",
            message=f"{visit_prefix}Status of complaint {complaint.complaint_number} changed to {complaint.get_status_display()}. {remarks}".strip(),
            complaint=complaint
        )

        if new_status == 'PENDING' and prev_assignee and prev_assignee.staff:
            send_notification(
                recipient=prev_assignee.staff,
                title="Complaint Unassigned / Reset to Pending",
                message=f"Complaint {complaint.complaint_number} was reset to Pending status by Administrator ({user.full_name}). It has been removed from your active tasks.",
                complaint=complaint
            )

        return Response({
            'message': f"Status updated to {complaint.get_status_display()}.",
            'complaint': ComplaintDetailSerializer(complaint).data
        })


class ComplaintWorkLogCreateView(views.APIView):
    """Add progress message/work log to a complaint (Staff or Admin)."""
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        if complaint.status == 'CLOSED' or hasattr(complaint, 'feedback'):
            return Response({'error': 'Cannot add work logs to a closed complaint.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.is_maintenance_staff:
            if not complaint.assignments.filter(staff=user, is_current=True).exists():
                return Response({'error': 'You can only add work logs to your assigned complaints.'}, status=status.HTTP_403_FORBIDDEN)

        message = request.data.get('progress_message', '').strip()
        if not message:
            return Response({'progress_message': ['Work log message is required.']}, status=status.HTTP_400_BAD_REQUEST)

        work_log = WorkLog.objects.create(
            complaint=complaint,
            staff=user,
            progress_message=message
        )

        log_activity(user, 'WORK_LOG_ADDED', f"Added work log to {complaint.complaint_number}", complaint)

        return Response(
            {
                'message': 'Work progress logged successfully.',
                'work_log': WorkLogSerializer(work_log).data
            },
            status=status.HTTP_201_CREATED
        )


class ComplaintFeedbackCreateView(views.APIView):
    """Submit student feedback on a resolved or closed complaint."""
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk, student=request.user)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found or does not belong to you.'}, status=status.HTTP_404_NOT_FOUND)

        if complaint.status not in ['RESOLVED', 'CLOSED']:
            return Response({'error': 'Feedback can only be provided for resolved or closed complaints.'}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(complaint, 'feedback'):
            return Response({'error': 'Feedback has already been submitted for this complaint.'}, status=status.HTTP_400_BAD_REQUEST)

        rating = request.data.get('rating')
        comment = request.data.get('comment', '').strip()

        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError()
        except (TypeError, ValueError):
            return Response({'rating': ['Rating must be an integer between 1 and 5.']}, status=status.HTTP_400_BAD_REQUEST)

        feedback = Feedback.objects.create(
            complaint=complaint,
            student=request.user,
            rating=rating,
            comment=comment
        )

        prev_status = complaint.status
        complaint.status = 'CLOSED'
        complaint.closed_at = timezone.now()
        complaint.save()

        # Record Status History
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            previous_status=prev_status,
            new_status='CLOSED',
            changed_by=request.user,
            remarks=f"Ticket closed automatically upon resident feedback submission ({rating}/5 stars)."
        )

        log_activity(request.user, 'STATUS_CHANGE', f"Closed {complaint.complaint_number} upon receiving resident feedback ({rating}/5 stars).", complaint)
        log_activity(request.user, 'FEEDBACK_SUBMITTED', f"Submitted rating {rating}/5 for {complaint.complaint_number}", complaint)

        # Notify assigned staff
        current_assign = complaint.current_assignment
        if current_assign and current_assign.staff:
            send_notification(
                recipient=current_assign.staff,
                title="Complaint Closed (Feedback Received)",
                message=f"Resident {request.user.full_name} submitted {rating}/5 star feedback for complaint {complaint.complaint_number}. The ticket is now closed and finalized.",
                complaint=complaint
            )

        # Notify admins
        for admin_usr in User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True), is_active=True):
            send_notification(
                recipient=admin_usr,
                title="Complaint Closed With Feedback",
                message=f"Complaint {complaint.complaint_number} received {rating}/5 star feedback from resident {request.user.full_name} and is now closed.",
                complaint=complaint
            )

        return Response(
            {
                'message': 'Thank you! Your feedback has been recorded and the complaint is now closed.',
                'feedback': FeedbackSerializer(feedback).data,
                'complaint': ComplaintDetailSerializer(complaint).data
            },
            status=status.HTTP_201_CREATED
        )


class ComplaintStudentReopenView(views.APIView):
    """Allow student to request reopening a resolved complaint if the issue persists."""
    permission_classes = [IsStudent]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk, student=request.user)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found or does not belong to you.'}, status=status.HTTP_404_NOT_FOUND)

        if complaint.status == 'CLOSED' or hasattr(complaint, 'feedback'):
            return Response(
                {'error': 'This complaint has been finalized and closed with resident feedback. Closed complaints cannot be reopened.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if complaint.status != 'RESOLVED':
            return Response({'error': 'Only complaints in Resolved status awaiting feedback can be reopened.'}, status=status.HTTP_400_BAD_REQUEST)

        remarks = request.data.get('remarks', '').strip()
        if len(remarks) < 5:
            return Response({'remarks': ['Please provide a reason for reopening (minimum 5 characters).']}, status=status.HTTP_400_BAD_REQUEST)

        prev_status = complaint.status
        complaint.status = 'IN_PROGRESS'
        complaint.estimated_visit_time = ''
        complaint.visit_approved = False
        complaint.visit_approved_at = None
        complaint.resolved_at = None
        complaint.save()

        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            previous_status=prev_status,
            new_status='IN_PROGRESS',
            changed_by=request.user,
            remarks=f"Reopened by student: {remarks}"
        )

        log_activity(
            request.user,
            'STATUS_CHANGE',
            f"Student reopened complaint {complaint.complaint_number}: {remarks}",
            complaint
        )

        # Notify admin and staff
        admins = User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True), is_active=True)
        for admin_usr in admins:
            send_notification(
                recipient=admin_usr,
                title="Complaint Reopened by Resident",
                message=f"Student {request.user.full_name} reopened complaint {complaint.complaint_number}. Reason: {remarks}",
                complaint=complaint
            )

        current_assignee = complaint.assignments.filter(is_current=True).first()
        if current_assignee:
            send_notification(
                recipient=current_assignee.staff,
                title="Assigned Complaint Reopened",
                message=f"Complaint {complaint.complaint_number} was reopened by student. Reason: {remarks}",
                complaint=complaint
            )

        return Response({
            'message': 'Complaint has been reopened for technician review.',
            'complaint': ComplaintDetailSerializer(complaint).data
        })


class DashboardStatsView(views.APIView):
    """Real-time role-specific dashboard statistics calculated from the database."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_student:
            student_qs = Complaint.objects.filter(student=user)
            total = student_qs.count()
            pending = student_qs.filter(status='PENDING').count()
            assigned = student_qs.filter(status='ASSIGNED').count()
            in_progress = student_qs.filter(status='IN_PROGRESS').count()
            resolved = student_qs.filter(status='RESOLVED').count()
            closed = student_qs.filter(status='CLOSED').count()

            recent = ComplaintListSerializer(student_qs.order_by('-created_at')[:5], many=True).data

            return Response({
                'role': 'STUDENT',
                'stats': {
                    'total': total,
                    'pending': pending,
                    'assigned': assigned,
                    'in_progress': in_progress,
                    'resolved': resolved,
                    'closed': closed,
                    'active': pending + assigned + in_progress,
                },
                'recent_complaints': recent,
            })

        elif user.is_maintenance_staff:
            staff_qs = Complaint.objects.filter(assignments__staff=user, assignments__is_current=True).exclude(status='PENDING')
            total_assigned = staff_qs.count()
            pending_action = staff_qs.filter(status='ASSIGNED').count()
            in_progress = staff_qs.filter(status='IN_PROGRESS').count()
            resolved = staff_qs.filter(status='RESOLVED').count()
            closed = staff_qs.filter(status='CLOSED').count()
            critical_high = staff_qs.filter(priority__in=['HIGH', 'CRITICAL'], status__in=['ASSIGNED', 'IN_PROGRESS']).count()

            recent_tasks = ComplaintListSerializer(staff_qs.order_by('-updated_at')[:5], many=True).data

            return Response({
                'role': 'STAFF',
                'stats': {
                    'total_assigned': total_assigned,
                    'pending_action': pending_action,
                    'in_progress': in_progress,
                    'resolved': resolved,
                    'closed': closed,
                    'critical_high': critical_high,
                },
                'recent_tasks': recent_tasks,
            })

        else:
            # ADMIN Dashboard
            total_complaints = Complaint.objects.count()
            pending = Complaint.objects.filter(status='PENDING').count()
            assigned = Complaint.objects.filter(status='ASSIGNED').count()
            in_progress = Complaint.objects.filter(status='IN_PROGRESS').count()
            resolved = Complaint.objects.filter(status='RESOLVED').count()
            closed = Complaint.objects.filter(status='CLOSED').count()

            total_students = User.objects.filter(role='STUDENT').count()
            total_staff = User.objects.filter(role='STAFF', is_active=True).count()

            # Category Breakdown
            categories = Complaint.objects.values('category').annotate(count=Count('id'))
            cat_map = dict(Complaint.CATEGORY_CHOICES)
            category_data = [
                {'name': cat_map.get(item['category'], item['category']), 'count': item['count']}
                for item in categories
            ]

            # Priority Breakdown
            priorities = Complaint.objects.values('priority').annotate(count=Count('id'))
            prio_map = dict(Complaint.PRIORITY_CHOICES)
            priority_data = [
                {'name': prio_map.get(item['priority'], item['priority']), 'count': item['count']}
                for item in priorities
            ]

            # Average Feedback Rating
            avg_rating = Feedback.objects.aggregate(avg=Avg('rating'))['avg'] or 0.0

            # Staff Workload
            staff_workload = []
            staff_members = User.objects.filter(role='STAFF', is_active=True).order_by('id')
            for sm in staff_members:
                active_count = Complaint.objects.filter(
                    assignments__staff=sm,
                    assignments__is_current=True,
                    status__in=['ASSIGNED', 'IN_PROGRESS']
                ).count()
                resolved_count = Complaint.objects.filter(
                    assignments__staff=sm,
                    assignments__is_current=True,
                    status__in=['RESOLVED', 'CLOSED']
                ).count()
                staff_workload.append({
                    'id': sm.id,
                    'name': sm.full_name,
                    'active_tasks': active_count,
                    'completed_tasks': resolved_count,
                })

            recent_complaints = ComplaintListSerializer(
                Complaint.objects.order_by('-created_at')[:8],
                many=True
            ).data

            return Response({
                'role': 'ADMIN',
                'stats': {
                    'total_complaints': total_complaints,
                    'pending': pending,
                    'assigned': assigned,
                    'in_progress': in_progress,
                    'resolved': resolved,
                    'closed': closed,
                    'total_students': total_students,
                    'total_staff': total_staff,
                    'average_rating': round(avg_rating, 1),
                },
                'category_breakdown': category_data,
                'priority_breakdown': priority_data,
                'staff_workload': staff_workload,
                'recent_complaints': recent_complaints,
            })


class ComplaintCSVExportView(views.APIView):
    """Administrator-only: Export complaints database to CSV."""
    permission_classes = [IsAdminUserRole]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        filename = f"hostelease_complaints_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        writer.writerow([
            'Complaint Number',
            'Title',
            'Student Name',
            'Student Email',
            'Hostel Block',
            'Room Number',
            'Category',
            'Priority',
            'Status',
            'Assigned Staff',
            'Created At',
            'Resolved At',
            'Feedback Rating',
        ])

        complaints = Complaint.objects.select_related('student', 'feedback').prefetch_related('assignments__staff').all()
        for c in complaints:
            assigned = c.current_assignment.staff.full_name if c.current_assignment and c.current_assignment.staff else 'Unassigned'
            rating = c.feedback.rating if hasattr(c, 'feedback') else 'No feedback'
            writer.writerow([
                c.complaint_number,
                c.title,
                c.student.full_name,
                c.student.email,
                c.hostel_block_snapshot,
                c.room_number_snapshot,
                c.get_category_display(),
                c.get_priority_display(),
                c.get_status_display(),
                assigned,
                c.created_at.strftime('%Y-%m-%d %H:%M'),
                c.resolved_at.strftime('%Y-%m-%d %H:%M') if c.resolved_at else '',
                rating,
            ])

        log_activity(request.user, 'CSV_EXPORT', 'Exported complaints report to CSV')
        return response


class ComplaintRescheduleView(views.APIView):
    """
    Allow students to request a different appointment time/slot for their open complaint.
    Notifies assigned staff and administrators.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (user.is_admin_user or complaint.student == user):
            return Response({'error': 'You do not have permission to reschedule this complaint.'}, status=status.HTTP_403_FORBIDDEN)

        if complaint.status in ['RESOLVED', 'CLOSED']:
            return Response({'error': 'Cannot reschedule an already resolved or closed complaint.'}, status=status.HTTP_400_BAD_REQUEST)

        new_slot = request.data.get('preferred_slot', '').strip()
        reason = request.data.get('reason', '').strip()

        if not new_slot:
            return Response({'preferred_slot': ['Please provide your preferred appointment time or slot.']}, status=status.HTTP_400_BAD_REQUEST)

        valid, err_msg = validate_working_hours_and_future_time(new_slot)
        if not valid:
            return Response({'preferred_slot': [err_msg], 'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)

        old_slot = complaint.preferred_slot
        complaint.preferred_slot = new_slot
        complaint.save()

        # Record in status history / audit trail
        history_remarks = f"Student requested new appointment time: '{new_slot}'."
        if reason:
            history_remarks += f" Reason: {reason}"
        if old_slot:
            history_remarks += f" (Previous slot: '{old_slot}')"

        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            previous_status=complaint.status,
            new_status=complaint.status,
            changed_by=user,
            remarks=history_remarks
        )

        log_activity(
            user,
            'COMPLAINT_RESCHEDULED',
            f"Rescheduled {complaint.complaint_number} preferred appointment time to '{new_slot}'",
            complaint
        )

        # Notify assigned staff
        current_assign = complaint.current_assignment
        if current_assign and current_assign.staff:
            send_notification(
                recipient=current_assign.staff,
                title="Appointment Reschedule Requested",
                message=f"Student {complaint.student.full_name} for room {complaint.room_number_snapshot} requested new appointment time: '{new_slot}'. {reason}".strip(),
                complaint=complaint
            )

        # Notify admins
        for admin_usr in User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True), is_active=True):
            send_notification(
                recipient=admin_usr,
                title=f"Reschedule: {complaint.complaint_number}",
                message=f"Student {complaint.student.full_name} requested new slot '{new_slot}' for complaint {complaint.complaint_number}.",
                complaint=complaint
            )

        return Response({
            'message': f"Appointment preference updated to '{new_slot}'. Maintenance team has been notified.",
            'complaint': ComplaintDetailSerializer(complaint).data
        })


class ComplaintWithdrawView(views.APIView):
    """
    Allow students to withdraw / take back their reported complaint before staff assignment.
    Only permitted while complaint status is PENDING.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (user.is_admin_user or complaint.student == user):
            return Response({'error': 'You do not have permission to withdraw this complaint.'}, status=status.HTTP_403_FORBIDDEN)

        if complaint.status != 'PENDING':
            return Response(
                {'error': f"Complaint cannot be withdrawn because it is already {complaint.get_status_display().lower()}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '').strip()
        prev_status = complaint.status
        complaint.status = 'CLOSED'
        complaint.closed_at = timezone.now()
        complaint.save()

        remarks = f"Complaint withdrawn / taken back by student before assignment."
        if reason:
            remarks += f" Reason: {reason}"

        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            previous_status=prev_status,
            new_status='CLOSED',
            changed_by=user,
            remarks=remarks
        )

        log_activity(
            user,
            'COMPLAINT_WITHDRAWN',
            f"Withdrew complaint {complaint.complaint_number}. {remarks}",
            complaint
        )

        # Notify Administrators
        for admin_usr in User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True), is_active=True):
            send_notification(
                recipient=admin_usr,
                title=f"Complaint Withdrawn: {complaint.complaint_number}",
                message=f"Student {complaint.student.full_name} withdrew complaint {complaint.complaint_number} ({complaint.title}) before staff assignment. Reason: {reason or 'Not specified'}.",
                complaint=complaint
            )

        return Response({
            'message': f"Complaint {complaint.complaint_number} has been withdrawn successfully.",
            'complaint': ComplaintDetailSerializer(complaint).data
        })


class ComplaintUpdatePreferencesView(views.APIView):
    """
    Allow students to update visit safety, worker gender, and accompaniment preferences
    any time before the complaint is assigned to a staff member.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (user.is_admin_user or complaint.student == user):
            return Response({'error': 'You do not have permission to modify preferences for this complaint.'}, status=status.HTTP_403_FORBIDDEN)

        if complaint.status != 'PENDING':
            return Response(
                {'error': "Visit preferences can only be modified before the complaint is assigned to a staff member."},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data
        if 'preferred_worker_gender' in data:
            valid_genders = dict(Complaint.WORKER_GENDER_PREF_CHOICES).keys()
            val = data.get('preferred_worker_gender')
            if val in valid_genders:
                complaint.preferred_worker_gender = val

        if 'require_warden_presence' in data:
            complaint.require_warden_presence = bool(data.get('require_warden_presence'))

        if 'keep_door_open' in data:
            complaint.keep_door_open = bool(data.get('keep_door_open'))

        if 'preferred_slot' in data:
            pref_slot = str(data.get('preferred_slot', '')).strip()
            if pref_slot:
                valid, err_msg = validate_working_hours_and_future_time(pref_slot)
                if not valid:
                    return Response({'preferred_slot': [err_msg], 'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)
            complaint.preferred_slot = pref_slot

        if 'custom_accommodation' in data:
            complaint.custom_accommodation = str(data.get('custom_accommodation', '')).strip()

        if 'notify_before_visit' in data:
            complaint.notify_before_visit = bool(data.get('notify_before_visit'))

        complaint.save()

        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            previous_status=complaint.status,
            new_status=complaint.status,
            changed_by=user,
            remarks="Resident updated visit, staff gender, and accompaniment preferences before assignment."
        )

        log_activity(
            user,
            'PREFERENCES_UPDATED',
            f"Updated visit & accompaniment preferences for {complaint.complaint_number}",
            complaint
        )

        return Response({
            'message': 'Visit safety and accompaniment preferences updated successfully.',
            'complaint': ComplaintDetailSerializer(complaint).data
        })


class ComplaintApproveVisitView(views.APIView):
    """
    Allow student resident to approve that the maintenance technician can come to visit their room.
    Technician cannot begin the visit or mark IN_PROGRESS until this approval is given.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (user.is_admin_user or complaint.student == user):
            return Response({'error': 'You do not have permission to approve visit for this complaint.'}, status=status.HTTP_403_FORBIDDEN)

        if complaint.status in ['RESOLVED', 'CLOSED']:
            return Response({'error': 'Cannot approve visit for an already resolved or closed complaint.'}, status=status.HTTP_400_BAD_REQUEST)

        complaint.visit_approved = True
        complaint.visit_approved_at = timezone.now()
        complaint.save()

        remarks = "Resident approved technician visit: 'You can come'. Entry permitted."

        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            previous_status=complaint.status,
            new_status=complaint.status,
            changed_by=user,
            remarks=remarks
        )

        log_activity(
            user,
            'VISIT_APPROVED',
            f"Resident approved technician visit for {complaint.complaint_number}",
            complaint
        )

        # Notify assigned staff
        current_assign = complaint.current_assignment
        if current_assign and current_assign.staff:
            send_notification(
                recipient=current_assign.staff,
                title="Visit Approved: You Can Come",
                message=f"Resident {complaint.student.full_name} for room {complaint.room_number_snapshot} has approved your visit ('You can come'). You may now visit and commence repair.",
                complaint=complaint
            )

        # Notify admins
        for admin_usr in User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True), is_active=True):
            send_notification(
                recipient=admin_usr,
                title=f"Visit Approved: {complaint.complaint_number}",
                message=f"Resident {complaint.student.full_name} approved technician visit for complaint {complaint.complaint_number}.",
                complaint=complaint
            )

        return Response({
            'message': 'Visit approved! The technician has been notified that they can come to visit.',
            'complaint': ComplaintDetailSerializer(complaint).data
        })


class ComplaintScheduleVisitView(views.APIView):
    """
    Allow maintenance staff (or admin) to mention/schedule the estimated visit time.
    Sends notification to the resident student so they can approve the visit.
    """
    permission_classes = [IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({'error': 'Complaint not found.'}, status=status.HTTP_404_NOT_FOUND)

        if complaint.status == 'CLOSED' or hasattr(complaint, 'feedback'):
            return Response({'error': 'Cannot schedule visits for a closed complaint.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if user.is_maintenance_staff:
            has_assignment = complaint.assignments.filter(staff=user, is_current=True).exists()
            if not has_assignment:
                return Response({'error': 'You can only schedule visits for complaints assigned to you.'}, status=status.HTTP_403_FORBIDDEN)

        estimated_visit_time = request.data.get('estimated_visit_time', '').strip()
        if not estimated_visit_time:
            return Response({'estimated_visit_time': ['Please mention by what time you can come.']}, status=status.HTTP_400_BAD_REQUEST)

        valid, err_msg = validate_working_hours_and_future_time(estimated_visit_time)
        if not valid:
            return Response({'estimated_visit_time': [err_msg], 'error': err_msg}, status=status.HTTP_400_BAD_REQUEST)

        complaint.estimated_visit_time = estimated_visit_time
        complaint.save()

        # Log history
        remarks = f"Technician {user.full_name} mentioned arrival time: {estimated_visit_time}"
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            previous_status=complaint.status,
            new_status=complaint.status,
            changed_by=user,
            remarks=remarks
        )

        log_activity(
            user,
            'VISIT_SCHEDULED',
            f"Scheduled arrival time for {complaint.complaint_number}: {estimated_visit_time}",
            complaint
        )

        # Notify student
        send_notification(
            recipient=complaint.student,
            title="Technician Arrival Time Specified",
            message=f"Technician {user.full_name} can visit by {estimated_visit_time}. Please approve the visit ('You Can Come') so they can visit your room.",
            complaint=complaint
        )

        return Response({
            'message': f"Arrival time set to '{estimated_visit_time}'. Resident notified for visit approval.",
            'complaint': ComplaintDetailSerializer(complaint).data
        })


