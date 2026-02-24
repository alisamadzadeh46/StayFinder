from rest_framework.decorators import api_view
from rest_framework.response import Response
from apps.listings.models import Listing
from apps.listings.serializers import ListingSerializer
from apps.listings.filters import ListingFilter
from django.db.models import Q


def _fallback_search(request):
    """Django ORM search — always works, no ES required."""
    qs = Listing.objects.filter(is_active=True).prefetch_related('images', 'reviews')
    q = request.GET.get('q', '').strip()
    if q:
        qs = qs.filter(
            Q(title__icontains=q) |
            Q(city__icontains=q)  |
            Q(country__icontains=q) |
            Q(description__icontains=q)
        )

    qs = ListingFilter(request.GET, queryset=qs).qs

    ordering = request.GET.get('ordering', '-created_at')
    # Guard against unsafe ordering values
    safe_fields = {'price_per_night', '-price_per_night', 'created_at', '-created_at'}
    if ordering not in safe_fields:
        ordering = '-created_at'
    qs = qs.order_by(ordering)

    page      = max(1, int(request.GET.get('page', 1)))
    page_size = min(50, int(request.GET.get('page_size', 12)))
    total     = qs.count()
    qs        = qs[(page - 1) * page_size: page * page_size]

    return {
        'count':       total,
        'page':        page,
        'page_size':   page_size,
        'total_pages': max(1, (total + page_size - 1) // page_size),
        'results':     ListingSerializer(qs, many=True).data,
        'engine':      'django-orm',
    }


@api_view(['GET'])
def search_listings(request):
    page      = max(1, int(request.GET.get('page', 1)))
    page_size = min(50, int(request.GET.get('page_size', 12)))
    q         = request.GET.get('q', '').strip()

    try:
        from apps.search.documents import search_listings_es

        filters = {k: request.GET.get(k, '') for k in [
            'property_type', 'city', 'country',
            'min_price', 'max_price', 'min_guests', 'ordering',
            'has_wifi', 'has_pool', 'has_kitchen', 'has_parking',
            'has_ac', 'has_gym', 'has_workspace',
        ]}

        ids, total = search_listings_es(q, filters, page=page, page_size=page_size)

        listings_map = {
            l.id: l for l in
            Listing.objects.filter(id__in=ids).prefetch_related('images', 'reviews')
        }
        listings = [listings_map[i] for i in ids if i in listings_map]

        return Response({
            'count':       total,
            'page':        page,
            'page_size':   page_size,
            'total_pages': max(1, (total + page_size - 1) // page_size),
            'results':     ListingSerializer(listings, many=True).data,
            'engine':      'elasticsearch',
        })

    except Exception:
        # ES unavailable — fall back to ORM silently
        return Response(_fallback_search(request))


@api_view(['GET'])
def autocomplete(request):
    """City/country autocomplete — pure ORM, no ES dependency."""
    q = request.GET.get('q', '').strip()
    if not q or len(q) < 2:
        return Response([])

    cities = (
        Listing.objects
        .filter(is_active=True, city__icontains=q)
        .values_list('city', 'country')
        .distinct()[:8]
    )
    return Response([
        {'city': c, 'country': n, 'label': f"{c}, {n}"}
        for c, n in cities
    ])
