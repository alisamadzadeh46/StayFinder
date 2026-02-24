from rest_framework import serializers
from .models import WishList


class WishListSerializer(serializers.ModelSerializer):
    listing_ids = serializers.SerializerMethodField()

    class Meta:
        model  = WishList
        fields = ['id', 'name', 'listing_ids', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_listing_ids(self, obj):
        return list(obj.listings.values_list('id', flat=True))
