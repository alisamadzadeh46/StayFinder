from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html, mark_safe
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['avatar_thumb', 'email', 'full_name', 'username',
                     'is_host_display', 'listing_count', 'is_active', 'is_staff', 'created_at']
    list_filter   = ['is_host', 'is_staff', 'is_active', 'created_at']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering      = ['-created_at']
    readonly_fields = ['created_at', 'avatar_preview', 'listing_count_ro', 'booking_count_ro']

    fieldsets = (
        ('Account', {
            'fields': ('email', 'username', 'password')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'phone', 'bio', 'avatar', 'avatar_preview'),
        }),
        ('Host Status', {
            'fields': ('is_host', 'listing_count_ro', 'booking_count_ro'),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined', 'created_at'),
            'classes': ('collapse',),
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name',
                       'password1', 'password2', 'is_host'),
        }),
    )

    def avatar_thumb(self, obj):
        if obj.avatar:
            return format_html(
                '<img src="{}" style="width:36px;height:36px;border-radius:50%;'
                'object-fit:cover;border:2px solid #e8e8e8;" />',
                obj.avatar
            )
        initials = ((obj.first_name or obj.email)[0]).upper()
        return format_html(
            '<div style="width:36px;height:36px;border-radius:50%;background:#E8472A;'
            'color:white;display:flex;align-items:center;justify-content:center;'
            'font-weight:700;font-size:14px;line-height:36px;text-align:center;">{}</div>',
            initials
        )
    avatar_thumb.short_description = ''

    def full_name(self, obj):
        name = f'{obj.first_name} {obj.last_name}'.strip()
        return name if name else '—'
    full_name.short_description = 'Name'

    def is_host_display(self, obj):
        # format_html REQUIRES at least one {} + arg — use mark_safe for static HTML
        if obj.is_host:
            return mark_safe('<span style="color:#15803d;font-weight:600;">&#10003; Host</span>')
        return mark_safe('<span style="color:#aaa;">Guest</span>')
    is_host_display.short_description = 'Role'

    def listing_count(self, obj):
        n = obj.listings.count()
        if n == 0:
            return '—'
        s = 's' if n != 1 else ''
        return format_html(
            '<a href="/admin/listings/listing/?host__id__exact={}">{} listing{}</a>',
            obj.pk, n, s
        )
    listing_count.short_description = 'Listings'

    def avatar_preview(self, obj):
        if obj.avatar:
            return format_html(
                '<img src="{}" style="max-height:120px;border-radius:8px;'
                'border:1px solid #ddd;margin:4px 0;" />',
                obj.avatar
            )
        return '—'
    avatar_preview.short_description = 'Avatar preview'

    def listing_count_ro(self, obj):
        return obj.listings.count()
    listing_count_ro.short_description = 'Total listings'

    def booking_count_ro(self, obj):
        return obj.bookings.count()
    booking_count_ro.short_description = 'Total bookings (as guest)'
