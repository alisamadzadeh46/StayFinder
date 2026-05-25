from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve as static_serve
import os

# Serve React static files (JS, CSS, assets)
FRONTEND_DIR = os.path.join(settings.BASE_DIR, 'static', 'frontend')

urlpatterns = [
    path('admin/',           admin.site.urls),
    path('api/auth/',        include('apps.accounts.urls')),
    path('api/listings/',    include('apps.listings.urls')),
    path('api/bookings/',    include('apps.bookings.urls')),
    path('api/reviews/',     include('apps.reviews.urls')),
    path('api/wishlists/',   include('apps.wishlists.urls')),
    path('api/search/',      include('apps.search.urls')),
    path('api/messages/',    include('apps.messaging.urls')),
    path('',                 include('apps.seo.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve React build assets
urlpatterns += [
    re_path(r'^assets/(?P<path>.*)$',
            static_serve,
            {'document_root': os.path.join(FRONTEND_DIR, 'assets')}),
]

# Catch-all: serve React index.html for every other route
from config.frontend import serve_react
urlpatterns += [
    re_path(r'^(?!api/|admin/|media/|assets/|robots\.txt|sitemap.*\.xml|meta/).*$',
            serve_react),
]
