from rest_framework import serializers
from .models import (
    Complaint,
    ComplaintImage,
    StaffAssignment,
    ComplaintStatusHistory,
    WorkLog,
    Feedback
)
from accounts.serializers import UserSerializer
from .utils import validate_working_hours_and_future_time


class ComplaintImageSerializer(serializers.ModelSerializer):
    uploader_name = serializers.CharField(source='uploader.full_name', read_only=True)

    class Meta:
        model = ComplaintImage
        fields = ['id', 'image', 'uploader_name', 'uploaded_at']
        read_only_fields = ['id', 'uploader_name', 'uploaded_at']


class StaffAssignmentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)
    staff_email = serializers.CharField(source='staff.email', read_only=True)
    staff_phone = serializers.CharField(source='staff.phone_number', read_only=True)
    staff_gender = serializers.CharField(source='staff.gender', read_only=True)
    staff_gender_display = serializers.CharField(source='staff.get_gender_display', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.full_name', read_only=True)

    class Meta:
        model = StaffAssignment
        fields = [
            'id',
            'staff',
            'staff_name',
            'staff_email',
            'staff_phone',
            'staff_gender',
            'staff_gender_display',
            'assigned_by',
            'assigned_by_name',
            'assigned_at',
            'is_current',
            'remarks',
        ]
        read_only_fields = ['id', 'assigned_at']


class ComplaintStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)
    changed_by_role = serializers.CharField(source='changed_by.get_role_display', read_only=True)

    class Meta:
        model = ComplaintStatusHistory
        fields = [
            'id',
            'previous_status',
            'new_status',
            'changed_by_name',
            'changed_by_role',
            'remarks',
            'timestamp',
        ]
        read_only_fields = ['id', 'timestamp']


class WorkLogSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.full_name', read_only=True)

    class Meta:
        model = WorkLog
        fields = ['id', 'staff', 'staff_name', 'progress_message', 'timestamp']
        read_only_fields = ['id', 'staff_name', 'timestamp']


class FeedbackSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'complaint', 'student', 'student_name', 'rating', 'comment', 'timestamp']
        read_only_fields = ['id', 'student', 'student_name', 'timestamp']


class ComplaintListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    student_gender = serializers.CharField(source='student.gender', read_only=True)
    student_gender_display = serializers.CharField(source='student.get_gender_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    preferred_worker_gender_display = serializers.CharField(source='get_preferred_worker_gender_display', read_only=True)
    assigned_staff_name = serializers.SerializerMethodField()
    has_feedback = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id',
            'complaint_number',
            'title',
            'student',
            'student_name',
            'student_email',
            'student_gender',
            'student_gender_display',
            'category',
            'category_display',
            'priority',
            'priority_display',
            'status',
            'status_display',
            'hostel_block_snapshot',
            'room_number_snapshot',
            'preferred_worker_gender',
            'preferred_worker_gender_display',
            'require_warden_presence',
            'keep_door_open',
            'preferred_slot',
            'custom_accommodation',
            'notify_before_visit',
            'estimated_visit_time',
            'visit_approved',
            'visit_approved_at',
            'assigned_staff_name',
            'has_feedback',
            'created_at',
            'updated_at',
            'resolved_at',
            'closed_at',
        ]

    def get_assigned_staff_name(self, obj):
        if obj.status == 'PENDING':
            return None
        current_assign = obj.current_assignment
        return current_assign.staff.full_name if current_assign and current_assign.staff else None

    def get_has_feedback(self, obj):
        return hasattr(obj, 'feedback') and obj.feedback is not None


class ComplaintDetailSerializer(ComplaintListSerializer):
    images = ComplaintImageSerializer(many=True, read_only=True)
    assignments = StaffAssignmentSerializer(many=True, read_only=True)
    status_history = ComplaintStatusHistorySerializer(many=True, read_only=True)
    work_logs = WorkLogSerializer(many=True, read_only=True)
    feedback = FeedbackSerializer(read_only=True)

    class Meta(ComplaintListSerializer.Meta):
        fields = ComplaintListSerializer.Meta.fields + [
            'description',
            'images',
            'assignments',
            'status_history',
            'work_logs',
            'feedback',
        ]


class ComplaintCreateSerializer(serializers.ModelSerializer):
    """Used for raising new complaints by students with visit & safety preferences."""
    class Meta:
        model = Complaint
        fields = [
            'id',
            'title',
            'description',
            'category',
            'priority',
            'hostel_block_snapshot',
            'room_number_snapshot',
            'preferred_worker_gender',
            'require_warden_presence',
            'keep_door_open',
            'preferred_slot',
            'custom_accommodation',
            'notify_before_visit',
            'estimated_visit_time',
        ]
        read_only_fields = ['id', 'hostel_block_snapshot', 'room_number_snapshot']

    def validate_title(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError('Title must be at least 5 characters long.')
        return value.strip()

    def validate_description(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError('Description must be at least 10 characters long.')
        return value.strip()

    def validate_preferred_slot(self, value):
        if value and value.strip():
            valid, err_msg = validate_working_hours_and_future_time(value.strip())
            if not valid:
                raise serializers.ValidationError(err_msg)
        return value.strip() if value else ''

    def validate_estimated_visit_time(self, value):
        if value and value.strip():
            valid, err_msg = validate_working_hours_and_future_time(value.strip())
            if not valid:
                raise serializers.ValidationError(err_msg)
        return value.strip() if value else ''
