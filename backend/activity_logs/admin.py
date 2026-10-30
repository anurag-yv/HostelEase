from django.contrib import admin
from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'actor', 'action', 'description', 'complaint')
    list_filter = ('action', 'timestamp')
    search_fields = ('actor__email', 'action', 'description', 'complaint__complaint_number')
    readonly_fields = ('timestamp', 'actor', 'action', 'description', 'complaint')
