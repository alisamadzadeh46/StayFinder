from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Booking
from .serializers import BookingSerializer


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(guest=self.request.user).select_related('listing', 'guest')

    def perform_create(self, serializer):
        serializer.save(guest=self.request.user)


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(guest=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_booking(request, pk):
    try:
        booking = Booking.objects.get(pk=pk, guest=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)
    if booking.status not in ('pending', 'confirmed'):
        return Response({'error': 'Cannot cancel this booking.'}, status=400)
    booking.status = 'cancelled'
    booking.save()
    return Response(BookingSerializer(booking).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_booking(request, pk):
    """Host confirms a pending booking."""
    try:
        booking = Booking.objects.get(pk=pk, listing__host=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Not found.'}, status=404)
    if booking.status != 'pending':
        return Response({'error': 'Only pending bookings can be confirmed.'}, status=400)
    booking.status = 'confirmed'
    booking.save()
    return Response(BookingSerializer(booking).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def booking_availability(request, listing_id):
    """Return booked date ranges for a listing."""
    bookings = Booking.objects.filter(
        listing_id=listing_id,
        status__in=['pending', 'confirmed']
    ).values('check_in', 'check_out')
    return Response(list(bookings))
