from django.urls import path
from . import views

urlpatterns = [
    path('',              views.conversation_list,   name='conversation-list'),
    path('start/',        views.conversation_start,  name='conversation-start'),
    path('unread/',       views.unread_count,         name='unread-count'),
    path('<int:pk>/',     views.conversation_detail,  name='conversation-detail'),
    path('<int:pk>/send/',views.send_message,         name='send-message'),
]
