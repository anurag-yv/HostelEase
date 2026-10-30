from django.core.management.base import BaseCommand
from accounts.models import User
from complaints.models import (
    Complaint,
    StaffAssignment,
    ComplaintStatusHistory,
    WorkLog,
    Feedback
)
from notifications.models import Notification
from activity_logs.models import ActivityLog


class Command(BaseCommand):
    help = 'Clears predefined demonstration complaints and dummy accounts so only real-time user data appears.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Clearing predefined demonstration data...'))

        # Delete predefined seed complaints (1 to 7)
        demo_complaints = Complaint.objects.filter(
            complaint_number__in=[
                'HST-2026-000001',
                'HST-2026-000002',
                'HST-2026-000003',
                'HST-2026-000004',
                'HST-2026-000005',
                'HST-2026-000006',
                'HST-2026-000007',
            ]
        )
        c_count = demo_complaints.count()
        demo_complaints.delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {c_count} predefined demonstration complaints.'))

        # Delete predefined seed students
        demo_students = User.objects.filter(
            email__in=[
                'student.aarav@hostel.edu',
                'student.priya@hostel.edu',
                'student.rohit@hostel.edu'
            ]
        )
        s_count = demo_students.count()
        demo_students.delete()
        self.stdout.write(self.style.SUCCESS(f'Deleted {s_count} predefined student demonstration accounts.'))

        # Delete predefined seed staff members if other real staff exist
        real_staff_exist = User.objects.filter(role='STAFF').exclude(email__endswith='@hostel.edu').exists()
        if real_staff_exist:
            demo_staff = User.objects.filter(
                email__in=[
                    'staff.rajesh@hostel.edu',
                    'staff.suresh@hostel.edu',
                    'staff.anil@hostel.edu',
                    'vikas.technician@hostel.edu'
                ]
            )
            staff_count = demo_staff.count()
            demo_staff.delete()
            self.stdout.write(self.style.SUCCESS(f'Deleted {staff_count} predefined staff demonstration accounts.'))

        # Clean notifications and logs pointing to nonexistent objects
        Notification.objects.filter(complaint__isnull=True, title__icontains='Demo').delete()

        self.stdout.write(self.style.SUCCESS('Predefined data successfully cleared! System is now showing only real-time data.'))
