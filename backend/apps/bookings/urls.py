from django.urls import path
from . import views

urlpatterns = [
    path('',                              views.BookingListCreateView.as_view(), name='booking-list'),
    path('<int:pk>/',                     views.BookingDetailView.as_view(),     name='booking-detail'),
    path('<int:pk>/cancel/',              views.cancel_booking,                  name='booking-cancel'),
    path('<int:pk>/confirm/',             views.confirm_booking,                 name='booking-confirm'),
    path('availability/<int:listing_id>/',views.booking_availability,            name='booking-availability'),
]
