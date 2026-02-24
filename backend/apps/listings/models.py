from django.db import models
from django.conf import settings


class Listing(models.Model):
    PROPERTY_TYPES = [
        ('house', 'House'), ('apartment', 'Apartment'), ('villa', 'Villa'),
        ('cabin', 'Cabin'), ('condo', 'Condo'), ('studio', 'Studio'),
        ('beach_house', 'Beach House'), ('treehouse', 'Treehouse'),
        ('farm', 'Farm'), ('boat', 'Boat'),
    ]

    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')
    title = models.CharField(max_length=200)
    description = models.TextField()
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)

    # Location
    address = models.CharField(max_length=300)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Capacity
    guests = models.IntegerField(default=1)
    bedrooms = models.IntegerField(default=1)
    beds = models.IntegerField(default=1)
    bathrooms = models.DecimalField(max_digits=3, decimal_places=1, default=1)

    # Amenities
    has_wifi = models.BooleanField(default=False)
    has_kitchen = models.BooleanField(default=False)
    has_parking = models.BooleanField(default=False)
    has_pool = models.BooleanField(default=False)
    has_ac = models.BooleanField(default=False)
    has_washer = models.BooleanField(default=False)
    has_tv = models.BooleanField(default=False)
    has_gym = models.BooleanField(default=False)
    has_workspace = models.BooleanField(default=False)
    has_fireplace = models.BooleanField(default=False)
    has_bbq = models.BooleanField(default=False)
    has_ev_charger = models.BooleanField(default=False)

    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'listings'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def average_rating(self):
        reviews = self.reviews.all()
        if reviews.exists():
            return round(sum(r.rating for r in reviews) / reviews.count(), 2)
        return None

    @property
    def review_count(self):
        return self.reviews.count()

    @property
    def primary_image(self):
        img = self.images.filter(is_primary=True).first() or self.images.first()
        return img.url if img else None


class ListingImage(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='images')
    url = models.URLField(max_length=500)
    caption = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        app_label = 'listings'
        ordering = ['order']

    def __str__(self):
        return f"{self.listing.title} – image {self.order}"
