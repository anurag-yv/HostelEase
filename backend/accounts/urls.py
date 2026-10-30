from django.urls import path
from .views import (
    CSRFTokenView,
    RegisterView,
    LoginView,
    LogoutView,
    CurrentUserView,
    ChangePasswordView,
    AdminUserListView,
    AdminCreateUserView,
    AdminToggleUserStatusView,
    AdminDeleteUserView,
    StaffListView,
)

app_name = 'accounts_api'

urlpatterns = [
    path('csrf/', CSRFTokenView.as_view(), name='csrf_token'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('users/create/', AdminCreateUserView.as_view(), name='admin_create_user'),
    path('users/<int:pk>/toggle-status/', AdminToggleUserStatusView.as_view(), name='admin_toggle_user_status'),
    path('users/<int:pk>/delete/', AdminDeleteUserView.as_view(), name='admin_delete_user'),
    path('staff-list/', StaffListView.as_view(), name='staff_list'),
]
