import json
from django.http import HttpResponse, JsonResponse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import condition
from apps.listings.models import Listing

SITE_URL = 'http://localhost:3000'  # ← change to production domain


# ── helpers ───────────────────────────────────────────────────────────────────

def _escape(s):
    """Escape HTML special chars for safe inline use in attributes."""
    return (str(s)
            .replace('&', '&amp;')
            .replace('"', '&quot;')
            .replace('<', '&lt;')
            .replace('>', '&gt;'))


def _amenities(listing):
    MAP = {
        'has_wifi': 'WiFi', 'has_kitchen': 'Kitchen',
        'has_parking': 'Parking', 'has_pool': 'Swimming Pool',
        'has_ac': 'Air conditioning', 'has_washer': 'Washer',
        'has_tv': 'Television', 'has_gym': 'Gym',
        'has_workspace': 'Workspace', 'has_fireplace': 'Fireplace',
        'has_bbq': 'BBQ grill', 'has_ev_charger': 'EV Charger',
    }
    return [label for field, label in MAP.items() if getattr(listing, field)]


# ── robots.txt ────────────────────────────────────────────────────────────────

def robots_txt(request):
    lines = [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /trips',
        'Disallow: /saved',
        'Disallow: /profile',
        'Disallow: /host/',
        '',
        f'Sitemap: {SITE_URL}/sitemap.xml',
        f'Sitemap: {SITE_URL}/sitemap-images.xml',
    ]
    return HttpResponse('\n'.join(lines), content_type='text/plain')


# ── sitemap.xml ───────────────────────────────────────────────────────────────

@cache_page(60 * 60)
def sitemap_xml(request):
    listings = Listing.objects.filter(is_active=True).only(
        'slug', 'updated_at', 'title', 'city', 'country'
    )

    static_pages = [
        {'loc': f'{SITE_URL}/',       'changefreq': 'daily',   'priority': '1.0'},
        {'loc': f'{SITE_URL}/trips',  'changefreq': 'monthly', 'priority': '0.3'},
    ]

    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
    ]

    for page in static_pages:
        parts.append(
            f'  <url><loc>{page["loc"]}</loc>'
            f'<changefreq>{page["changefreq"]}</changefreq>'
            f'<priority>{page["priority"]}</priority></url>\n'
        )

    for listing in listings:
        if not listing.slug:
            continue
        lastmod = listing.updated_at.strftime('%Y-%m-%d') if listing.updated_at else ''
        loc = f'{SITE_URL}/listing/{listing.slug}'
        parts.append(
            f'  <url>\n'
            f'    <loc>{loc}</loc>\n'
            f'    <lastmod>{lastmod}</lastmod>\n'
            f'    <changefreq>weekly</changefreq>\n'
            f'    <priority>0.8</priority>\n'
            f'  </url>\n'
        )

    parts.append('</urlset>')
    return HttpResponse(''.join(parts), content_type='application/xml; charset=utf-8')


# ── sitemap-images.xml ────────────────────────────────────────────────────────

@cache_page(60 * 60)
def sitemap_images_xml(request):
    listings = Listing.objects.filter(is_active=True).prefetch_related('images').only(
        'slug', 'title'
    )

    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
    ]

    for listing in listings:
        images = listing.images.all()
        if not images or not listing.slug:
            continue
        loc = f'{SITE_URL}/listing/{listing.slug}'
        image_tags = ''.join(
            f'    <image:image>'
            f'<image:loc>{img.url}</image:loc>'
            f'<image:title>{_escape(img.caption or listing.title)}</image:title>'
            f'</image:image>\n'
            for img in images if img.url
        )
        parts.append(f'  <url>\n    <loc>{loc}</loc>\n{image_tags}  </url>\n')

    parts.append('</urlset>')
    return HttpResponse(''.join(parts), content_type='application/xml; charset=utf-8')


# ── JSON-LD structured data per listing ───────────────────────────────────────

@cache_page(60 * 15)
def listing_structured_data(request, slug):
    try:
        listing = Listing.objects.prefetch_related('images', 'reviews').get(
            slug=slug, is_active=True
        )
    except Listing.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)

    amenities = _amenities(listing)
    images = list(listing.images.values_list('url', flat=True))

    data = {
        '@context': 'https://schema.org',
        '@type': 'LodgingBusiness',
        'name': listing.title,
        'description': listing.get_seo_description(),
        'url': f'{SITE_URL}/listing/{listing.slug}',
        'image': images,
        'address': {
            '@type': 'PostalAddress',
            'streetAddress': listing.address,
            'addressLocality': listing.city,
            'addressRegion': listing.state or '',
            'addressCountry': listing.country,
        },
        'priceRange': f'${listing.price_per_night}/night',
        'amenityFeature': [
            {'@type': 'LocationFeatureSpecification', 'name': a, 'value': True}
            for a in amenities
        ],
        'numberOfRooms': listing.bedrooms,
        'occupancy': {'@type': 'QuantitativeValue', 'maxValue': listing.guests},
        'checkinTime': '15:00',
        'checkoutTime': '11:00',
    }

    if listing.latitude and listing.longitude:
        data['geo'] = {
            '@type': 'GeoCoordinates',
            'latitude': float(listing.latitude),
            'longitude': float(listing.longitude),
        }

    if listing.average_rating and listing.review_count:
        data['aggregateRating'] = {
            '@type': 'AggregateRating',
            'ratingValue': str(listing.average_rating),
            'reviewCount': listing.review_count,
            'bestRating': '5',
            'worstRating': '1',
        }

    reviews_ld = []
    for r in listing.reviews.select_related('author').all()[:5]:
        author_name = f"{r.author.first_name} {r.author.last_name}".strip() or r.author.username
        reviews_ld.append({
            '@type': 'Review',
            'author': {'@type': 'Person', 'name': author_name},
            'reviewRating': {'@type': 'Rating', 'ratingValue': str(r.rating), 'bestRating': '5'},
            'reviewBody': r.comment[:300] if hasattr(r, 'comment') else '',
            'datePublished': r.created_at.strftime('%Y-%m-%d'),
        })
    if reviews_ld:
        data['review'] = reviews_ld

    host_name = f"{listing.host.first_name} {listing.host.last_name}".strip() or listing.host.username
    data['brand'] = {'@type': 'Person', 'name': host_name}

    return JsonResponse(data, json_dumps_params={'ensure_ascii': False, 'indent': 2})


