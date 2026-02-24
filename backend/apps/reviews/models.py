from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    listing    = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='reviews')
    author     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    booking    = models.OneToOneField('bookings.Booking', on_delete=models.SET_NULL,
                                      related_name='review', null=True, blank=True)
    rating     = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    # Sub-ratings
    cleanliness   = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    accuracy      = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    communication = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    location      = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)
    value         = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)

    comment    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label  = 'reviews'
        ordering   = ['-created_at']
        unique_together = [['listing', 'author']]

    def __str__(self):
        return f"{self.author.email} → {self.listing.title} ({self.rating}/5)"
