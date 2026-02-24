from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import WishList
from apps.listings.models import Listing
from apps.listings.serializers import ListingSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def saved_listings(request):
    wl, _ = WishList.objects.get_or_create(user=request.user, name='Saved places')
    return Response(ListingSerializer(wl.listings.all(), many=True).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_save(request, listing_pk):
    try:
        listing = Listing.objects.get(pk=listing_pk)
    except Listing.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)
    wl, _ = WishList.objects.get_or_create(user=request.user, name='Saved places')
    if listing in wl.listings.all():
        wl.listings.remove(listing)
        return Response({'saved': False})
    wl.listings.add(listing)
    return Response({'saved': True})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def saved_ids(request):
    wl = WishList.objects.filter(user=request.user, name='Saved places').first()
    if not wl:
        return Response([])
    return Response(list(wl.listings.values_list('id', flat=True)))
