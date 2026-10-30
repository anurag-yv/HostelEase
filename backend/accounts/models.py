from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom manager for HostelEase User model using email as unique identifier."""

    def create_user(self, email, full_name, password=None, role='STUDENT', **extra_fields):
        if not email:
            raise ValueError('The Email field is required.')
        if not full_name:
            raise ValueError('The Full Name field is required.')

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            full_name=full_name,
            role=role,
            **extra_fields
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        if role == 'ADMIN':
            user.is_staff = True
            user.is_superuser = True
        elif role == 'STAFF':
            user.is_staff = True

        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(
            email=email,
            full_name=full_name,
            password=password,
            role='ADMIN',
            **extra_fields
        )


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model for HostelEase supporting STUDENT, STAFF, and ADMIN roles."""

    ROLE_CHOICES = [
        ('STUDENT', 'Student'),
        ('STAFF', 'Maintenance Staff'),
        ('ADMIN', 'Hostel Administrator'),
    ]

    BLOCK_CHOICES = [
        ('Block A', 'Block A - Boys'),
        ('Block B', 'Block B - Boys'),
        ('Block C', 'Block C - Girls'),
        ('Block D', 'Block D - Girls'),
        ('General', 'General Maintenance'),
    ]

    GENDER_CHOICES = [
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other / Prefer not to say'),
    ]

    email = models.EmailField('Email Address', unique=True, db_index=True)
    full_name = models.CharField('Full Name', max_length=150)
    role = models.CharField('Role', max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    gender = models.CharField('Gender', max_length=10, choices=GENDER_CHOICES, blank=True, default='OTHER')
    hostel_block = models.CharField('Hostel Block', max_length=50, choices=BLOCK_CHOICES, blank=True, default='Block A')
    room_number = models.CharField('Room Number', max_length=20, blank=True, default='')
    phone_number = models.CharField('Phone Number', max_length=20, blank=True, default='')

    is_active = models.BooleanField('Active', default=True)
    is_staff = models.BooleanField('Staff Status', default=False)
    date_joined = models.DateTimeField('Date Joined', default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()}) - {self.email}"

    @property
    def is_student(self):
        return self.role == 'STUDENT'

    @property
    def is_maintenance_staff(self):
        return self.role == 'STAFF'

    @property
    def is_admin_user(self):
        return self.role == 'ADMIN' or self.is_superuser
