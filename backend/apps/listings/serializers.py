from rest_framework import serializers
from .models import Listing, ListingImage


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ['id', 'url', 'caption', 'is_primary', 'order']


class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    primary_image = serializers.ReadOnlyField()
    host_name = serializers.SerializerMethodField()
    host_avatar = serializers.SerializerMethodField()
    host_is_superhost = serializers.SerializerMethodField()
    seo_title = serializers.SerializerMethodField()
    seo_description = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'slug', 'host', 'host_name', 'host_avatar', 'host_is_superhost',
            'title', 'description', 'property_type',
            'price_per_night', 'address', 'city', 'state', 'country',
            'latitude', 'longitude',
            'guests', 'bedrooms', 'beds', 'bathrooms',
            'has_wifi', 'has_kitchen', 'has_parking', 'has_pool', 'has_ac',
            'has_washer', 'has_tv', 'has_gym', 'has_workspace',
            'has_fireplace', 'has_bbq', 'has_ev_charger',
            'is_active', 'images', 'primary_image',
            'average_rating', 'review_count', 'created_at',
            'seo_title', 'seo_description',
        ]
        read_only_fields = ['id', 'slug', 'host', 'created_at']

    def get_host_name(self, obj):
        return f"{obj.host.first_name} {obj.host.last_name}".strip() or obj.host.username

    def get_host_avatar(self, obj):
        return obj.host.avatar

    def get_host_is_superhost(self, obj):
        return obj.host.listings.count() >= 3

    def get_seo_title(self, obj):
        return obj.get_seo_title()

    def get_seo_description(self, obj):
        return obj.get_seo_description()


class ListingCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.URLField(), write_only=True, required=False
    )

    class Meta:
        model = Listing
        exclude = ['host', 'slug', 'created_at', 'updated_at']

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        listing = Listing.objects.create(**validated_data)
        for i, url in enumerate(images):
            ListingImage.objects.create(listing=listing, url=url, is_primary=(i == 0), order=i)
        return listing

    def update(self, instance, validated_data):
        validated_data.pop('images', None)
        return super().update(instance, validated_data)
