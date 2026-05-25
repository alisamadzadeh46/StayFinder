from django.db import models
from django.conf import settings
from django.utils.text import slugify
import re


def generate_slug(title, city, pk=None):
    base = slugify(f"{title}-{city}")
    # Remove consecutive hyphens
    base = re.sub(r'-+', '-', base).strip('-')
    return f"{base}-{pk}" if pk else base


class Listing(models.Model):
    PROPERTY_TYPES = [
        ('house', 'House'), ('apartment', 'Apartment'), ('villa', 'Villa'),
        ('cabin', 'Cabin'), ('condo', 'Condo'), ('studio', 'Studio'),
        ('beach_house', 'Beach House'), ('treehouse', 'Treehouse'),
        ('farm', 'Farm'), ('boat', 'Boat'),
    ]

    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField()
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPES)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)

    # SEO
    meta_title = models.CharField(max_length=70, blank=True, help_text='Custom SEO title (max 60 chars). Leave blank to auto-generate.')
    meta_description = models.CharField(max_length=160, blank=True, help_text='Custom meta description (max 155 chars). Leave blank to auto-generate.')

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

    def save(self, *args, **kwargs):
        # Auto-generate slug on first save
        if not self.slug:
            base_slug = generate_slug(self.title, self.city)
            # Save first to get PK, then set slug
            super().save(*args, **kwargs)
            self.slug = generate_slug(self.title, self.city, self.pk)
            kwargs['force_insert'] = False
        super().save(*args, **kwargs)

    def get_seo_title(self):
        if self.meta_title:
            return self.meta_title
        pt = dict(self.PROPERTY_TYPES).get(self.property_type, self.property_type.title())
        location = f"{self.city}, {self.country}"
        return f"{pt} in {location} — {self.bedrooms}BR, {self.guests} guests | StayFinder"[:70]

    def get_seo_description(self):
        if self.meta_description:
            return self.meta_description
        amenities = []
        if self.has_wifi:    amenities.append('WiFi')
        if self.has_pool:    amenities.append('pool')
        if self.has_kitchen: amenities.append('kitchen')
        if self.has_parking: amenities.append('parking')
        amenity_str = ', '.join(amenities[:3])
        desc = self.description[:80].rstrip()
        base = f"Book this {self.property_type.replace('_',' ')} in {self.city}. {desc}..."
        if amenity_str:
            base += f" Includes: {amenity_str}."
        return base[:155]

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
