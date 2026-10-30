from rest_framework import permissions


class IsStudent(permissions.BasePermission):
    """Allows access only to authenticated students."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'STUDENT'
        )


class IsStaffMember(permissions.BasePermission):
    """Allows access only to maintenance staff."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.role == 'STAFF'
        )


class IsAdminUserRole(permissions.BasePermission):
    """Allows access only to hostel administrators."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_superuser)
        )


class IsStaffOrAdmin(permissions.BasePermission):
    """Allows access to either staff or admin."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['STAFF', 'ADMIN'] or request.user.is_superuser)
        )
