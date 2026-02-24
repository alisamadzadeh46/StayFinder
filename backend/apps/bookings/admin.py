from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ['listing', 'guest', 'check_in', 'check_out', 'status', 'total_price']
    list_filter   = ['status']
    search_fields = ['listing__title', 'guest__email']
    actions = ['confirm_bookings']

    def confirm_bookings(self, request, queryset):
        queryset.filter(status='pending').update(status='confirmed')
    confirm_bookings.short_description = 'Confirm selected bookings'
