from django.test import TestCase, Client
from django.urls import reverse
from accounts.models import User
from complaints.models import Complaint, StaffAssignment, Feedback


class ComplaintsWorkflowTests(TestCase):
    """Tests for Unit V (ORM, Models, Relationships) and Complaint Lifecycle Workflow."""

    def setUp(self):
        self.client = Client()
        self.student1 = User.objects.create_user(
            email='student1@hostel.edu',
            full_name='Student One',
            password='password123',
            role='STUDENT',
            hostel_block='Block A',
            room_number='101'
        )
        self.student2 = User.objects.create_user(
            email='student2@hostel.edu',
            full_name='Student Two',
            password='password123',
            role='STUDENT',
            hostel_block='Block B',
            room_number='202'
        )
        self.staff = User.objects.create_user(
            email='staff@hostel.edu',
            full_name='Staff Member',
            password='password123',
            role='STAFF'
        )
        self.admin = User.objects.create_superuser(
            email='admin@hostel.edu',
            full_name='Hostel Admin',
            password='password123'
        )

        # Create sample complaint for student1
        self.complaint1 = Complaint.objects.create(
            student=self.student1,
            title='Leaking Water Tap in Room 101',
            description='Water leaking from sink continuously.',
            category='PLUMBING',
            priority='HIGH',
            status='PENDING'
        )

    def test_complaint_number_generated(self):
        """Verify unique sequential complaint reference e.g., HST-2026-000001."""
        self.assertTrue(self.complaint1.complaint_number.startswith('HST-'))
        self.assertEqual(self.complaint1.hostel_block_snapshot, 'Block A')
        self.assertEqual(self.complaint1.room_number_snapshot, '101')

    def test_student_complaint_isolation(self):
        """Verify Student 2 cannot see Student 1's complaints."""
        self.client.login(email='student2@hostel.edu', password='password123')
        url = reverse('complaints_api:complaint_list_create')
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(len(res.data['results'] if 'results' in res.data else res.data), 0)

        # Student 1 sees 1 complaint
        self.client.login(email='student1@hostel.edu', password='password123')
        res1 = self.client.get(url)
        self.assertEqual(res1.status_code, 200)
        complaints_list = res1.data['results'] if 'results' in res1.data else res1.data
        self.assertEqual(len(complaints_list), 1)
        self.assertEqual(complaints_list[0]['id'], self.complaint1.id)

    def test_admin_staff_assignment(self):
        """Verify Admin can assign staff and status transitions to ASSIGNED."""
        self.client.login(email='admin@hostel.edu', password='password123')
        assign_url = reverse('complaints_api:complaint_assign', kwargs={'pk': self.complaint1.id})
        res = self.client.post(assign_url, {
            'staff_id': self.staff.id,
            'remarks': 'Please attend urgently.'
        }, content_type='application/json')

        self.assertEqual(res.status_code, 200)
        self.complaint1.refresh_from_db()
        self.assertEqual(self.complaint1.status, 'ASSIGNED')
        self.assertEqual(self.complaint1.current_assignment.staff, self.staff)

    def test_staff_status_update_and_feedback(self):
        """Verify staff marks in progress, resolved, and student provides feedback."""
        # 1. Assign to staff
        StaffAssignment.objects.create(
            complaint=self.complaint1,
            staff=self.staff,
            is_current=True
        )
        self.complaint1.status = 'ASSIGNED'
        self.complaint1.save()

        # 2. Staff updates status to IN_PROGRESS or RESOLVED (Blocked before student visit approval)
        self.client.login(email='staff@hostel.edu', password='password123')
        status_url = reverse('complaints_api:complaint_update_status', kwargs={'pk': self.complaint1.id})
        res_blocked = self.client.post(status_url, {'status': 'IN_PROGRESS', 'remarks': 'Started fixing'}, content_type='application/json')
        self.assertEqual(res_blocked.status_code, 400)
        self.assertIn('Visit entry has not been approved', res_blocked.data['error'])

        res_blocked_res = self.client.post(status_url, {'status': 'RESOLVED', 'remarks': 'Completed early'}, content_type='application/json')
        self.assertEqual(res_blocked_res.status_code, 400)
        self.assertIn('Visit entry has not been approved', res_blocked_res.data['error'])

        # 2a. Staff mentions estimated arrival time outside working hours (Rejected)
        schedule_url = reverse('complaints_api:complaint_schedule_visit', kwargs={'pk': self.complaint1.id})
        res_sched_bad = self.client.post(schedule_url, {'estimated_visit_time': 'Tomorrow at 8:30 PM'}, content_type='application/json')
        self.assertEqual(res_sched_bad.status_code, 400)
        self.assertIn('9:00 AM to 6:00 PM', res_sched_bad.data['error'])

        # 2a-2. Staff mentions valid future arrival time (9 AM - 6 PM)
        res_sched = self.client.post(schedule_url, {'estimated_visit_time': 'Tomorrow (10:00 AM – 12:00 PM)'}, content_type='application/json')
        self.assertEqual(res_sched.status_code, 200)
        self.complaint1.refresh_from_db()
        self.assertEqual(self.complaint1.estimated_visit_time, 'Tomorrow (10:00 AM – 12:00 PM)')

        # 2b. Student approves visit
        self.client.login(email='student1@hostel.edu', password='password123')
        approve_url = reverse('complaints_api:complaint_approve_visit', kwargs={'pk': self.complaint1.id})
        res_approve = self.client.post(approve_url)
        self.assertEqual(res_approve.status_code, 200)

        # 2c. Now staff successfully marks IN_PROGRESS
        self.client.login(email='staff@hostel.edu', password='password123')
        res = self.client.post(status_url, {'status': 'IN_PROGRESS', 'remarks': 'Started fixing'}, content_type='application/json')
        self.assertEqual(res.status_code, 200)

        # 3. Staff updates status to RESOLVED
        res_res = self.client.post(status_url, {'status': 'RESOLVED', 'remarks': 'Tap repaired successfully'}, content_type='application/json')
        self.assertEqual(res_res.status_code, 200)
        self.complaint1.refresh_from_db()
        self.assertEqual(self.complaint1.status, 'RESOLVED')
        self.assertIsNotNone(self.complaint1.resolved_at)

        # 4. Student submits feedback -> auto closes complaint
        self.client.login(email='student1@hostel.edu', password='password123')
        fb_url = reverse('complaints_api:complaint_feedback', kwargs={'pk': self.complaint1.id})
        fb_res = self.client.post(fb_url, {'rating': 5, 'comment': 'Great job!'}, content_type='application/json')
        self.assertEqual(fb_res.status_code, 201)
        self.assertTrue(Feedback.objects.filter(complaint=self.complaint1).exists())
        self.complaint1.refresh_from_db()
        self.assertEqual(self.complaint1.status, 'CLOSED')
        self.assertIsNotNone(self.complaint1.closed_at)

        # 5. After closure, no status change can be done by admin or staff
        self.client.login(email='admin@hostel.edu', password='password123')
        res_admin_blocked = self.client.post(status_url, {'status': 'IN_PROGRESS', 'remarks': 'Admin reopen attempt'}, content_type='application/json')
        self.assertEqual(res_admin_blocked.status_code, 400)
        self.assertIn('closed with final resident feedback', res_admin_blocked.data['error'])

        self.client.login(email='staff@hostel.edu', password='password123')
        res_staff_blocked = self.client.post(status_url, {'status': 'IN_PROGRESS', 'remarks': 'Staff update attempt'}, content_type='application/json')
        self.assertEqual(res_staff_blocked.status_code, 400)
        self.assertIn('closed with final resident feedback', res_staff_blocked.data['error'])

    def test_complaint_cannot_be_manually_closed_without_feedback(self):
        """Verify that complaints cannot be closed manually and are only closed once feedback is submitted."""
        self.client.login(email='admin@hostel.edu', password='password123')
        status_url = reverse('complaints_api:complaint_update_status', kwargs={'pk': self.complaint1.id})
        res = self.client.post(status_url, {'status': 'CLOSED', 'remarks': 'Trying to close directly'}, content_type='application/json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('Complaints cannot be manually closed', res.data['error'])

    def test_admin_reset_status_to_pending_clears_assignment(self):
        """Verify Admin resetting status to PENDING unassigns staff and clears visit scheduling."""
        # 1. Assign staff and schedule visit
        StaffAssignment.objects.create(
            complaint=self.complaint1,
            staff=self.staff,
            is_current=True
        )
        self.complaint1.status = 'ASSIGNED'
        self.complaint1.estimated_visit_time = 'Tomorrow (10:00 AM – 12:00 PM)'
        self.complaint1.visit_approved = True
        self.complaint1.save()

        # Check that it is initially assigned
        self.assertEqual(self.complaint1.current_assignment.staff, self.staff)

        # 2. Admin resets status to PENDING
        self.client.login(email='admin@hostel.edu', password='password123')
        status_url = reverse('complaints_api:complaint_update_status', kwargs={'pk': self.complaint1.id})
        res = self.client.post(status_url, {
            'status': 'PENDING',
            'remarks': 'Resetting to unassigned queue'
        }, content_type='application/json')
        self.assertEqual(res.status_code, 200)

        # 3. Verify in database
        self.complaint1.refresh_from_db()
        self.assertEqual(self.complaint1.status, 'PENDING')
        self.assertIsNone(self.complaint1.current_assignment)
        self.assertFalse(self.complaint1.assignments.filter(is_current=True).exists())
        self.assertEqual(self.complaint1.estimated_visit_time, '')
        self.assertFalse(self.complaint1.visit_approved)

        # 4. Verify serializer reports assigned_staff_name as None
        self.assertIsNone(res.data['complaint']['assigned_staff_name'])

        # 5. Verify staff dashboard/tasks exclude this complaint
        self.client.login(email='staff@hostel.edu', password='password123')
        tasks_res = self.client.get(reverse('complaints_api:complaint_list_create'))
        tasks_list = tasks_res.data.get('results', tasks_res.data) if isinstance(tasks_res.data, dict) else tasks_res.data
        staff_task_ids = [t['id'] for t in tasks_list]
        self.assertNotIn(self.complaint1.id, staff_task_ids)

        stats_res = self.client.get(reverse('complaints_api:dashboard_stats'))
        self.assertEqual(stats_res.data['stats']['total_assigned'], 0)

    def test_reopen_from_resolved_to_in_progress_clears_visit_time_and_approval(self):
        """Verify that transitioning status from RESOLVED to IN_PROGRESS resets visit timing and requires re-approval."""
        StaffAssignment.objects.create(
            complaint=self.complaint1,
            staff=self.staff,
            is_current=True
        )
        self.complaint1.status = 'RESOLVED'
        self.complaint1.estimated_visit_time = 'Today (09:00 AM – 11:00 AM)'
        self.complaint1.visit_approved = True
        self.complaint1.save()

        # Admin reopens to IN_PROGRESS
        self.client.login(email='admin@hostel.edu', password='password123')
        status_url = reverse('complaints_api:complaint_update_status', kwargs={'pk': self.complaint1.id})
        res = self.client.post(status_url, {
            'status': 'IN_PROGRESS',
            'remarks': 'Reopening due to recurring leak'
        }, content_type='application/json')
        self.assertEqual(res.status_code, 200)

        self.complaint1.refresh_from_db()
        self.assertEqual(self.complaint1.status, 'IN_PROGRESS')
        self.assertEqual(self.complaint1.estimated_visit_time, '')
        self.assertFalse(self.complaint1.visit_approved)
        self.assertIsNone(self.complaint1.visit_approved_at)

        # Staff attempts to mark RESOLVED without student visit approval -> blocked!
        self.client.login(email='staff@hostel.edu', password='password123')
        res_blocked = self.client.post(status_url, {'status': 'RESOLVED', 'remarks': 'Fixed without visit'}, content_type='application/json')
        self.assertEqual(res_blocked.status_code, 400)
        self.assertIn('Visit entry has not been approved', res_blocked.data['error'])

    def test_reassign_to_new_staff_removes_from_old_staff_and_blocks_assign_on_resolved(self):
        """Verify assigning new staff removes complaint from old staff tasks, and assigning is blocked on resolved complaints."""
        staff2 = User.objects.create_user(
            email='staff2@hostel.edu',
            full_name='Staff Two',
            password='password123',
            role='STAFF'
        )

        # 1. Initially assigned to self.staff
        StaffAssignment.objects.create(
            complaint=self.complaint1,
            staff=self.staff,
            is_current=True
        )
        self.complaint1.status = 'ASSIGNED'
        self.complaint1.estimated_visit_time = 'Today (10:00 AM – 12:00 PM)'
        self.complaint1.visit_approved = True
        self.complaint1.save()

        # 2. Reassign to staff2
        self.client.login(email='admin@hostel.edu', password='password123')
        assign_url = reverse('complaints_api:complaint_assign', kwargs={'pk': self.complaint1.id})
        res_reassign = self.client.post(assign_url, {'staff_id': staff2.id, 'remarks': 'Reassigned to Staff Two'}, content_type='application/json')
        self.assertEqual(res_reassign.status_code, 200)

        self.complaint1.refresh_from_db()
        self.assertEqual(self.complaint1.current_assignment.staff, staff2)
        self.assertEqual(self.complaint1.estimated_visit_time, '')
        self.assertFalse(self.complaint1.visit_approved)

        # 3. Verify old staff (self.staff) does NOT see this complaint in tasks or stats
        self.client.login(email='staff@hostel.edu', password='password123')
        tasks_res = self.client.get(reverse('complaints_api:complaint_list_create'))
        tasks_list = tasks_res.data.get('results', tasks_res.data) if isinstance(tasks_res.data, dict) else tasks_res.data
        staff1_task_ids = [t['id'] for t in tasks_list]
        self.assertNotIn(self.complaint1.id, staff1_task_ids)

        stats_res = self.client.get(reverse('complaints_api:dashboard_stats'))
        self.assertEqual(stats_res.data['stats']['total_assigned'], 0)

        # 4. Verify new staff (staff2) DOES see this complaint
        self.client.login(email='staff2@hostel.edu', password='password123')
        tasks_res2 = self.client.get(reverse('complaints_api:complaint_list_create'))
        tasks_list2 = tasks_res2.data.get('results', tasks_res2.data) if isinstance(tasks_res2.data, dict) else tasks_res2.data
        staff2_task_ids = [t['id'] for t in tasks_list2]
        self.assertIn(self.complaint1.id, staff2_task_ids)

        # 5. Admin resolves complaint -> Assign button / endpoint is blocked while resolved
        self.complaint1.status = 'RESOLVED'
        self.complaint1.save()
        self.client.login(email='admin@hostel.edu', password='password123')
        res_assign_resolved = self.client.post(assign_url, {'staff_id': self.staff.id, 'remarks': 'Attempting assign on resolved'}, content_type='application/json')
        self.assertEqual(res_assign_resolved.status_code, 400)
        self.assertIn('Cannot assign or reassign staff while complaint is resolved', res_assign_resolved.data['error'])
