from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conversation_list(request):
    """All conversations for current user (as guest or host)."""
    convs = Conversation.objects.filter(
        Q(guest=request.user) | Q(host=request.user)
    ).select_related('listing', 'guest', 'host').prefetch_related('messages')
    s = ConversationSerializer(convs, many=True, context={'request': request})
    return Response(s.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def conversation_start(request):
    """Start or get existing conversation with a host about a listing."""
    listing_id = request.data.get('listing')
    booking_id = request.data.get('booking')

    from apps.listings.models import Listing
    listing = get_object_or_404(Listing, pk=listing_id)

    if listing.host == request.user:
        return Response({'error': 'Cannot message yourself.'}, status=400)

    conv, created = Conversation.objects.get_or_create(
        listing=listing,
        guest=request.user,
        defaults={'host': listing.host}
    )

    if booking_id and not conv.booking_id:
        from apps.bookings.models import Booking
        try:
            conv.booking = Booking.objects.get(pk=booking_id, guest=request.user)
            conv.save()
        except Booking.DoesNotExist:
            pass

    # Send initial message if provided
    body = request.data.get('message', '').strip()
    if body and created:
        Message.objects.create(conversation=conv, sender=request.user, body=body)

    s = ConversationSerializer(conv, context={'request': request})
    return Response(s.data, status=201 if created else 200)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def conversation_detail(request, pk):
    """Get a conversation + all messages. Marks unread as read."""
    conv = get_object_or_404(
        Conversation.objects.select_related('listing', 'guest', 'host'),
        pk=pk
    )
    # Only participants can view
    if request.user not in (conv.guest, conv.host):
        return Response({'error': 'Forbidden.'}, status=403)

    # Mark incoming messages as read
    conv.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

    messages = conv.messages.select_related('sender').all()
    return Response({
        'conversation': ConversationSerializer(conv, context={'request': request}).data,
        'messages': MessageSerializer(messages, many=True, context={'request': request}).data,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_message(request, pk):
    """Send a message in a conversation."""
    conv = get_object_or_404(Conversation, pk=pk)

    if request.user not in (conv.guest, conv.host):
        return Response({'error': 'Forbidden.'}, status=403)

    body = request.data.get('body', '').strip()
    if not body:
        return Response({'error': 'Message cannot be empty.'}, status=400)
    if len(body) > 2000:
        return Response({'error': 'Message too long (max 2000 chars).'}, status=400)

    msg = Message.objects.create(conversation=conv, sender=request.user, body=body)

    # Bump conversation updated_at so it floats to top
    conv.save()  # triggers auto_now on updated_at

    # Fire notification email async (if Celery available)
    try:
        from apps.notifications.tasks import notify_new_message
        notify_new_message.delay(msg.id)
    except Exception:
        pass

    return Response(MessageSerializer(msg, context={'request': request}).data, status=201)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def unread_count(request):
    """Total unread message count for nav badge."""
    from django.db.models import Count
    total = Message.objects.filter(
        conversation__in=Conversation.objects.filter(
            Q(guest=request.user) | Q(host=request.user)
        ),
        is_read=False
    ).exclude(sender=request.user).count()
    return Response({'unread': total})
