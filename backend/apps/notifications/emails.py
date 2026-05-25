"""
Email helpers — send transactional emails.
Uses Django's built-in email backend (configure SMTP in settings).
All functions are safe to call even if email is misconfigured (fail silently).
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string

SITE_URL  = getattr(settings, 'SITE_URL', 'http://localhost:3000')
SITE_NAME = 'StayFinder'
FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', f'noreply@stayfinder.com')


def _send(subject, message, to_email, html_message=None):
    try:
        send_mail(
            subject=f'[{SITE_NAME}] {subject}',
            message=message,
            from_email=FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html_message,
            fail_silently=True,
        )
    except Exception:
        pass


def booking_request_to_host(booking):
    """Notify host that a new booking request arrived."""
    host  = booking.listing.host
    guest = booking.guest
    guest_name = f"{guest.first_name} {guest.last_name}".strip() or guest.username

    subject = f"New booking request — {booking.listing.title}"
    message = (
        f"Hi {host.first_name or host.username},\n\n"
        f"{guest_name} has requested to book '{booking.listing.title}'\n"
        f"Check-in:  {booking.check_in}\n"
        f"Check-out: {booking.check_out}\n"
        f"Guests:    {booking.guests}\n"
        f"Total:     ${booking.total_price}\n\n"
        f"Review and confirm at: {SITE_URL}/host/dashboard\n\n"
        f"— {SITE_NAME} Team"
    )
    _send(subject, message, host.email)


def booking_confirmed_to_guest(booking):
    """Notify guest their booking was confirmed."""
    guest = booking.guest
    subject = f"Booking confirmed — {booking.listing.title}"
    message = (
        f"Hi {guest.first_name or guest.username},\n\n"
        f"Great news! Your booking for '{booking.listing.title}' has been confirmed.\n\n"
        f"Check-in:  {booking.check_in}\n"
        f"Check-out: {booking.check_out}\n"
        f"Guests:    {booking.guests}\n"
        f"Total:     ${booking.total_price}\n\n"
        f"View your trip: {SITE_URL}/trips\n\n"
        f"— {SITE_NAME} Team"
    )
    _send(subject, message, guest.email)


def booking_cancelled(booking, cancelled_by):
    """Notify the other party of cancellation."""
    is_guest = cancelled_by == booking.guest
    notify_user = booking.listing.host if is_guest else booking.guest
    who = "guest" if is_guest else "host"

    subject = f"Booking cancelled — {booking.listing.title}"
    message = (
        f"Hi {notify_user.first_name or notify_user.username},\n\n"
        f"The booking for '{booking.listing.title}' has been cancelled by the {who}.\n\n"
        f"Check-in:  {booking.check_in}\n"
        f"Check-out: {booking.check_out}\n\n"
        f"If you have questions, visit: {SITE_URL}\n\n"
        f"— {SITE_NAME} Team"
    )
    _send(subject, message, notify_user.email)


def new_message_notification(message_obj):
    """Notify recipient of a new chat message."""
    conv  = message_obj.conversation
    sender = message_obj.sender
    recipient = conv.host if sender == conv.guest else conv.guest

    sender_name = f"{sender.first_name} {sender.last_name}".strip() or sender.username
    subject = f"New message from {sender_name}"
    message = (
        f"Hi {recipient.first_name or recipient.username},\n\n"
        f"{sender_name} sent you a message about '{conv.listing.title}':\n\n"
        f"\"{message_obj.body[:200]}\"\n\n"
        f"Reply at: {SITE_URL}/messages/{conv.id}\n\n"
        f"— {SITE_NAME} Team"
    )
    _send(subject, message, recipient.email)


def welcome_email(user):
    """Send welcome email after registration."""
    subject = f"Welcome to {SITE_NAME}!"
    message = (
        f"Hi {user.first_name or user.username},\n\n"
        f"Welcome to {SITE_NAME}! Your account is ready.\n\n"
        f"Start exploring stays: {SITE_URL}\n\n"
        f"— {SITE_NAME} Team"
    )
    _send(subject, message, user.email)


def new_review_notification(review):
    """Notify host when they receive a new review."""
    host = review.listing.host
    author_name = f"{review.author.first_name} {review.author.last_name}".strip() or review.author.username
    subject = f"New review for {review.listing.title}"
    message = (
        f"Hi {host.first_name or host.username},\n\n"
        f"{author_name} left a {review.rating}/5 star review for '{review.listing.title}':\n\n"
        f"\"{review.comment[:300]}\"\n\n"
        f"View your listing: {SITE_URL}/listing/{review.listing.slug}\n\n"
        f"— {SITE_NAME} Team"
    )
    _send(subject, message, host.email)
