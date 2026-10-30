from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from complaints.models import Complaint
from notifications.models import Notification, send_notification


class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            email='user.a@hostel.edu',
            full_name='Student User A',
            password='password123',
            role='STUDENT'
        )
        self.user_b = User.objects.create_user(
            email='user.b@hostel.edu',
            full_name='Student User B',
            password='password123',
            role='STUDENT'
        )

        self.complaint_a = Complaint.objects.create(
            complaint_number='HST-TEST-001',
            student=self.user_a,
            title='Tap Leaking',
            description='Bathroom tap continuously leaking',
            category='PLUMBING',
            priority='MEDIUM',
            status='PENDING'
        )

        # Create two notifications for User A
        self.notif_1 = Notification.objects.create(
            recipient=self.user_a,
            title='Notification 1',
            message='Message 1',
            complaint=self.complaint_a,
            is_read=False
        )
        self.notif_2 = Notification.objects.create(
            recipient=self.user_a,
            title='Notification 2',
            message='Message 2',
            complaint=self.complaint_a,
            is_read=False
        )

        # Create one notification for User B
        self.notif_b = Notification.objects.create(
            recipient=self.user_b,
            title='User B Alert',
            message='Message for user B',
            is_read=False
        )

    def test_notification_list_and_unread_count(self):
        """User A sees only their own notifications and unread count is exactly 2."""
        self.client.force_authenticate(user=self.user_a)
        res = self.client.get('/api/notifications/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['unread_count'], 2)
        self.assertEqual(len(res.data['notifications']), 2)

    def test_notification_mark_read_decrements_count(self):
        """Marking 1 notification as read decrements count to 1, and database is updated."""
        self.client.force_authenticate(user=self.user_a)
        res = self.client.post(f'/api/notifications/{self.notif_1.id}/read/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['unread_count'], 1)

        # Verify DB persistence
        self.notif_1.refresh_from_db()
        self.assertTrue(self.notif_1.is_read)

        # List should now show unread_count=1
        list_res = self.client.get('/api/notifications/')
        self.assertEqual(list_res.data['unread_count'], 1)

        # Mark second as read
        res_2 = self.client.post(f'/api/notifications/{self.notif_2.id}/read/')
        self.assertEqual(res_2.status_code, status.HTTP_200_OK)
        self.assertEqual(res_2.data['unread_count'], 0)

        # After both read, unread count is 0
        list_res_2 = self.client.get('/api/notifications/')
        self.assertEqual(list_res_2.data['unread_count'], 0)

    def test_notification_mark_all_read(self):
        """Mark all as read sets unread count to 0 in database and response."""
        self.client.force_authenticate(user=self.user_a)
        res = self.client.post('/api/notifications/mark-all-read/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['unread_count'], 0)

        # Check DB
        unread = Notification.objects.filter(recipient=self.user_a, is_read=False).count()
        self.assertEqual(unread, 0)

    def test_notification_user_isolation(self):
        """User A cannot mark or delete User B's notifications."""
        self.client.force_authenticate(user=self.user_a)
        res = self.client.post(f'/api/notifications/{self.notif_b.id}/read/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # User B's notification should still be unread
        self.notif_b.refresh_from_db()
        self.assertFalse(self.notif_b.is_read)

    def test_notification_delete(self):
        """Deleting a notification removes it and updates unread count."""
        self.client.force_authenticate(user=self.user_a)
        res = self.client.delete(f'/api/notifications/{self.notif_1.id}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['unread_count'], 1)
        self.assertFalse(Notification.objects.filter(id=self.notif_1.id).exists())

    def test_duplicate_prevention(self):
        """send_notification prevents rapid identical duplicates."""
        notif_a = send_notification(
            recipient=self.user_a,
            title='Duplicate Test',
            message='Identical message',
            complaint=self.complaint_a
        )
        notif_dup = send_notification(
            recipient=self.user_a,
            title='Duplicate Test',
            message='Identical message',
            complaint=self.complaint_a
        )
        # Should return the exact same object
        self.assertEqual(notif_a.id, notif_dup.id)
        # Total matching should be 1
        count = Notification.objects.filter(recipient=self.user_a, title='Duplicate Test').count()
        self.assertEqual(count, 1)
