from django.db import models
from django.conf import settings
from django.utils import timezone
from complaints.models import Complaint


class Notification(models.Model):
    """User notifications for complaint status changes, assignments, and updates."""
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Recipient'
    )
    title = models.CharField('Title', max_length=150)
    message = models.TextField('Message')
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications'
    )
    is_read = models.BooleanField('Is Read', default=False, db_index=True)
    timestamp = models.DateTimeField('Timestamp', auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-timestamp']

    def __str__(self):
        return f"To {self.recipient.email}: {self.title} ({'Read' if self.is_read else 'Unread'})"


def send_notification(recipient, title, message, complaint=None):
    """Creates a notification, deduplicating bursts within 5 seconds."""
    recent = Notification.objects.filter(
        recipient=recipient,
        title=title,
        complaint=complaint,
        timestamp__gte=timezone.now() - timezone.timedelta(seconds=5)
    ).first()
    if recent:
        return recent
    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        complaint=complaint
    )
