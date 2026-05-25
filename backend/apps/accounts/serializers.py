from rest_framework import serializers
from .models import User
import re


class UserSerializer(serializers.ModelSerializer):
    full_name     = serializers.SerializerMethodField()
    listing_count = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'bio', 'avatar', 'phone', 'is_host', 'listing_count', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'full_name', 'listing_count']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

    def get_listing_count(self, obj):
        return obj.listings.count()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'username', 'bio', 'avatar', 'phone']

    def validate_avatar(self, value):
        if value and not value.startswith('http'):
            raise serializers.ValidationError('Avatar must be a valid URL.')
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)
    # Make name fields optional
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name  = serializers.CharField(required=False, allow_blank=True, default='')
    username   = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model  = User
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated_data):
        validated_data.pop('password2')

        # Auto-generate username from email if not provided
        username = validated_data.get('username', '').strip()
        if not username:
            base = re.sub(r'[^a-zA-Z0-9]', '', validated_data['email'].split('@')[0])[:20] or 'user'
            username = base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base}{counter}"
                counter += 1
        validated_data['username'] = username

        return User.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)
