from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name   = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()
    is_mine       = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = ['id', 'sender', 'sender_name', 'sender_avatar',
                  'body', 'is_read', 'is_mine', 'created_at']
        read_only_fields = ['id', 'sender', 'is_read', 'created_at']

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username

    def get_sender_avatar(self, obj):
        return obj.sender.avatar or ''

    def get_is_mine(self, obj):
        request = self.context.get('request')
        return request and obj.sender_id == request.user.id


class ConversationSerializer(serializers.ModelSerializer):
    last_message     = serializers.SerializerMethodField()
    unread_count     = serializers.SerializerMethodField()
    other_user_name  = serializers.SerializerMethodField()
    other_user_avatar= serializers.SerializerMethodField()
    listing_title    = serializers.SerializerMethodField()
    listing_image    = serializers.SerializerMethodField()

    class Meta:
        model  = Conversation
        fields = [
            'id', 'listing', 'listing_title', 'listing_image',
            'booking', 'guest', 'host',
            'other_user_name', 'other_user_avatar',
            'last_message', 'unread_count', 'updated_at',
        ]
        read_only_fields = ['id', 'guest', 'host', 'updated_at']

    def get_last_message(self, obj):
        m = obj.last_message()
        if not m:
            return None
        return {'body': m.body[:80], 'created_at': m.created_at, 'is_read': m.is_read}

    def get_unread_count(self, obj):
        request = self.context.get('request')
        return obj.unread_count(request.user) if request else 0

    def get_other_user_name(self, obj):
        request = self.context.get('request')
        if not request:
            return ''
        other = obj.host if obj.guest_id == request.user.id else obj.guest
        return f"{other.first_name} {other.last_name}".strip() or other.username

    def get_other_user_avatar(self, obj):
        request = self.context.get('request')
        if not request:
            return ''
        other = obj.host if obj.guest_id == request.user.id else obj.guest
        return other.avatar or ''

    def get_listing_title(self, obj):
        return obj.listing.title

    def get_listing_image(self, obj):
        return obj.listing.primary_image
