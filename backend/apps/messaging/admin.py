from django.contrib import admin
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['sender', 'body', 'is_read', 'created_at']
    can_delete = False


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display  = ['id', 'listing', 'guest', 'host', 'message_count', 'updated_at']
    search_fields = ['guest__email', 'host__email', 'listing__title']
    inlines       = [MessageInline]
    readonly_fields = ['created_at', 'updated_at']

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Messages'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display  = ['sender', 'conversation', 'body_preview', 'is_read', 'created_at']
    list_filter   = ['is_read']
    search_fields = ['sender__email', 'body']

    def body_preview(self, obj):
        return obj.body[:60]
    body_preview.short_description = 'Message'
