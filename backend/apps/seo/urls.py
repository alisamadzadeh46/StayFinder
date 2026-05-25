from django.urls import path
from . import views

urlpatterns = [
    path('robots.txt',                     views.robots_txt,              name='robots_txt'),
    path('sitemap.xml',                    views.sitemap_xml,             name='sitemap_xml'),
    path('sitemap-images.xml',             views.sitemap_images_xml,      name='sitemap_images'),
    path('api/seo/listing/<slug:slug>/',   views.listing_structured_data, name='listing_structured_data'),
    path('meta/listing/<slug:slug>/',      views.listing_meta_html,       name='listing_meta_html'),
]
