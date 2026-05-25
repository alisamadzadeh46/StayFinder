from django.urls import path
from . import views
from .upload import upload_image

urlpatterns = [
    # ── Static paths first — must come before any slug/pk patterns ──────────
    path('upload-image/',        upload_image,                            name='upload-image'),
    path('host/my-listings/',    views.host_listings,                     name='host-listings'),
    path('host/stats/',          views.host_stats,                        name='host-stats'),
    path('host/bookings/',       views.host_dashboard_bookings,           name='host-bookings'),

    # ── Dynamic patterns last ────────────────────────────────────────────────
    path('',                     views.ListingListCreateView.as_view(),   name='listing-list'),
    path('<int:pk>/',            views.ListingDetailView.as_view(),       name='listing-detail'),
    path('<slug:slug>/',         views.ListingDetailBySlugView.as_view(), name='listing-detail-slug'),
    path('<int:pk>/images/',     views.add_listing_image,                 name='listing-images'),
]
