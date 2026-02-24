import django_filters
from .models import Listing


class ListingFilter(django_filters.FilterSet):
    min_price    = django_filters.NumberFilter(field_name='price_per_night', lookup_expr='gte')
    max_price    = django_filters.NumberFilter(field_name='price_per_night', lookup_expr='lte')
    min_guests   = django_filters.NumberFilter(field_name='guests',          lookup_expr='gte')
    min_bedrooms = django_filters.NumberFilter(field_name='bedrooms',        lookup_expr='gte')
    city         = django_filters.CharFilter(lookup_expr='icontains')
    country      = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Listing
        fields = [
            'property_type', 'city', 'country',
            'min_price', 'max_price', 'min_guests', 'min_bedrooms',
            'has_wifi', 'has_kitchen', 'has_parking', 'has_pool',
            'has_ac', 'has_washer', 'has_tv', 'has_gym',
            'has_workspace', 'has_fireplace', 'has_bbq',
        ]
