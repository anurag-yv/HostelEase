from rest_framework import generics
from accounts.permissions import IsAdminUserRole
from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogListView(generics.ListAPIView):
    """Administrator-only audit log list."""
    permission_classes = [IsAdminUserRole]
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        queryset = ActivityLog.objects.select_related('actor', 'complaint').all().order_by('-timestamp')
        action_filter = self.request.query_params.get('action')
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        return queryset[:100]
