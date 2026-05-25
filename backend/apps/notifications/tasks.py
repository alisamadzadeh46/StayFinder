"""
Celery tasks for async notifications.
Falls back to synchronous execution if Celery is not configured.
"""
try:
    from celery import shared_task
    CELERY_AVAILABLE = True
except ImportError:
    CELERY_AVAILABLE = False
    def shared_task(fn):
        return fn


@shared_task
def notify_booking_request(booking_id):
    try:
        from apps.bookings.models import Booking
        from .emails import booking_request_to_host
        booking = Booking.objects.select_related('listing__host', 'guest').get(pk=booking_id)
        booking_request_to_host(booking)
    except Exception:
        pass


@shared_task
def notify_booking_confirmed(booking_id):
    try:
        from apps.bookings.models import Booking
        from .emails import booking_confirmed_to_guest
        booking = Booking.objects.select_related('listing', 'guest').get(pk=booking_id)
        booking_confirmed_to_guest(booking)
    except Exception:
        pass


@shared_task
def notify_booking_cancelled(booking_id, cancelled_by_id):
    try:
        from apps.bookings.models import Booking
        from apps.accounts.models import User
        from .emails import booking_cancelled
        booking = Booking.objects.select_related('listing__host', 'guest').get(pk=booking_id)
        cancelled_by = User.objects.get(pk=cancelled_by_id)
        booking_cancelled(booking, cancelled_by)
    except Exception:
        pass


@shared_task
def notify_new_message(message_id):
    try:
        from apps.messaging.models import Message
        from .emails import new_message_notification
        msg = Message.objects.select_related(
            'conversation__listing', 'conversation__guest',
            'conversation__host', 'sender'
        ).get(pk=message_id)
        new_message_notification(msg)
    except Exception:
        pass


@shared_task
def notify_welcome(user_id):
    try:
        from apps.accounts.models import User
        from .emails import welcome_email
        user = User.objects.get(pk=user_id)
        welcome_email(user)
    except Exception:
        pass


@shared_task
def notify_new_review(review_id):
    try:
        from apps.reviews.models import Review
        from .emails import new_review_notification
        review = Review.objects.select_related('listing__host', 'author').get(pk=review_id)
        new_review_notification(review)
    except Exception:
        pass
