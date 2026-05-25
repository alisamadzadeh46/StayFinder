import { useEffect, useRef } from 'react';

export default function MapView({ listing, nearby = [] }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    // Guard: container must exist and not already initialized
    if (!mapRef.current || instanceRef.current) return;
    if (!listing?.latitude || !listing?.longitude) return;

    let map = null;

    const init = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        // Double-check container still exists
        if (!mapRef.current) return;

        map = L.map(mapRef.current, {
          center: [parseFloat(listing.latitude), parseFloat(listing.longitude)],
          zoom: 14,
          zoomControl: true,
          scrollWheelZoom: false,
        });

        instanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        // Main listing marker
        const icon = L.divIcon({
          html: `<div style="background:#E8472A;color:white;padding:4px 10px;border-radius:20px;font-weight:700;font-size:13px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.3);">$${listing.price_per_night}</div>`,
          className: '',
          iconAnchor: [30, 15],
        });
        L.marker([parseFloat(listing.latitude), parseFloat(listing.longitude)], { icon })
          .addTo(map)
          .bindPopup(listing.title);

        // Nearby markers
        nearby.forEach(n => {
          if (!n.latitude || !n.longitude || n.id === listing.id) return;
          const ni = L.divIcon({
            html: `<div style="background:white;color:#333;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid #ddd;box-shadow:0 1px 4px rgba(0,0,0,.15);">$${n.price_per_night}</div>`,
            className: '',
            iconAnchor: [20, 12],
          });
          L.marker([parseFloat(n.latitude), parseFloat(n.longitude)], { icon: ni })
            .addTo(map)
            .bindPopup(n.title);
        });

        // Fix map size after render
        setTimeout(() => map?.invalidateSize(), 300);
      } catch (e) {
        console.warn('Map init error:', e.message);
      }
    };

    init();

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, [listing?.id]);

  if (!listing?.latitude || !listing?.longitude) {
    return (
      <div style={{ height: 320, background: '#f5f5f5', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        <p>Location not available</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e8e8' }}
    />
  );
}
