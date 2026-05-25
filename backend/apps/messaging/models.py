from django.db import models
from django.conf import settings


class Conversation(models.Model):
    listing  = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='conversations')
    booking  = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL,
                                  null=True, blank=True, related_name='conversation')
    guest    = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='guest_conversations')
    host     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='host_conversations')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'messaging'
        ordering  = ['-updated_at']
        unique_together = [['listing', 'guest']]

    def __str__(self):
        return f"{self.guest.email} ↔ {self.host.email} re: {self.listing.title}"

    def unread_count(self, user):
        return self.messages.filter(is_read=False).exclude(sender=user).count()

    def last_message(self):
        return self.messages.order_by('-created_at').first()


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    body         = models.TextField()
    is_read      = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'messaging'
        ordering  = ['created_at']

    def __str__(self):
        return f"{self.sender.email}: {self.body[:40]}"
