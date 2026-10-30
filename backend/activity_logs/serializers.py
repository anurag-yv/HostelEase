from rest_framework import serializers
from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)
    actor_role = serializers.CharField(source='actor.get_role_display', read_only=True)
    complaint_number = serializers.CharField(source='complaint.complaint_number', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'actor_name',
            'actor_role',
            'action',
            'description',
            'complaint_number',
            'timestamp',
        ]
