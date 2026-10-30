import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


def validate_10_digit_phone(value):
    """Enforce mobile number to be exactly 10 digits."""
    if not value:
        return value
    val = str(value).strip()
    if val and not re.fullmatch(r'\d{10}', val):
        raise serializers.ValidationError('Mobile number must be exactly 10 digits.')
    return val


class UserSerializer(serializers.ModelSerializer):
    """Public/Authenticated User details serializer."""
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    gender_display = serializers.CharField(source='get_gender_display', read_only=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, validators=[validate_10_digit_phone])

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'role',
            'role_display',
            'gender',
            'gender_display',
            'hostel_block',
            'room_number',
            'phone_number',
            'is_active',
            'is_staff',
            'date_joined',
        ]
        read_only_fields = ['id', 'role', 'role_display', 'gender_display', 'is_active', 'is_staff', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    """User registration serializer supporting Student, Staff, and Warden/Administrator roles."""
    password = serializers.CharField(write_only=True, min_length=6, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='STUDENT', required=False)
    gender = serializers.ChoiceField(choices=User.GENDER_CHOICES, default='OTHER', required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True, validators=[validate_10_digit_phone])

    class Meta:
        model = User
        fields = [
            'email',
            'full_name',
            'role',
            'gender',
            'password',
            'confirm_password',
            'hostel_block',
            'room_number',
            'phone_number',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        role = validated_data.pop('role', 'STUDENT')
        user = User.objects.create_user(
            role=role,
            password=password,
            **validated_data
        )
        return user


class LoginSerializer(serializers.Serializer):
    """Session login serializer."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    role = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        email = attrs.get('email', '').strip().lower()
        password = attrs.get('password', '')
        expected_role = attrs.get('role', '').strip().upper()

        if not email or not password:
            raise serializers.ValidationError('Both email and password are required.')

        user_exists = User.objects.filter(email=email).first()
        if not user_exists:
            raise serializers.ValidationError('Account not found. No account is registered with this email address.')

        if not user_exists.is_active:
            raise serializers.ValidationError('Account disabled. This user account has been deactivated. Please contact the administrator.')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError('Wrong credentials. The password you entered is incorrect.')

        if expected_role and user.role != expected_role:
            role_names = dict(User.ROLE_CHOICES)
            expected_name = role_names.get(expected_role, expected_role)
            actual_name = user.get_role_display()
            raise serializers.ValidationError(
                f"Role mismatch. This account is registered as a {actual_name}, not {expected_name}. Please switch to the {actual_name} tab to log in."
            )

        attrs['user'] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Change current password serializer."""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_new_password']:
            raise serializers.ValidationError({'confirm_new_password': 'New passwords do not match.'})
        return attrs


class AdminCreateUserSerializer(serializers.ModelSerializer):
    """Admin-only user creation (used to create STAFF or ADMIN)."""
    password = serializers.CharField(write_only=True, min_length=6)
    gender = serializers.ChoiceField(choices=User.GENDER_CHOICES, default='MALE', required=False)
    phone_number = serializers.CharField(required=False, allow_blank=True, validators=[validate_10_digit_phone])

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'role',
            'gender',
            'password',
            'hostel_block',
            'room_number',
            'phone_number',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        return User.objects.create_user(password=password, **validated_data)
