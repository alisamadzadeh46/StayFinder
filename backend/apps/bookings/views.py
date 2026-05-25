from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Booking
from .serializers import BookingSerializer


def _fire(task_name, *args):
    """Fire a notification task — silent fail if Celery not running."""
    try:
        from apps.notifications import tasks
        getattr(tasks, task_name).delay(*args)
    except Exception:
        try:
            from apps.notifications import tasks
            getattr(tasks, task_name)(*args)
        except Exception:
            pass


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(guest=self.request.user).select_related('listing', 'guest')

    def perform_create(self, serializer):
        booking = serializer.save(guest=self.request.user)
        _fire('notify_booking_request', booking.id)


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(guest=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_booking(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    if request.user not in (booking.guest, booking.listing.host):
        return Response({'error': 'Forbidden.'}, status=403)
    if booking.status in ('cancelled', 'completed'):
        return Response({'error': f'Cannot cancel a {booking.status} booking.'}, status=400)
    booking.status = 'cancelled'
    booking.save()
    _fire('notify_booking_cancelled', booking.id, request.user.id)
    return Response(BookingSerializer(booking).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_booking(request, pk):
    booking = get_object_or_404(Booking, pk=pk, listing__host=request.user)
    if booking.status != 'pending':
        return Response({'error': 'Only pending bookings can be confirmed.'}, status=400)
    booking.status = 'confirmed'
    booking.save()
    _fire('notify_booking_confirmed', booking.id)
    return Response(BookingSerializer(booking).data)


@api_view(['GET'])
def booking_availability(request, listing_id):
    """Return booked date ranges for a listing (for the calendar)."""
    bookings = Booking.objects.filter(
        listing_id=listing_id,
        status__in=['pending', 'confirmed']
    ).values('check_in', 'check_out')
    return Response(list(bookings))
