from django.test import TestCase, Client
from django.urls import reverse
from accounts.models import User


class AccountsAuthTests(TestCase):
    """Tests for Unit I & VI: User model, Authentication, and RBAC."""

    def setUp(self):
        self.client = Client()
        self.student = User.objects.create_user(
            email='test.student@hostel.edu',
            full_name='Test Student',
            password='password123',
            role='STUDENT',
            hostel_block='Block A',
            room_number='101'
        )
        self.staff = User.objects.create_user(
            email='test.staff@hostel.edu',
            full_name='Test Staff',
            password='password123',
            role='STAFF'
        )
        self.admin = User.objects.create_superuser(
            email='test.admin@hostel.edu',
            full_name='Test Admin',
            password='password123'
        )

    def test_user_creation_and_roles(self):
        """Verify custom User model creation and role flags."""
        self.assertTrue(self.student.is_student)
        self.assertFalse(self.student.is_staff)
        self.assertTrue(self.staff.is_maintenance_staff)
        self.assertTrue(self.staff.is_staff)
        self.assertTrue(self.admin.is_admin_user)
        self.assertTrue(self.admin.is_superuser)

    def test_role_registration_support(self):
        """Verify user can register with chosen role (Student, Staff, or Admin)."""
        url = reverse('accounts_api:register')

        # Register as Admin
        admin_payload = {
            'email': 'new.admin@college.edu',
            'full_name': 'New Admin User',
            'password': 'adminpassword123',
            'confirm_password': 'adminpassword123',
            'role': 'ADMIN',
            'hostel_block': 'General',
            'room_number': 'Warden Office',
        }
        res = self.client.post(url, admin_payload, content_type='application/json')
        self.assertEqual(res.status_code, 201)
        created_admin = User.objects.get(email='new.admin@college.edu')
        self.assertEqual(created_admin.role, 'ADMIN')
        self.assertTrue(created_admin.is_staff)

        # Register as Staff
        staff_payload = {
            'email': 'new.staff@college.edu',
            'full_name': 'New Staff Member',
            'password': 'staffpassword123',
            'confirm_password': 'staffpassword123',
            'role': 'STAFF',
            'hostel_block': 'General',
            'room_number': 'Desk 1',
        }
        res_staff = self.client.post(url, staff_payload, content_type='application/json')
        self.assertEqual(res_staff.status_code, 201)
        created_staff = User.objects.get(email='new.staff@college.edu')
        self.assertEqual(created_staff.role, 'STAFF')
        self.assertTrue(created_staff.is_staff)

        # Register defaulting to Student
        student_payload = {
            'email': 'new.student@college.edu',
            'full_name': 'New Resident',
            'password': 'studentpassword123',
            'confirm_password': 'studentpassword123',
            'hostel_block': 'Block A',
            'room_number': '201',
        }
        res_stud = self.client.post(url, student_payload, content_type='application/json')
        self.assertEqual(res_stud.status_code, 201)
        created_student = User.objects.get(email='new.student@college.edu')
        self.assertEqual(created_student.role, 'STUDENT')

    def test_duplicate_email_registration_fails(self):
        """Verify duplicate email registration is rejected."""
        url = reverse('accounts_api:register')
        payload = {
            'email': 'test.student@hostel.edu',
            'full_name': 'Duplicate Student',
            'password': 'password123',
            'confirm_password': 'password123',
        }
        res = self.client.post(url, payload, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('email', res.data)

    def test_phone_number_must_be_10_digits(self):
        """Verify phone number must be exactly 10 digits."""
        url = reverse('accounts_api:register')

        # Invalid: 9 digits
        res_short = self.client.post(url, {
            'email': 'short.phone@college.edu',
            'full_name': 'Short Phone User',
            'password': 'password123',
            'confirm_password': 'password123',
            'phone_number': '987654321',
        }, content_type='application/json')
        self.assertEqual(res_short.status_code, 400)
        self.assertIn('phone_number', res_short.data)

        # Invalid: 11 digits
        res_long = self.client.post(url, {
            'email': 'long.phone@college.edu',
            'full_name': 'Long Phone User',
            'password': 'password123',
            'confirm_password': 'password123',
            'phone_number': '98765432100',
        }, content_type='application/json')
        self.assertEqual(res_long.status_code, 400)
        self.assertIn('phone_number', res_long.data)

        # Invalid: Non-digits
        res_alpha = self.client.post(url, {
            'email': 'alpha.phone@college.edu',
            'full_name': 'Alpha Phone User',
            'password': 'password123',
            'confirm_password': 'password123',
            'phone_number': '987654321a',
        }, content_type='application/json')
        self.assertEqual(res_alpha.status_code, 400)
        self.assertIn('phone_number', res_alpha.data)

        # Valid: exactly 10 digits
        res_valid = self.client.post(url, {
            'email': 'valid.phone@college.edu',
            'full_name': 'Valid Phone User',
            'password': 'password123',
            'confirm_password': 'password123',
            'phone_number': '9876543210',
        }, content_type='application/json')
        self.assertEqual(res_valid.status_code, 201)
        user = User.objects.get(email='valid.phone@college.edu')
        self.assertEqual(user.phone_number, '9876543210')

    def test_session_login_and_logout(self):
        """Verify session authentication workflow."""
        login_url = reverse('accounts_api:login')
        res = self.client.post(login_url, {
            'email': 'test.student@hostel.edu',
            'password': 'password123'
        }, content_type='application/json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['user']['email'], 'test.student@hostel.edu')

        # Check me endpoint is authenticated
        me_url = reverse('accounts_api:current_user')
        me_res = self.client.get(me_url)
        self.assertEqual(me_res.status_code, 200)

        # Logout
        logout_url = reverse('accounts_api:logout')
        logout_res = self.client.post(logout_url)
        self.assertEqual(logout_res.status_code, 200)

        # Unauthenticated access to me should now fail
        unauth_res = self.client.get(me_url)
        self.assertEqual(unauth_res.status_code, 403)

    def test_login_wrong_password_shows_wrong_credentials(self):
        """Verify registered user with wrong password gets 'Wrong credentials' error."""
        login_url = reverse('accounts_api:login')
        res = self.client.post(login_url, {
            'email': 'test.student@hostel.edu',
            'password': 'incorrect_password'
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        error_msg = str(res.data)
        self.assertIn('Wrong credentials', error_msg)

    def test_login_unregistered_email_shows_account_not_found(self):
        """Verify non-registered email gets 'Account not found' error."""
        login_url = reverse('accounts_api:login')
        res = self.client.post(login_url, {
            'email': 'unknown.resident@notfound.edu',
            'password': 'any_password'
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        error_msg = str(res.data)
        self.assertIn('Account not found', error_msg)

    def test_login_disabled_account_shows_account_disabled(self):
        """Verify disabled user gets 'Account disabled' error."""
        self.student.is_active = False
        self.student.save()
        login_url = reverse('accounts_api:login')
        res = self.client.post(login_url, {
            'email': 'test.student@hostel.edu',
            'password': 'password123'
        }, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        error_msg = str(res.data)
        self.assertIn('Account disabled', error_msg)

    def test_admin_delete_user_and_all_data(self):
        """Verify admin can permanently delete a user and all their associated data."""
        from complaints.models import Complaint
        from notifications.models import Notification

        # Create a complaint and notification for the student
        complaint = Complaint.objects.create(
            student=self.student,
            title="Broken shower handle",
            description="Shower handle snapped",
            category="PLUMBING",
            priority="HIGH",
            hostel_block_snapshot="Block A",
            room_number_snapshot="101"
        )
        Notification.objects.create(
            recipient=self.student,
            title="Ticket Received",
            message="Your complaint was submitted",
            complaint=complaint
        )

        self.assertEqual(Complaint.objects.filter(student=self.student).count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.student).count(), 1)

        # Log in as admin
        self.client.force_login(self.admin)
        delete_url = reverse('accounts_api:admin_delete_user', kwargs={'pk': self.student.pk})
        res = self.client.delete(delete_url)

        self.assertEqual(res.status_code, 200)
        self.assertFalse(User.objects.filter(pk=self.student.pk).exists())
        self.assertEqual(Complaint.objects.filter(student_id=self.student.pk).count(), 0)
        self.assertEqual(Notification.objects.filter(recipient_id=self.student.pk).count(), 0)

    def test_admin_cannot_delete_any_admin(self):
        """Verify an admin cannot delete their own account or another admin's account."""
        other_admin = User.objects.create_user(
            email='other.admin@hostel.edu',
            password='password123',
            full_name='Other Admin',
            role='ADMIN'
        )
        self.client.force_login(self.admin)
        # Attempt to delete self
        res_self = self.client.delete(reverse('accounts_api:admin_delete_user', kwargs={'pk': self.admin.pk}))
        self.assertEqual(res_self.status_code, 400)
        self.assertIn('Administrators cannot be deleted', res_self.data.get('error', ''))

        # Attempt to delete other admin
        res_other = self.client.delete(reverse('accounts_api:admin_delete_user', kwargs={'pk': other_admin.pk}))
        self.assertEqual(res_other.status_code, 400)
        self.assertIn('Administrators cannot be deleted', res_other.data.get('error', ''))
        self.assertTrue(User.objects.filter(pk=other_admin.pk).exists())

    def test_admin_cannot_disable_any_admin(self):
        """Verify an admin cannot disable their own account or another admin's account."""
        other_admin = User.objects.create_user(
            email='other.admin2@hostel.edu',
            password='password123',
            full_name='Other Admin 2',
            role='ADMIN'
        )
        self.client.force_login(self.admin)
        toggle_url = reverse('accounts_api:admin_toggle_user_status', kwargs={'pk': other_admin.pk})
        res = self.client.post(toggle_url)
        self.assertEqual(res.status_code, 400)
        self.assertIn('Administrators cannot be disabled', res.data.get('error', ''))
        other_admin.refresh_from_db()
        self.assertTrue(other_admin.is_active)

    def test_non_admin_cannot_delete_user(self):
        """Verify non-admin (student) cannot delete any user."""
        self.client.force_login(self.student)
        delete_url = reverse('accounts_api:admin_delete_user', kwargs={'pk': self.staff.pk})
        res = self.client.delete(delete_url)
        self.assertEqual(res.status_code, 403)
        self.assertTrue(User.objects.filter(pk=self.staff.pk).exists())
