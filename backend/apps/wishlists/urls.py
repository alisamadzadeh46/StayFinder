from django.urls import path
from . import views

urlpatterns = [
    path('saved/',                        views.saved_listings, name='saved'),
    path('saved/ids/',                    views.saved_ids,      name='saved-ids'),
    path('toggle/<int:listing_pk>/',      views.toggle_save,    name='toggle-save'),
]
