from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('register/',         views.register,          name='register'),
    path('login/',            TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/',    TokenRefreshView.as_view(),    name='token_refresh'),
    path('profile/',          views.profile,           name='profile'),
    path('profile/update/',   views.profile_update,    name='profile_update'),
    path('profile/password/', views.change_password,   name='change_password'),
    path('profile/stats/',    views.profile_stats,     name='profile_stats'),
    path('users/<int:pk>/',   views.public_profile,    name='public_profile'),
]
