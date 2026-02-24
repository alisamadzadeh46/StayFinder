"""
Elasticsearch document definition for Listing.

Fully lazy — zero connection attempts at Django startup.
django_elasticsearch_dsl is NOT used here, so removing it from
INSTALLED_APPS is safe and eliminates the startup connection error.

To index data (only after ES is running):
    python manage.py index_listings
"""


def get_es_client():
    """Return a connected Elasticsearch client, or raise ConnectionError."""
    from django.conf import settings
    from elasticsearch import Elasticsearch
    url = (
        getattr(settings, 'ELASTICSEARCH_DSL', {})
        .get('default', {})
        .get('hosts', 'http://localhost:9200')
    )
    client = Elasticsearch(url)
    if not client.ping():
        raise ConnectionError(f"Elasticsearch not reachable at {url}")
    return client


def search_listings_es(query, filters, page=1, page_size=12):
    """
    Full-text + filtered Elasticsearch query.
    Returns (list_of_ids, total_count).
    Raises on connection failure so caller can fall back to ORM.
    """
    client = get_es_client()

    must = []
    filter_clauses = [{"term": {"is_active": True}}]

    if query:
        must.append({
            "multi_match": {
                "query": query,
                "fields": ["title^3", "city^2", "country^2", "description", "address"],
                "fuzziness": "AUTO",
            }
        })

    for key in ('property_type', 'city', 'country'):
        val = filters.get(key)
        if val:
            filter_clauses.append({"match": {key: val}})

    if filters.get('min_price'):
        filter_clauses.append({"range": {"price_per_night": {"gte": float(filters['min_price'])}}})
    if filters.get('max_price'):
        filter_clauses.append({"range": {"price_per_night": {"lte": float(filters['max_price'])}}})
    if filters.get('min_guests'):
        filter_clauses.append({"range": {"guests": {"gte": int(filters['min_guests'])}}})

    for amenity in ['has_wifi','has_pool','has_kitchen','has_parking','has_ac','has_gym','has_workspace']:
        if filters.get(amenity) == 'true':
            filter_clauses.append({"term": {amenity: True}})

    ordering = filters.get('ordering', '-created_at')
    sort_field = ordering.lstrip('-')
    sort_dir = 'desc' if ordering.startswith('-') else 'asc'

    body = {
        "query": {
            "bool": {
                "must": must or [{"match_all": {}}],
                "filter": filter_clauses,
            }
        },
        "sort": [{sort_field: {"order": sort_dir}}],
        "from": (page - 1) * page_size,
        "size": page_size,
    }

    result = client.search(index="listings", body=body)
    hits = result["hits"]
    total = hits["total"]["value"] if isinstance(hits["total"], dict) else hits["total"]
    ids   = [int(h["_id"]) for h in hits["hits"]]
    return ids, total


def build_index():
    """
    Index all active listings. Call after Elasticsearch is running:
        python manage.py index_listings
    """
    from apps.listings.models import Listing

    client = get_es_client()

    if not client.indices.exists(index="listings"):
        client.indices.create(index="listings", body={
            "mappings": {
                "properties": {
                    "title":           {"type": "text", "boost": 3},
                    "description":     {"type": "text"},
                    "city":            {"type": "text", "boost": 2,
                                        "fields": {"keyword": {"type": "keyword"}}},
                    "country":         {"type": "text", "boost": 2,
                                        "fields": {"keyword": {"type": "keyword"}}},
                    "address":         {"type": "text"},
                    "property_type":   {"type": "keyword"},
                    "price_per_night": {"type": "float"},
                    "guests":          {"type": "integer"},
                    "bedrooms":        {"type": "integer"},
                    "bathrooms":       {"type": "float"},
                    "is_active":       {"type": "boolean"},
                    "has_wifi":        {"type": "boolean"},
                    "has_pool":        {"type": "boolean"},
                    "has_kitchen":     {"type": "boolean"},
                    "has_parking":     {"type": "boolean"},
                    "has_ac":          {"type": "boolean"},
                    "has_gym":         {"type": "boolean"},
                    "has_workspace":   {"type": "boolean"},
                    "has_fireplace":   {"type": "boolean"},
                    "has_bbq":         {"type": "boolean"},
                    "created_at":      {"type": "date"},
                    "latitude":        {"type": "float"},
                    "longitude":       {"type": "float"},
                }
            }
        })
        print("Created 'listings' index")

    listings = Listing.objects.filter(is_active=True).prefetch_related('images')
    count = 0
    for listing in listings:
        client.index(index="listings", id=str(listing.id), body={
            "title":           listing.title,
            "description":     listing.description,
            "city":            listing.city,
            "state":           getattr(listing, 'state', ''),
            "country":         listing.country,
            "address":         listing.address,
            "property_type":   listing.property_type,
            "price_per_night": float(listing.price_per_night),
            "guests":          listing.guests,
            "bedrooms":        listing.bedrooms,
            "bathrooms":       float(listing.bathrooms),
            "is_active":       listing.is_active,
            "has_wifi":        listing.has_wifi,
            "has_pool":        listing.has_pool,
            "has_kitchen":     listing.has_kitchen,
            "has_parking":     listing.has_parking,
            "has_ac":          listing.has_ac,
            "has_gym":         listing.has_gym,
            "has_workspace":   listing.has_workspace,
            "has_fireplace":   listing.has_fireplace,
            "has_bbq":         listing.has_bbq,
            "created_at":      listing.created_at.isoformat(),
            "latitude":        float(listing.latitude)  if listing.latitude  else None,
            "longitude":       float(listing.longitude) if listing.longitude else None,
        })
        count += 1

    client.indices.refresh(index="listings")
    print(f"Indexed {count} listings")
    return count
