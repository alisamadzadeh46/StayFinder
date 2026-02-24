from django.db import models
from django.conf import settings


class WishList(models.Model):
    user     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlists')
    name     = models.CharField(max_length=100, default='Saved places')
    listings = models.ManyToManyField('listings.Listing', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'wishlists'

    def __str__(self):
        return f"{self.user.email} – {self.name}"
