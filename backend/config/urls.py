from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',     include('apps.accounts.urls')),
    path('api/listings/', include('apps.listings.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/reviews/',  include('apps.reviews.urls')),
    path('api/wishlists/',include('apps.wishlists.urls')),
    path('api/search/',   include('apps.search.urls')),
]
