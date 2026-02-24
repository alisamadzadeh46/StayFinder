from django.urls import path
from . import views

urlpatterns = [
    path('',                        views.ListingListCreateView.as_view(), name='listing-list'),
    path('<int:pk>/',               views.ListingDetailView.as_view(),     name='listing-detail'),
    path('<int:pk>/images/',        views.add_listing_image,               name='listing-images'),
    path('host/my-listings/',       views.host_listings,                   name='host-listings'),
    path('host/stats/',             views.host_stats,                      name='host-stats'),
    path('host/bookings/',          views.host_dashboard_bookings,         name='host-bookings'),
]
