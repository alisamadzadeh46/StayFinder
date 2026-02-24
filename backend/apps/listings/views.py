from rest_framework import generics, permissions, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Listing, ListingImage
from .serializers import ListingSerializer, ListingCreateSerializer
from .filters import ListingFilter


class IsHostOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.host == request.user


class ListingListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ListingFilter
    search_fields = ['title', 'city', 'country', 'description', 'address']
    ordering_fields = ['price_per_night', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return Listing.objects.filter(is_active=True).prefetch_related('images', 'reviews')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ListingCreateSerializer
        return ListingSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        user = self.request.user
        user.is_host = True
        user.save(update_fields=['is_host'])
        serializer.save(host=self.request.user)


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Listing.objects.all().prefetch_related('images', 'reviews')
    permission_classes = [IsHostOrReadOnly]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ListingCreateSerializer
        return ListingSerializer


# ─── Host Dashboard ───────────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def host_listings(request):
    listings = Listing.objects.filter(host=request.user).prefetch_related('images', 'reviews', 'bookings')
    serializer = ListingSerializer(listings, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def host_stats(request):
    from apps.bookings.models import Booking
    listings = Listing.objects.filter(host=request.user)
    bookings = Booking.objects.filter(listing__host=request.user)

    total_revenue = sum(
        b.total_price for b in bookings.filter(status__in=['confirmed', 'completed'])
    )
    pending_bookings = bookings.filter(status='pending').count()
    confirmed_bookings = bookings.filter(status='confirmed').count()
    total_guests = sum(b.guests for b in bookings.filter(status__in=['confirmed', 'completed']))

    # Ratings across all listings
    all_reviews = []
    for listing in listings:
        all_reviews.extend(listing.reviews.values_list('rating', flat=True))
    avg_rating = round(sum(all_reviews) / len(all_reviews), 2) if all_reviews else None

    return Response({
        'total_listings': listings.count(),
        'active_listings': listings.filter(is_active=True).count(),
        'total_bookings': bookings.count(),
        'pending_bookings': pending_bookings,
        'confirmed_bookings': confirmed_bookings,
        'total_revenue': float(total_revenue),
        'total_guests': total_guests,
        'average_rating': avg_rating,
        'total_reviews': len(all_reviews),
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def host_dashboard_bookings(request):
    from apps.bookings.models import Booking
    from apps.bookings.serializers import BookingSerializer
    bookings = Booking.objects.filter(
        listing__host=request.user
    ).select_related('listing', 'guest').order_by('-created_at')
    serializer = BookingSerializer(bookings, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_listing_image(request, pk):
    try:
        listing = Listing.objects.get(pk=pk, host=request.user)
    except Listing.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)
    url = request.data.get('url')
    is_primary = request.data.get('is_primary', False)
    if not url:
        return Response({'error': 'URL required.'}, status=400)
    order = listing.images.count()
    image = ListingImage.objects.create(listing=listing, url=url, is_primary=is_primary, order=order)
    return Response({'id': image.id, 'url': image.url}, status=201)
