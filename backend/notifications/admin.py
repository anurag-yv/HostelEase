from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'title', 'complaint', 'is_read', 'timestamp')
    list_filter = ('is_read', 'timestamp')
    search_fields = ('recipient__email', 'title', 'message')
