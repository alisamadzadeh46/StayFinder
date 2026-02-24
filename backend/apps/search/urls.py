from django.urls import path
from . import views

urlpatterns = [
    path('',             views.search_listings, name='search'),
    path('autocomplete/',views.autocomplete,    name='autocomplete'),
]
