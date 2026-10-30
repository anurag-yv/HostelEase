from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    complaint_number = serializers.CharField(source='complaint.complaint_number', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'complaint',
            'complaint_number',
            'is_read',
            'timestamp',
        ]
