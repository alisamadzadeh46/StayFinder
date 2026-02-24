from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from .models import Listing, ListingImage


# ─── OSM map HTML/JS injected as a readonly field ─────────────────────────────

MAP_HTML = """
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<div style="margin:10px 0 4px;border:1px solid #ccc;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

  <div style="background:#f5f5f5;border-bottom:1px solid #ddd;padding:8px 14px;font-size:13px;font-weight:600;color:#444;display:flex;align-items:center;gap:8px;">
    <span>&#128205; Click map or drag marker to set coordinates</span>
    <span id="map-coords-display" style="margin-left:auto;font-family:monospace;font-size:12px;color:#888;">No location set</span>
  </div>

  <div style="padding:8px 12px;background:#fff;border-bottom:1px solid #eee;display:flex;gap:8px;">
    <input id="map-search-input" type="text" placeholder="Search address or city..."
      style="flex:1;padding:7px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px;outline:none;"/>
    <button type="button" id="map-search-btn"
      style="padding:7px 16px;background:#417690;color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">
      Search
    </button>
  </div>

  <div id="admin-listing-map" style="height:420px;width:100%;"></div>
</div>

<script>
(function(){
  function init(){
    var latEl = document.getElementById("id_latitude");
    var lngEl = document.getElementById("id_longitude");
    if(!latEl||!lngEl) return;

    var lat0 = parseFloat(latEl.value)||48.8566;
    var lng0 = parseFloat(lngEl.value)||2.3522;
    var hasPrev = latEl.value && lngEl.value;

    var map = L.map("admin-listing-map",{center:[lat0,lng0],zoom:hasPrev?13:4});
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
      attribution:"&copy; OpenStreetMap contributors",maxZoom:19
    }).addTo(map);

    var marker=null;

    function place(lat,lng){
      lat=parseFloat(lat.toFixed(6)); lng=parseFloat(lng.toFixed(6));
      if(marker){marker.setLatLng([lat,lng]);}
      else{
        marker=L.marker([lat,lng],{draggable:true}).addTo(map);
        marker.on("dragend",function(e){var p=e.target.getLatLng();save(p.lat,p.lng);});
      }
      save(lat,lng);
      map.setView([lat,lng],Math.max(map.getZoom(),13));
    }

    function save(lat,lng){
      lat=parseFloat(lat.toFixed(6)); lng=parseFloat(lng.toFixed(6));
      latEl.value=lat; lngEl.value=lng;
      document.getElementById("map-coords-display").textContent="Lat: "+lat+"   Lng: "+lng;
    }

    map.on("click",function(e){place(e.latlng.lat,e.latlng.lng);});
    if(hasPrev) place(lat0,lng0);

    function search(){
      var q=document.getElementById("map-search-input").value.trim();
      if(!q) return;
      var btn=document.getElementById("map-search-btn");
      btn.textContent="..."; btn.disabled=true;
      fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="+encodeURIComponent(q),
        {headers:{"Accept-Language":"en"}})
      .then(function(r){return r.json();})
      .then(function(d){
        if(d&&d.length){
          place(parseFloat(d[0].lat),parseFloat(d[0].lon));
          fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat="+d[0].lat+"&lon="+d[0].lon,
            {headers:{"Accept-Language":"en"}})
          .then(function(r){return r.json();})
          .then(function(rev){
            if(!rev||!rev.address) return;
            var a=rev.address;
            var cityEl=document.getElementById("id_city");
            var countryEl=document.getElementById("id_country");
            var addrEl=document.getElementById("id_address");
            if(cityEl&&!cityEl.value) cityEl.value=a.city||a.town||a.village||"";
            if(countryEl&&!countryEl.value) countryEl.value=a.country||"";
            if(addrEl&&!addrEl.value) addrEl.value=rev.display_name||"";
          });
        } else { alert("Location not found. Try a different search."); }
      })
      .catch(function(){alert("Search failed.");})
      .finally(function(){btn.textContent="Search";btn.disabled=false;});
    }

    document.getElementById("map-search-btn").addEventListener("click",search);
    document.getElementById("map-search-input").addEventListener("keydown",function(e){
      if(e.key==="Enter"){e.preventDefault();search();}
    });

    latEl.addEventListener("change",function(){
      var la=parseFloat(latEl.value),lo=parseFloat(lngEl.value);
      if(!isNaN(la)&&!isNaN(lo)) place(la,lo);
    });
    lngEl.addEventListener("change",function(){
      var la=parseFloat(latEl.value),lo=parseFloat(lngEl.value);
      if(!isNaN(la)&&!isNaN(lo)) place(la,lo);
    });

    setTimeout(function(){map.invalidateSize();},400);
  }

  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",init);}
  else{init();}
})();
</script>
"""


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1
    fields = ['url', 'caption', 'is_primary', 'order', 'preview']
    readonly_fields = ['preview']

    def preview(self, obj):
        if obj.url:
            return format_html(
                '<img src="{}" style="height:60px;width:90px;object-fit:cover;'
                'border-radius:4px;border:1px solid #ddd;" />',
                obj.url
            )
        return '—'
    preview.short_description = 'Preview'


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display  = [
        'thumbnail', 'title', 'host_link', 'city', 'country',
        'property_type', 'price_tag', 'guests_display',
        'rating_display', 'coords_display', 'is_active',
    ]
    list_filter   = ['property_type', 'is_active', 'country',
                     'has_wifi', 'has_pool', 'has_ac', 'has_gym']
    search_fields = ['title', 'city', 'country', 'host__email', 'address']
    readonly_fields = [
        'map_widget', 'created_at', 'updated_at',
        'rating_readonly', 'review_count_readonly', 'primary_image_preview',
    ]
    inlines    = [ListingImageInline]
    save_on_top = True
    list_per_page = 20

    fieldsets = (
        ('Basic Info', {
            'fields': ('host', 'title', 'description', 'property_type', 'is_active', 'primary_image_preview'),
        }),
        ('Pricing & Capacity', {
            'fields': (
                ('price_per_night',),
                ('guests', 'bedrooms', 'beds', 'bathrooms'),
            ),
        }),
        ('Location', {
            'fields': (
                'address',
                ('city', 'state', 'country'),
                ('latitude', 'longitude'),
                'map_widget',
            ),
            'description': (
                'Fill in address fields above, then click the map or use Search '
                'to pin the exact coordinates. Dragging the red marker also updates the values.'
            ),
        }),
        ('Amenities', {
            'fields': (
                ('has_wifi', 'has_kitchen', 'has_parking', 'has_pool'),
                ('has_ac',   'has_washer',  'has_tv',      'has_gym'),
                ('has_workspace', 'has_fireplace', 'has_bbq', 'has_ev_charger'),
            ),
            'classes': ('collapse',),
        }),
        ('Stats (read-only)', {
            'fields': ('rating_readonly', 'review_count_readonly', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    # ── readonly field renderers ─────────────────────────────────────────────

    def map_widget(self, obj):
        return mark_safe(MAP_HTML)
    map_widget.short_description = 'Interactive map'

    def primary_image_preview(self, obj):
        url = obj.primary_image
        if url:
            return format_html(
                '<img src="{}" style="max-height:180px;border-radius:8px;'
                'border:1px solid #ddd;margin:4px 0;" />',
                url
            )
        return '—'
    primary_image_preview.short_description = 'Cover photo'

    def rating_readonly(self, obj):
        return obj.average_rating or '—'
    rating_readonly.short_description = 'Average rating'

    def review_count_readonly(self, obj):
        return obj.review_count
    review_count_readonly.short_description = 'Review count'

    # ── list column renderers ────────────────────────────────────────────────

    def thumbnail(self, obj):
        url = obj.primary_image
        if url:
            return format_html(
                '<img src="{}" style="height:46px;width:70px;object-fit:cover;'
                'border-radius:4px;border:1px solid #ddd;" />',
                url
            )
        return mark_safe('<span style="color:#bbb;font-size:11px;">no img</span>')
    thumbnail.short_description = ''

    def host_link(self, obj):
        return format_html(
            '<a href="/admin/accounts/user/{}/change/">{}</a>',
            obj.host_id, obj.host.email
        )
    host_link.short_description = 'Host'
    host_link.admin_order_field = 'host__email'

    def price_tag(self, obj):
        price = f'${obj.price_per_night}/night'
        return format_html('<span>{}</span>', price)
    price_tag.short_description = 'Price'
    price_tag.admin_order_field = 'price_per_night'

    def guests_display(self, obj):
        return f'{obj.guests} guests · {obj.bedrooms}bd · {obj.bathrooms}ba'
    guests_display.short_description = 'Capacity'

    def rating_display(self, obj):
        r = obj.average_rating
        if r is None:
            return mark_safe('<span style="color:#ccc;">&#8212;</span>')
        filled = int(round(r))
        stars = '★' * filled + '☆' * (5 - filled)
        r_str = f'{r:.1f}'
        return format_html(
            '<span style="color:#E8472A;letter-spacing:1px;">{}</span>'
            '<span style="color:#888;font-size:11px;margin-left:4px;">{}</span>',
            stars, r_str
        )
    rating_display.short_description = 'Rating'

    def coords_display(self, obj):
        if obj.latitude and obj.longitude:
            return format_html(
                '<span style="color:#15803d;font-size:11px;font-family:monospace;">📍{},{}</span>',
                round(float(obj.latitude), 3), round(float(obj.longitude), 3)
            )
        return mark_safe('<span style="color:#dc2626;font-size:11px;">&#x2717; none</span>')
    coords_display.short_description = 'Coords'
