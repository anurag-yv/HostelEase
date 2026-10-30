from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from accounts.models import User
from complaints.models import (
    Complaint,
    StaffAssignment,
    ComplaintStatusHistory,
    WorkLog,
    Feedback
)
from notifications.models import Notification
from activity_logs.models import ActivityLog


class Command(BaseCommand):
    help = 'Seeds realistic demonstration data for INT253 viva examination and testing.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding HostelEase demonstration data...'))

        # 1. Create Administrator
        admin_user, created = User.objects.get_or_create(
            email='admin@hostel.edu',
            defaults={
                'full_name': 'Dr. Raman Sharma (Chief Warden)',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'hostel_block': 'General',
                'room_number': 'Warden Office 1',
                'phone_number': '+91 98765 43210',
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created Admin: admin@hostel.edu / admin123'))
        else:
            admin_user.set_password('admin123')
            admin_user.save()

        # 2. Create Maintenance Staff
        staff_data = [
            {
                'email': 'staff.rajesh@hostel.edu',
                'full_name': 'Rajesh Kumar (Electrician)',
                'phone': '+91 98111 22334',
            },
            {
                'email': 'staff.suresh@hostel.edu',
                'full_name': 'Suresh Verma (Plumber)',
                'phone': '+91 98222 33445',
            },
            {
                'email': 'staff.anil@hostel.edu',
                'full_name': 'Anil Yadav (Carpenter)',
                'phone': '+91 98333 44556',
            },
        ]
        staff_objects = {}
        for s in staff_data:
            user, s_created = User.objects.get_or_create(
                email=s['email'],
                defaults={
                    'full_name': s['full_name'],
                    'role': 'STAFF',
                    'is_staff': True,
                    'hostel_block': 'General',
                    'phone_number': s['phone'],
                }
            )
            user.set_password('staff123')
            user.save()
            staff_objects[s['email']] = user
            if s_created:
                self.stdout.write(self.style.SUCCESS(f"Created Staff: {s['email']} / staff123"))

        # 3. Create Students
        student_data = [
            {
                'email': 'student.aarav@hostel.edu',
                'full_name': 'Aarav Patel',
                'block': 'Block A',
                'room': '204',
                'phone': '+91 99000 11223',
            },
            {
                'email': 'student.priya@hostel.edu',
                'full_name': 'Priya Singh',
                'block': 'Block C',
                'room': '312',
                'phone': '+91 99111 22334',
            },
            {
                'email': 'student.rohit@hostel.edu',
                'full_name': 'Rohit Sharma',
                'block': 'Block B',
                'room': '105',
                'phone': '+91 99222 33445',
            },
        ]
        student_objects = {}
        for st in student_data:
            user, st_created = User.objects.get_or_create(
                email=st['email'],
                defaults={
                    'full_name': st['full_name'],
                    'role': 'STUDENT',
                    'hostel_block': st['block'],
                    'room_number': st['room'],
                    'phone_number': st['phone'],
                }
            )
            user.set_password('student123')
            user.save()
            student_objects[st['email']] = user
            if st_created:
                self.stdout.write(self.style.SUCCESS(f"Created Student: {st['email']} / student123"))

        now = timezone.now()

        # 4. Create Complaints Across All Statuses
        complaints_data = [
            {
                'number': 'HST-2026-000001',
                'student': student_objects['student.aarav@hostel.edu'],
                'title': 'Severe water pipe leakage in bathroom ceiling',
                'desc': 'Water is continuously dripping from the false ceiling in the attached bathroom of Room 204. It risks short circuiting the light bulb.',
                'cat': 'PLUMBING',
                'prio': 'HIGH',
                'status': 'RESOLVED',
                'block': 'Block A',
                'room': '204',
                'staff': staff_objects['staff.suresh@hostel.edu'],
                'worklog': 'Replaced broken seal in overhead PVC pipe elbow. Leakage completely stopped.',
                'feedback_rating': 5,
                'feedback_comment': 'Excellent fast response! Mr. Suresh fixed the pipe within 2 hours.',
                'resolved_at': now - timedelta(days=1),
            },
            {
                'number': 'HST-2026-000002',
                'student': student_objects['student.priya@hostel.edu'],
                'title': 'Ceiling fan regulator damaged and fan running at full speed',
                'desc': 'The fan speed regulator knob in Room 312 broke off. Fan is stuck at maximum speed which disturbs sleep and study.',
                'cat': 'ELECTRICITY',
                'prio': 'MEDIUM',
                'status': 'IN_PROGRESS',
                'block': 'Block C',
                'room': '312',
                'staff': staff_objects['staff.rajesh@hostel.edu'],
                'worklog': 'Inspected switchboard. Ordered replacement 5-step modular regulator from hostel inventory.',
                'feedback_rating': None,
                'resolved_at': None,
            },
            {
                'number': 'HST-2026-000003',
                'student': student_objects['student.rohit@hostel.edu'],
                'title': '2nd Floor Wi-Fi Access Point giving No Internet error',
                'desc': 'The Wi-Fi router on corridor 2nd floor has red LOS light blinking. None of the students on this wing can attend online labs.',
                'cat': 'WIFI',
                'prio': 'CRITICAL',
                'status': 'ASSIGNED',
                'block': 'Block B',
                'room': '105',
                'staff': staff_objects['staff.rajesh@hostel.edu'],
                'worklog': None,
                'feedback_rating': None,
                'resolved_at': None,
            },
            {
                'number': 'HST-2026-000004',
                'student': student_objects['student.aarav@hostel.edu'],
                'title': 'Study chair armrest cracked and loose',
                'desc': 'The wooden study chair provided with the desk has a fractured left armrest and wobbly leg screws.',
                'cat': 'FURNITURE',
                'prio': 'LOW',
                'status': 'CLOSED',
                'block': 'Block A',
                'room': '204',
                'staff': staff_objects['staff.anil@hostel.edu'],
                'worklog': 'Replaced cracked armrest with polished teak piece and tightened all support screws.',
                'feedback_rating': 4,
                'feedback_comment': 'Good repair work, chair is steady now.',
                'resolved_at': now - timedelta(days=3),
                'closed_at': now - timedelta(days=2),
            },
            {
                'number': 'HST-2026-000005',
                'student': student_objects['student.priya@hostel.edu'],
                'title': 'Corridor dustbin overflowing and floor not swept',
                'desc': 'Common trash can near water dispenser has not been emptied for 2 days. Bad smell developing.',
                'cat': 'CLEANLINESS',
                'prio': 'LOW',
                'status': 'PENDING',
                'block': 'Block C',
                'room': '312',
                'staff': None,
                'worklog': None,
                'feedback_rating': None,
                'resolved_at': None,
            },
            {
                'number': 'HST-2026-000006',
                'student': student_objects['student.rohit@hostel.edu'],
                'title': 'Power socket sparking when laptop charger plugged in',
                'desc': 'Major sparking hazard observed near study desk power outlet in Room 105. Black soot marks on the plastic plate.',
                'cat': 'ELECTRICITY',
                'prio': 'CRITICAL',
                'status': 'IN_PROGRESS',
                'block': 'Block B',
                'room': '105',
                'staff': staff_objects['staff.rajesh@hostel.edu'],
                'worklog': 'Isolated the circuit breaker. Removing damaged 16A socket and replacing with ceramic fireproof base.',
                'feedback_rating': None,
                'resolved_at': None,
            },
        ]

        for cd in complaints_data:
            comp, c_created = Complaint.objects.get_or_create(
                complaint_number=cd['number'],
                defaults={
                    'student': cd['student'],
                    'title': cd['title'],
                    'description': cd['desc'],
                    'category': cd['cat'],
                    'priority': cd['prio'],
                    'status': cd['status'],
                    'hostel_block_snapshot': cd['block'],
                    'room_number_snapshot': cd['room'],
                    'resolved_at': cd.get('resolved_at'),
                    'closed_at': cd.get('closed_at'),
                }
            )

            # Assignment
            if cd.get('staff'):
                assign, a_created = StaffAssignment.objects.get_or_create(
                    complaint=comp,
                    staff=cd['staff'],
                    defaults={
                        'assigned_by': admin_user,
                        'is_current': True,
                        'remarks': 'Assigned by Chief Warden for prompt action.'
                    }
                )

            # Worklog
            if cd.get('worklog') and cd.get('staff'):
                WorkLog.objects.get_or_create(
                    complaint=comp,
                    staff=cd['staff'],
                    progress_message=cd['worklog']
                )

            # Status history
            ComplaintStatusHistory.objects.get_or_create(
                complaint=comp,
                previous_status='NONE',
                new_status='PENDING',
                changed_by=comp.student,
                remarks='Initial complaint submission'
            )
            if cd['status'] != 'PENDING':
                ComplaintStatusHistory.objects.get_or_create(
                    complaint=comp,
                    previous_status='PENDING',
                    new_status='ASSIGNED',
                    changed_by=admin_user,
                    remarks=f"Assigned to {cd['staff'].full_name if cd['staff'] else 'Staff'}"
                )
            if cd['status'] in ['IN_PROGRESS', 'RESOLVED', 'CLOSED']:
                ComplaintStatusHistory.objects.get_or_create(
                    complaint=comp,
                    previous_status='ASSIGNED',
                    new_status='IN_PROGRESS',
                    changed_by=cd['staff'],
                    remarks='Staff inspected site and initiated maintenance work.'
                )
            if cd['status'] in ['RESOLVED', 'CLOSED']:
                ComplaintStatusHistory.objects.get_or_create(
                    complaint=comp,
                    previous_status='IN_PROGRESS',
                    new_status='RESOLVED',
                    changed_by=cd['staff'],
                    remarks='Repairs finalized and verified.'
                )
            if cd['status'] == 'CLOSED':
                ComplaintStatusHistory.objects.get_or_create(
                    complaint=comp,
                    previous_status='RESOLVED',
                    new_status='CLOSED',
                    changed_by=admin_user,
                    remarks='Complaint officially closed after student satisfaction confirmed.'
                )

            # Feedback
            if cd.get('feedback_rating'):
                Feedback.objects.get_or_create(
                    complaint=comp,
                    defaults={
                        'student': comp.student,
                        'rating': cd['feedback_rating'],
                        'comment': cd.get('feedback_comment', '')
                    }
                )

            # Activity log
            ActivityLog.objects.get_or_create(
                actor=comp.student,
                action='COMPLAINT_CREATED',
                description=f"Raised complaint {comp.complaint_number}",
                complaint=comp
            )

            # Notification for student
            Notification.objects.get_or_create(
                recipient=comp.student,
                title=f"Complaint {comp.complaint_number} Status",
                message=f"Current status is: {comp.get_status_display()}",
                complaint=comp
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all demonstration users, complaints, assignments, work logs, and feedback!'))