# ── SSR-like meta shell (for crawlers & social bots) ─────────────────────────

def listing_meta_html(request, slug):
    """
    Served at /meta/listing/<slug>/
    Crawlers and social bots that don't run JS get full meta tags + JSON-LD.
    Real browsers get an instant JS redirect to the React SPA.
    Nginx/Cloudflare can be configured to route bots here and users to React.
    """
    try:
        listing = Listing.objects.prefetch_related('images', 'reviews').get(
            slug=slug, is_active=True
        )
    except Listing.DoesNotExist:
        return HttpResponse(status=404)

    title       = _escape(listing.get_seo_title())
    description = _escape(listing.get_seo_description())
    image       = listing.primary_image or ''
    url         = f'{SITE_URL}/listing/{listing.slug}'
    canonical   = url

    amenities = _amenities(listing)

    # Full JSON-LD
    structured = {
        '@context': 'https://schema.org',
        '@type': 'LodgingBusiness',
        'name': listing.title,
        'description': listing.get_seo_description(),
        'url': url,
        'image': list(listing.images.values_list('url', flat=True)),
        'priceRange': f'${listing.price_per_night}/night',
        'address': {
            '@type': 'PostalAddress',
            'streetAddress': listing.address,
            'addressLocality': listing.city,
            'addressRegion': listing.state or '',
            'addressCountry': listing.country,
        },
        'amenityFeature': [
            {'@type': 'LocationFeatureSpecification', 'name': a, 'value': True}
            for a in amenities
        ],
        'numberOfRooms': listing.bedrooms,
        'occupancy': {'@type': 'QuantitativeValue', 'maxValue': listing.guests},
    }
    if listing.average_rating:
        structured['aggregateRating'] = {
            '@type': 'AggregateRating',
            'ratingValue': str(listing.average_rating),
            'reviewCount': listing.review_count,
            'bestRating': '5',
        }
    if listing.latitude and listing.longitude:
        structured['geo'] = {
            '@type': 'GeoCoordinates',
            'latitude': float(listing.latitude),
            'longitude': float(listing.longitude),
        }

    structured_json = json.dumps(structured, ensure_ascii=False, indent=2)

    # BreadcrumbList
    breadcrumb = json.dumps({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE_URL},
            {'@type': 'ListItem', 'position': 2, 'name': listing.city, 'item': f'{SITE_URL}/?city={listing.city}'},
            {'@type': 'ListItem', 'position': 3, 'name': listing.title, 'item': url},
        ]
    }, ensure_ascii=False)

    rating_snippet = ''
    if listing.average_rating:
        rating_snippet = f'<p>⭐ {listing.average_rating}/5 — {listing.review_count} reviews</p>'

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>

  <title>{title}</title>
  <meta name="description" content="{description}"/>
  <link rel="canonical" href="{canonical}"/>

  <!-- Open Graph -->
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="{url}"/>
  <meta property="og:title" content="{title}"/>
  <meta property="og:description" content="{description}"/>
  <meta property="og:image" content="{image}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:site_name" content="StayFinder"/>
  <meta property="og:locale" content="en_US"/>

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="{title}"/>
  <meta name="twitter:description" content="{description}"/>
  <meta name="twitter:image" content="{image}"/>

  <!-- Structured Data -->
  <script type="application/ld+json">{structured_json}</script>
  <script type="application/ld+json">{breadcrumb}</script>

  <!-- Redirect real browsers instantly to the React SPA -->
  <script>
    (function(){{
      var ua = navigator.userAgent || '';
      var isBot = /bot|crawl|spider|preview|slurp|facebookexternalhit|WhatsApp|Telegram|Discordbot/i.test(ua);
      if (!isBot) window.location.replace('{url}');
    }})();
  </script>
</head>
<body style="font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#333;">
  <nav><a href="{SITE_URL}">StayFinder</a> &rsaquo; {listing.city} &rsaquo; {listing.title}</nav>
  <h1 style="margin-top:16px;">{_escape(listing.title)}</h1>
  <p style="color:#666;">{listing.city}, {listing.state or listing.country}</p>
  {f'<img src="{image}" alt="{title}" style="width:100%;max-height:400px;object-fit:cover;border-radius:8px;margin:12px 0;"/>' if image else ''}
  {rating_snippet}
  <p>{_escape(listing.get_seo_description())}</p>
  <ul>
    <li>{listing.bedrooms} bedroom{"s" if listing.bedrooms != 1 else ""} &bull; {listing.beds} bed{"s" if listing.beds != 1 else ""} &bull; {listing.bathrooms} bathroom{"s" if listing.bathrooms != 1 else ""}</li>
    <li>Up to {listing.guests} guests &bull; ${listing.price_per_night}/night</li>
    {"<li>Amenities: " + ', '.join(amenities) + "</li>" if amenities else ""}
  </ul>
  <a href="{url}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#E8472A;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">
    View this listing on StayFinder
  </a>
</body>
</html>"""

    response = HttpResponse(html, content_type='text/html; charset=utf-8')
    response['Cache-Control'] = 'public, max-age=3600'
    return response
