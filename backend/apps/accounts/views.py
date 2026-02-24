from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import (
    UserSerializer, ProfileUpdateSerializer,
    RegisterSerializer, ChangePasswordSerializer,
)


def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


@api_view(['POST'])
def register(request):
    s = RegisterSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = s.save()
    return Response(
        {'tokens': get_tokens(user), 'user': UserSerializer(user).data},
        status=201,
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile(request):
    return Response(UserSerializer(request.user).data)


@api_view(['PATCH', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def profile_update(request):
    s = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
    s.is_valid(raise_exception=True)
    s.save()
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    s = ChangePasswordSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    user = request.user
    if not user.check_password(s.validated_data['old_password']):
        return Response({'error': 'Current password is incorrect.'}, status=400)
    user.set_password(s.validated_data['new_password'])
    user.save()
    return Response({'message': 'Password updated successfully.'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def profile_stats(request):
    """Stats for the logged-in user's profile page."""
    from apps.bookings.models import Booking
    from apps.reviews.models import Review

    user = request.user
    bookings = Booking.objects.filter(guest=user)
    reviews  = Review.objects.filter(author=user)

    stats = {
        'total_trips':     bookings.count(),
        'upcoming_trips':  bookings.filter(status='confirmed').count(),
        'completed_trips': bookings.filter(status='completed').count(),
        'total_reviews':   reviews.count(),
    }

    if user.is_host:
        from apps.listings.models import Listing
        host_listings = Listing.objects.filter(host=user)
        host_bookings = Booking.objects.filter(listing__host=user)
        confirmed     = host_bookings.filter(status__in=['confirmed', 'completed'])

        all_ratings = list(
            Review.objects.filter(listing__host=user).values_list('rating', flat=True)
        )

        stats.update({
            'total_listings':   host_listings.count(),
            'active_listings':  host_listings.filter(is_active=True).count(),
            'host_bookings':    host_bookings.count(),
            'pending_bookings': host_bookings.filter(status='pending').count(),
            'total_revenue':    float(sum(b.total_price for b in confirmed)),
            'average_rating':   round(sum(all_ratings)/len(all_ratings), 2) if all_ratings else None,
            'total_host_reviews': len(all_ratings),
        })

    return Response(stats)


@api_view(['GET'])
def public_profile(request, pk):
    """Public view of any user's profile."""
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)

    data = UserSerializer(user).data
    # Don't expose sensitive fields publicly
    data.pop('email', None)
    data.pop('phone', None)
    return Response(data)
