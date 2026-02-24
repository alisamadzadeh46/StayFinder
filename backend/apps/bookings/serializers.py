from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    listing_title  = serializers.SerializerMethodField()
    listing_city   = serializers.SerializerMethodField()
    listing_country= serializers.SerializerMethodField()
    primary_image  = serializers.SerializerMethodField()
    guest_name     = serializers.SerializerMethodField()
    guest_email    = serializers.SerializerMethodField()
    guest_avatar   = serializers.SerializerMethodField()
    nights         = serializers.ReadOnlyField()

    class Meta:
        model  = Booking
        fields = [
            'id', 'listing', 'listing_title', 'listing_city', 'listing_country',
            'primary_image', 'guest', 'guest_name', 'guest_email', 'guest_avatar',
            'check_in', 'check_out', 'guests', 'total_price',
            'status', 'notes', 'nights', 'created_at',
        ]
        read_only_fields = ['id', 'guest', 'total_price', 'created_at']

    def get_listing_title(self, obj):   return obj.listing.title
    def get_listing_city(self, obj):    return obj.listing.city
    def get_listing_country(self, obj): return obj.listing.country
    def get_guest_name(self, obj):      return f"{obj.guest.first_name} {obj.guest.last_name}".strip() or obj.guest.username
    def get_guest_email(self, obj):     return obj.guest.email
    def get_guest_avatar(self, obj):    return obj.guest.avatar

    def get_primary_image(self, obj):
        img = obj.listing.images.filter(is_primary=True).first() or obj.listing.images.first()
        return img.url if img else None

    def validate(self, data):
        ci, co = data.get('check_in'), data.get('check_out')
        listing = data.get('listing')
        if ci and co:
            if co <= ci:
                raise serializers.ValidationError('Check-out must be after check-in.')
            conflicts = Booking.objects.filter(
                listing=listing, status__in=['pending', 'confirmed'],
                check_in__lt=co, check_out__gt=ci
            )
            if self.instance:
                conflicts = conflicts.exclude(pk=self.instance.pk)
            if conflicts.exists():
                raise serializers.ValidationError('These dates are not available.')
        return data

    def create(self, validated_data):
        listing = validated_data['listing']
        nights  = (validated_data['check_out'] - validated_data['check_in']).days
        validated_data['total_price'] = listing.price_per_night * nights
        return super().create(validated_data)
