from django.db import models
from django.conf import settings
from complaints.models import Complaint


class ActivityLog(models.Model):
    """Audit log of major administrative and user actions in HostelEase."""
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    action = models.CharField('Action Type', max_length=50, db_index=True)
    description = models.TextField('Action Description')
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activity_logs'
    )
    timestamp = models.DateTimeField('Timestamp', auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = 'Activity Log'
        verbose_name_plural = 'Activity Logs'
        ordering = ['-timestamp']

    def __str__(self):
        actor_name = self.actor.full_name if self.actor else 'System'
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M')}] {actor_name}: {self.action}"


def log_activity(actor, action, description, complaint=None):
    """Helper utility to log audit actions."""
    return ActivityLog.objects.create(
        actor=actor if actor and actor.is_authenticated else None,
        action=action,
        description=description,
        complaint=complaint
    )
