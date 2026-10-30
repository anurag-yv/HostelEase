from django.contrib import admin
from .models import (
    Complaint,
    ComplaintImage,
    StaffAssignment,
    ComplaintStatusHistory,
    WorkLog,
    Feedback
)


class ComplaintImageInline(admin.TabularInline):
    model = ComplaintImage
    extra = 0
    readonly_fields = ('uploader', 'uploaded_at')


class StaffAssignmentInline(admin.TabularInline):
    model = StaffAssignment
    extra = 0
    readonly_fields = ('assigned_at',)


class ComplaintStatusHistoryInline(admin.TabularInline):
    model = ComplaintStatusHistory
    extra = 0
    readonly_fields = ('previous_status', 'new_status', 'changed_by', 'remarks', 'timestamp')
    can_delete = False


class WorkLogInline(admin.TabularInline):
    model = WorkLog
    extra = 0
    readonly_fields = ('staff', 'progress_message', 'timestamp')


class FeedbackInline(admin.StackedInline):
    model = Feedback
    extra = 0
    readonly_fields = ('student', 'rating', 'comment', 'timestamp')
    can_delete = False


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = (
        'complaint_number',
        'title',
        'student',
        'category',
        'priority',
        'status',
        'hostel_block_snapshot',
        'room_number_snapshot',
        'created_at',
    )
    list_filter = ('status', 'priority', 'category', 'hostel_block_snapshot', 'created_at')
    search_fields = ('complaint_number', 'title', 'description', 'student__email', 'student__full_name', 'room_number_snapshot')
    readonly_fields = ('complaint_number', 'created_at', 'updated_at', 'resolved_at', 'closed_at')
    inlines = [
        ComplaintImageInline,
        StaffAssignmentInline,
        ComplaintStatusHistoryInline,
        WorkLogInline,
        FeedbackInline,
    ]


@admin.register(StaffAssignment)
class StaffAssignmentAdmin(admin.ModelAdmin):
    list_display = ('complaint', 'staff', 'assigned_by', 'is_current', 'assigned_at')
    list_filter = ('is_current', 'assigned_at')
    search_fields = ('complaint__complaint_number', 'staff__email', 'staff__full_name')


@admin.register(ComplaintStatusHistory)
class ComplaintStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ('complaint', 'previous_status', 'new_status', 'changed_by', 'timestamp')
    list_filter = ('new_status', 'timestamp')
    search_fields = ('complaint__complaint_number', 'changed_by__email')
    readonly_fields = ('complaint', 'previous_status', 'new_status', 'changed_by', 'remarks', 'timestamp')


@admin.register(WorkLog)
class WorkLogAdmin(admin.ModelAdmin):
    list_display = ('complaint', 'staff', 'progress_message', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('complaint__complaint_number', 'staff__full_name', 'progress_message')


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('complaint', 'student', 'rating', 'timestamp')
    list_filter = ('rating', 'timestamp')
    search_fields = ('complaint__complaint_number', 'student__email', 'comment')
