from django.contrib.auth import login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import status, views, generics, permissions
from rest_framework.response import Response

from .models import User
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
    AdminCreateUserSerializer
)
from .permissions import IsAdminUserRole
from activity_logs.models import ActivityLog, log_activity
from complaints.models import Complaint, Feedback
from notifications.models import Notification
from django.contrib.sessions.models import Session


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(views.APIView):
    """Returns the CSRF token and sets the csrftoken cookie."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        token = get_token(request)
        return Response({'csrfToken': token})


class RegisterView(generics.CreateAPIView):
    """Allows new students to register. Role is permanently locked to STUDENT."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        log_activity(user, 'REGISTER', f"New user registered ({user.role}): {user.email}")
        return Response(
            {
                'message': f'Registration successful as {user.get_role_display()}!',
                'user': UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )


class LoginView(views.APIView):
    """Session login endpoint with cookie creation."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        log_activity(user, 'LOGIN', f"User logged in from session: {user.email}")
        return Response({
            'message': 'Login successful.',
            'user': UserSerializer(user).data
        })


class LogoutView(views.APIView):
    """Session logout endpoint."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        log_activity(user, 'LOGOUT', f"User logged out: {user.email}")
        logout(request)
        return Response({'message': 'Logged out successfully.'})


class CurrentUserView(views.APIView):
    """Retrieve or update profile of currently logged-in user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        # Allow updating name, phone, hostel block, room number
        user.full_name = request.data.get('full_name', user.full_name)
        user.phone_number = request.data.get('phone_number', user.phone_number)
        user.hostel_block = request.data.get('hostel_block', user.hostel_block)
        user.room_number = request.data.get('room_number', user.room_number)
        user.save()
        log_activity(user, 'PROFILE_UPDATE', f"Updated profile for {user.email}")
        return Response({
            'message': 'Profile updated successfully.',
            'user': UserSerializer(user).data
        })


class ChangePasswordView(views.APIView):
    """Change current authenticated user's password."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user

        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': ['Current password is incorrect.']}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['new_password'])
        user.save()
        # Keep user logged in after password change
        login(request, user)
        log_activity(user, 'PASSWORD_CHANGE', f"Changed password for {user.email}")
        return Response({'message': 'Password updated successfully.'})


class AdminUserListView(generics.ListAPIView):
    """Admin-only list of users with optional role filtering."""
    permission_classes = [IsAdminUserRole]
    serializer_class = UserSerializer

    def get_queryset(self):
        role = self.request.query_params.get('role')
        queryset = User.objects.all().order_by('-date_joined')
        if role:
            queryset = queryset.filter(role=role)
        return queryset


class AdminCreateUserView(generics.CreateAPIView):
    """Admin endpoint to create STAFF or ADMIN users."""
    permission_classes = [IsAdminUserRole]
    serializer_class = AdminCreateUserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_activity(request.user, 'USER_CREATED', f"Created {user.role} user: {user.email}")
        return Response(
            {
                'message': f"Created user {user.full_name} ({user.role}) successfully.",
                'user': UserSerializer(user).data
            },
            status=status.HTTP_201_CREATED
        )


class AdminToggleUserStatusView(views.APIView):
    """Admin endpoint to toggle user active/inactive status."""
    permission_classes = [IsAdminUserRole]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if target_user.role == 'ADMIN':
            return Response({'error': 'Administrators cannot be disabled. Administrator accounts are protected.'}, status=status.HTTP_400_BAD_REQUEST)

        target_user.is_active = not target_user.is_active
        target_user.save()
        status_text = 'activated' if target_user.is_active else 'deactivated'
        log_activity(request.user, 'USER_STATUS_CHANGE', f"Admin {status_text} user: {target_user.email}")
        return Response({
            'message': f"User {target_user.email} has been {status_text}.",
            'user': UserSerializer(target_user).data
        })


class AdminDeleteUserView(views.APIView):
    """
    Admin endpoint to permanently delete a user and all their associated data
    from everywhere in the database:
    - Complaints & attachments (if student)
    - Assignments & work logs (if staff)
    - Notifications
    - Feedback
    - Activity logs
    - Active sessions
    - The User record itself
    """
    permission_classes = [IsAdminUserRole]

    def delete(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if target_user.role == 'ADMIN':
            return Response({'error': 'Administrators cannot be deleted. Administrator accounts are protected.'}, status=status.HTTP_400_BAD_REQUEST)

        user_email = target_user.email
        user_name = target_user.full_name
        user_role = target_user.role

        if target_user.role == 'STUDENT':
            student_complaints = Complaint.objects.filter(student=target_user)
            for c in student_complaints:
                for img in c.images.all():
                    if img.image:
                        try:
                            img.image.delete(save=False)
                        except Exception:
                            pass
            student_complaints.delete()

        if target_user.role == 'STAFF':
            assigned_complaints = Complaint.objects.filter(assignments__staff=target_user, assignments__is_current=True)
            for c in assigned_complaints:
                if c.status in ['ASSIGNED', 'IN_PROGRESS']:
                    c.status = 'PENDING'
                    c.save()
            target_user.assigned_complaints.all().delete()
            target_user.work_logs.all().delete()

        Feedback.objects.filter(student=target_user).delete()
        Notification.objects.filter(recipient=target_user).delete()
        ActivityLog.objects.filter(actor=target_user).delete()

        # Invalidate active user sessions
        for session in Session.objects.all():
            try:
                data = session.get_decoded()
                if str(data.get('_auth_user_id')) == str(target_user.id):
                    session.delete()
            except Exception:
                pass

        target_user.delete()

        log_activity(
            request.user,
            'USER_DELETED',
            f"Permanently deleted {user_role} user: {user_email} ({user_name}) and all associated records."
        )

        return Response({
            'message': f"User {user_name} ({user_email}) and all associated data have been permanently deleted.",
            'deleted_user_id': pk
        }, status=status.HTTP_200_OK)


class StaffListView(views.APIView):
    """List of active staff members for assignment dropdowns (Admin & Staff access)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        staff_qs = User.objects.filter(role='STAFF', is_active=True)
        data = [
            {
                'id': s.id,
                'full_name': s.full_name,
                'email': s.email,
                'phone_number': s.phone_number,
                'gender': s.gender,
                'gender_display': s.get_gender_display(),
            }
            for s in staff_qs
        ]
        return Response(data)
