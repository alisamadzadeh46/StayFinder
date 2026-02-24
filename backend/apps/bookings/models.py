from django.db import models
from django.conf import settings


class Booking(models.Model):
    STATUS = [
        ('pending', 'Pending'), ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'), ('completed', 'Completed'),
    ]

    listing    = models.ForeignKey('listings.Listing', on_delete=models.CASCADE, related_name='bookings')
    guest      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    check_in   = models.DateField()
    check_out  = models.DateField()
    guests     = models.IntegerField(default=1)
    total_price= models.DecimalField(max_digits=10, decimal_places=2)
    status     = models.CharField(max_length=20, choices=STATUS, default='pending')
    notes      = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'bookings'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.guest.email} → {self.listing.title} ({self.check_in}→{self.check_out})"

    @property
    def nights(self):
        return (self.check_out - self.check_in).days
