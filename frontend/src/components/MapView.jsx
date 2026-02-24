import { useEffect, useRef, useState } from 'react';

export default function MapView({ lat, lng, title, zoom = 13, height = 340, markers = [] }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Dynamically import leaflet
    import('leaflet').then(L => {
      if (instanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [lat, lng],
        zoom,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Custom icon
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:var(--primary,#E8472A);color:white;padding:5px 12px;border-radius:20px;font-weight:700;font-size:13px;font-family:DM Sans,sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid white">${title || '📍'}</div>`,
        iconAnchor: [50, 20],
      });

      L.marker([lat, lng], { icon }).addTo(map);

      // Extra markers (nearby)
      if (markers.length > 0) {
        markers.forEach(m => {
          if (!m.lat || !m.lng) return;
          const mi = L.divIcon({
            className: '',
            html: `<div style="background:white;color:var(--text,#1a1a1a);padding:4px 10px;border-radius:20px;font-weight:600;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.18);border:1.5px solid #e8e8e8;cursor:pointer">$${m.price}</div>`,
            iconAnchor: [30, 14],
          });
          L.marker([m.lat, m.lng], { icon: mi }).addTo(map).bindPopup(`<strong>${m.title}</strong>`);
        });
      }

      instanceRef.current = map;
      setReady(true);
    });

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, [lat, lng, title]);

  return (
    <div style={{ borderRadius: 'var(--radius)', overflow: 'hidden', position: 'relative' }}>
      <div ref={mapRef} style={{ height, width: '100%', borderRadius: 'var(--radius)' }} />
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', borderRadius: 'var(--radius)' }}>
          <span style={{ color: 'var(--text-light)', fontSize: 14 }}>Loading map…</span>
        </div>
      )}
    </div>
  );
}
