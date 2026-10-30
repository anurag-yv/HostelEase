from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


def generate_complaint_number():
    """Generates unique sequential complaint reference e.g., HST-2026-000001."""
    year = timezone.now().year
    last_comp = Complaint.objects.filter(
        complaint_number__startswith=f"HST-{year}-"
    ).order_by('-id').first()

    if last_comp and last_comp.complaint_number:
        try:
            seq = int(last_comp.complaint_number.split('-')[-1]) + 1
        except (ValueError, IndexError):
            seq = Complaint.objects.count() + 1
    else:
        seq = Complaint.objects.count() + 1
    return f"HST-{year}-{seq:06d}"


class Complaint(models.Model):
    """Core Complaint model representing hostel maintenance requests."""

    CATEGORY_CHOICES = [
        ('ELECTRICITY', 'Electricity Issues'),
        ('PLUMBING', 'Plumbing Issues'),
        ('WIFI', 'Wi-Fi / Internet Issues'),
        ('FURNITURE', 'Furniture Damage'),
        ('CLEANLINESS', 'Cleanliness Issues'),
        ('OTHER', 'Other Issues'),
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]

    WORKER_GENDER_PREF_CHOICES = [
        ('ANY', 'No Preference (Any Qualified Staff)'),
        ('SAME', 'Same-Gender Staff Only'),
    ]

    complaint_number = models.CharField(
        'Complaint Number',
        max_length=30,
        unique=True,
        editable=False,
        db_index=True
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='complaints',
        verbose_name='Student'
    )
    title = models.CharField('Title', max_length=200)
    description = models.TextField('Description')
    category = models.CharField('Category', max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField('Priority', max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    status = models.CharField('Status', max_length=15, choices=STATUS_CHOICES, default='PENDING', db_index=True)

    hostel_block_snapshot = models.CharField('Hostel Block Snapshot', max_length=50)
    room_number_snapshot = models.CharField('Room Number Snapshot', max_length=20)

    # Student safety, accommodation & visit preferences
    preferred_worker_gender = models.CharField(
        'Preferred Worker Gender',
        max_length=10,
        choices=WORKER_GENDER_PREF_CHOICES,
        default='ANY'
    )
    require_warden_presence = models.BooleanField(
        'Require Warden or Staff Escort',
        default=False,
        help_text='Request a warden or authorized staff member to accompany the worker during room entry'
    )
    keep_door_open = models.BooleanField(
        'Keep Door Open',
        default=False,
        help_text='Request that the repair be performed with the room door open, where safe and permitted'
    )
    preferred_slot = models.CharField(
        'Preferred Appointment Slot',
        max_length=100,
        blank=True,
        default='',
        help_text='Preferred appointment time or availability window'
    )
    custom_accommodation = models.TextField(
        'Alternative Location / Accommodation',
        blank=True,
        default='',
        help_text='Request an alternative location or other reasonable accommodation'
    )
    notify_before_visit = models.BooleanField(
        'Notify Student Before Visit',
        default=True,
        help_text='Notify the student before the technician visit'
    )
    estimated_visit_time = models.CharField(
        'Estimated Visit Time',
        max_length=120,
        blank=True,
        default='',
        help_text='Estimated arrival or visit time mentioned by staff (e.g., Today at 4:30 PM)'
    )
    visit_approved = models.BooleanField(
        'Student Visit Entry Approved',
        default=False,
        help_text='Whether the student has approved that the technician can come to visit the room'
    )
    visit_approved_at = models.DateTimeField(
        'Visit Entry Approved At',
        null=True,
        blank=True
    )

    created_at = models.DateTimeField('Created At', auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField('Updated At', auto_now=True)
    resolved_at = models.DateTimeField('Resolved At', null=True, blank=True)
    closed_at = models.DateTimeField('Closed At', null=True, blank=True)

    class Meta:
        verbose_name = 'Complaint'
        verbose_name_plural = 'Complaints'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.complaint_number} - {self.title} [{self.get_status_display()}]"

    def save(self, *args, **kwargs):
        if not self.complaint_number:
            self.complaint_number = generate_complaint_number()
        # Take snapshot of student location if not provided
        if not self.hostel_block_snapshot and self.student:
            self.hostel_block_snapshot = self.student.hostel_block
        if not self.room_number_snapshot and self.student:
            self.room_number_snapshot = self.student.room_number
        super().save(*args, **kwargs)

    @property
    def current_assignment(self):
        if self.status == 'PENDING':
            return None
        return self.assignments.filter(is_current=True).first()


class ComplaintImage(models.Model):
    """Images attached to a complaint."""
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField('Complaint Image', upload_to='complaints/%Y/%m/')
    uploader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    uploaded_at = models.DateTimeField('Uploaded At', auto_now_add=True)

    class Meta:
        verbose_name = 'Complaint Image'
        verbose_name_plural = 'Complaint Images'
        ordering = ['uploaded_at']

    def __str__(self):
        return f"Image for {self.complaint.complaint_number} ({self.id})"


class StaffAssignment(models.Model):
    """Staff assignment history for complaints."""
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assigned_complaints',
        verbose_name='Assigned Staff'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assignments_made',
        verbose_name='Assigned By Admin'
    )
    assigned_at = models.DateTimeField('Assigned At', auto_now_add=True)
    is_current = models.BooleanField('Current Assignment', default=True)
    remarks = models.TextField('Assignment Remarks', blank=True, default='')

    class Meta:
        verbose_name = 'Staff Assignment'
        verbose_name_plural = 'Staff Assignments'
        ordering = ['-assigned_at']

    def __str__(self):
        return f"{self.complaint.complaint_number} -> {self.staff.full_name} (Current: {self.is_current})"


class ComplaintStatusHistory(models.Model):
    """Audit log of status changes for each complaint."""
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    previous_status = models.CharField('Previous Status', max_length=20)
    new_status = models.CharField('New Status', max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    remarks = models.TextField('Remarks', blank=True, default='')
    timestamp = models.DateTimeField('Timestamp', auto_now_add=True)

    class Meta:
        verbose_name = 'Complaint Status History'
        verbose_name_plural = 'Complaint Status Histories'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.complaint.complaint_number}: {self.previous_status} -> {self.new_status}"


class WorkLog(models.Model):
    """Staff progress logs on active complaints."""
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='work_logs'
    )
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='work_logs'
    )
    progress_message = models.TextField('Progress Message')
    timestamp = models.DateTimeField('Timestamp', auto_now_add=True)

    class Meta:
        verbose_name = 'Work Log'
        verbose_name_plural = 'Work Logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"WorkLog by {self.staff.full_name} on {self.complaint.complaint_number}"


class Feedback(models.Model):
    """Student satisfaction feedback for resolved complaints."""
    complaint = models.OneToOneField(
        Complaint,
        on_delete=models.CASCADE,
        related_name='feedback'
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='feedbacks'
    )
    rating = models.IntegerField(
        'Rating (1-5)',
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField('Feedback Comment', blank=True, default='')
    timestamp = models.DateTimeField('Timestamp', auto_now_add=True)

    class Meta:
        verbose_name = 'Complaint Feedback'
        verbose_name_plural = 'Complaint Feedbacks'
        ordering = ['-timestamp']

    def __str__(self):
        return f"Rating {self.rating}/5 for {self.complaint.complaint_number}"
