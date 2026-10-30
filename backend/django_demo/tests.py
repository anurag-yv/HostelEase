from django.test import TestCase, Client
from django.urls import reverse
from accounts.models import User
from complaints.models import Complaint


class DjangoDemoInterfaceBTests(TestCase):
    """Tests verifying INT253 syllabus requirements in Interface B."""

    def setUp(self):
        self.client = Client()
        self.student = User.objects.create_user(
            email='demo.student@hostel.edu',
            full_name='Demo Student',
            password='password123',
            role='STUDENT',
            hostel_block='Block A',
            room_number='101'
        )
        self.admin = User.objects.create_superuser(
            email='demo.admin@hostel.edu',
            full_name='Demo Admin',
            password='password123'
        )
        self.complaint = Complaint.objects.create(
            student=self.student,
            title='Demo Complaint for Template Testing',
            description='Detailed issue description for testing DTL rendering.',
            category='ELECTRICITY',
            priority='MEDIUM',
            status='PENDING'
        )

    def test_dashboard_template_renders_and_increments_session(self):
        """Unit III & VI: Verify template inheritance and session visit increment."""
        url = reverse('django_demo:dashboard')
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertTemplateUsed(res, 'django_demo/dashboard.html')
        self.assertTemplateUsed(res, 'django_demo/base.html')
        self.assertContains(res, 'Django Template Dashboard')
        # Check session counter
        self.assertEqual(self.client.session.get('demo_visits'), 1)

    def test_complaint_detail_url_param_and_view(self):
        """Unit II: Verify URL with parameter (/django-demo/complaints/12/)."""
        url = reverse('django_demo:complaint_detail', kwargs={'complaint_id': self.complaint.id})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertTemplateUsed(res, 'django_demo/complaint_detail.html')
        self.assertContains(res, self.complaint.complaint_number)
        self.assertContains(res, 'Demo Complaint for Template Testing')

    def test_regex_url_archive(self):
        """Unit II: Verify regex-based URL routing via re_path()."""
        url = reverse('django_demo:regex_archive_demo', kwargs={'year': 2026, 'block': 'Block-A'})
        res = self.client.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertTemplateUsed(res, 'django_demo/regex_archive.html')
        self.assertContains(res, 'Captured Year: <strong>2026</strong>')

    def test_form_validation_and_post_redirect_get(self):
        """Unit IV: Verify ModelForm validation, CSRF, and POST-Redirect-GET."""
        url = reverse('django_demo:submit_complaint')

        # 1. Invalid submission (title too short, description too short)
        res_invalid = self.client.post(url, {
            'title': 'Hi',
            'category': 'PLUMBING',
            'priority': 'LOW',
            'description': 'Short',
        })
        self.assertEqual(res_invalid.status_code, 200)
        form = res_invalid.context['form']
        self.assertFormError(form, 'title', 'Title must be at least 5 characters long.')
        self.assertFormError(form, 'description', 'Detailed description must be at least 10 characters long.')

        # 2. Valid submission triggers redirect (POST-Redirect-GET)
        res_valid = self.client.post(url, {
            'title': 'Valid Water Leakage in Room 101',
            'category': 'PLUMBING',
            'priority': 'MEDIUM',
            'description': 'Water is leaking continuously from bathroom valve.',
        })
        self.assertEqual(res_valid.status_code, 302)
        # Should redirect to complaint detail
        self.assertTrue(res_valid.url.startswith('/django-demo/complaints/'))

    def test_login_required_protection(self):
        """Unit VI: Verify @login_required protects view."""
        url = reverse('django_demo:protected_admin_demo')
        # Unauthenticated request redirects to login
        res = self.client.get(url)
        self.assertEqual(res.status_code, 302)
        self.assertIn('/django-demo/login/', res.url)

        # Student login -> view allows load but shows restriction message
        self.client.login(username='demo.student@hostel.edu', password='password123')
        res_student = self.client.get(url)
        self.assertEqual(res_student.status_code, 200)
        self.assertTemplateUsed(res_student, 'django_demo/protected_denied.html')

        # Admin login -> shows protected admin area
        self.client.login(username='demo.admin@hostel.edu', password='password123')
        res_admin = self.client.get(url)
        self.assertEqual(res_admin.status_code, 200)
        self.assertTemplateUsed(res_admin, 'django_demo/protected_admin.html')
