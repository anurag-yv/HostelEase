from rest_framework import views, generics, permissions, status
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """List authenticated user's notifications, latest first."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user).order_by('-timestamp')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        unread_count = queryset.filter(is_read=False).count()
        serializer = self.get_serializer(queryset[:100], many=True)
        return Response({
            'unread_count': unread_count,
            'notifications': serializer.data
        })


class NotificationMarkReadView(views.APIView):
    """Mark a single notification as read and return updated unread count."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            if not notification.is_read:
                notification.is_read = True
                notification.save(update_fields=['is_read'])
            unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
            return Response({
                'message': 'Notification marked as read.',
                'id': notification.id,
                'is_read': True,
                'unread_count': unread_count
            })
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)


class NotificationMarkAllReadView(views.APIView):
    """Mark all notifications of authenticated user as read."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({
            'message': 'All notifications marked as read.',
            'unread_count': 0
        })


class NotificationDeleteView(views.APIView):
    """Delete a single notification owned by the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.delete()
            unread_count = Notification.objects.filter(recipient=request.user, is_read=False).count()
            return Response({
                'message': 'Notification deleted.',
                'unread_count': unread_count
            })
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)


class NotificationClearAllView(views.APIView):
    """Clear all notifications owned by the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        Notification.objects.filter(recipient=request.user).delete()
        return Response({
            'message': 'All notifications cleared.',
            'unread_count': 0
        })
