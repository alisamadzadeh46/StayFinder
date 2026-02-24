import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, formatPrice, formatDate } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Icon, Badge, Spinner, useToast } from '../components/UI';
import ListingCard from '../components/ListingCard';

const STATUS_COLOR = { pending: 'amber', confirmed: 'green', cancelled: 'red', completed: 'blue' };

export function TripsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { show, ToastEl } = useToast();

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    apiFetch('/bookings/').then(d => { setBookings(d.results || d); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await apiFetch(`/bookings/${id}/cancel/`, { method: 'POST' });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      show('Booking cancelled');
    } catch { show('Could not cancel', 'error'); }
  };

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={36} /></div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      {ToastEl}
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Your trips</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 32 }}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>

      {bookings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✈️</div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>No trips yet</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>Time to start planning your next adventure</p>
          <Link to="/" style={{ padding: '12px 28px', background: 'var(--primary)', color: 'white', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
            Explore stays
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {bookings.map(b => (
            <div key={b.id} style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', display: 'flex' }}>
              <Link to={`/listing/${b.listing}`} style={{ flexShrink: 0 }}>
                <img src={b.primary_image || `https://picsum.photos/seed/${b.listing}/200/160`} alt=""
                  style={{ width: 160, height: '100%', minHeight: 130, objectFit: 'cover', display: 'block' }} />
              </Link>
              <div style={{ flex: 1, padding: '18px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Link to={`/listing/${b.listing}`}>
                    <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: 'var(--text)' }}>{b.listing_title}</h3>
                  </Link>
                  <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="map" size={13} /> {b.listing_city}, {b.listing_country}
                  </p>
                  <p style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon name="calendar" size={14} />
                    {formatDate(b.check_in)} → {formatDate(b.check_out)}
                    <span style={{ color: 'var(--text-light)', fontSize: 12 }}>· {b.nights} nights</span>
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
                    {b.guests} guest{b.guests !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 17 }}>{formatPrice(b.total_price)}</span>
                  <Badge color={STATUS_COLOR[b.status]}>{b.status}</Badge>
                  {['pending', 'confirmed'].includes(b.status) && (
                    <button onClick={() => handleCancel(b.id)} style={{
                      fontSize: 12, padding: '5px 12px', border: '1.5px solid #fca5a5',
                      color: '#dc2626', borderRadius: 6, background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SavedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { show, ToastEl } = useToast();

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    apiFetch('/wishlists/saved/').then(d => {
      const data = d.results || d;
      setListings(data);
      setSavedIds(data.map(l => l.id));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleSave = async (id) => {
    const r = await apiFetch(`/wishlists/toggle/${id}/`, { method: 'POST' });
    if (!r.saved) {
      setListings(prev => prev.filter(l => l.id !== id));
      setSavedIds(prev => prev.filter(i => i !== id));
      show('Removed from wishlist');
    }
  };

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size={36} /></div>;

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 24px' }}>
      {ToastEl}
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Wishlists</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 32 }}>{listings.length} saved place{listings.length !== 1 ? 's' : ''}</p>

      {listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❤️</div>
          <h2 style={{ fontSize: 24, marginBottom: 8 }}>No saved places yet</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>Heart a listing to add it here</p>
          <Link to="/" style={{ padding: '12px 28px', background: 'var(--primary)', color: 'white', borderRadius: 10, fontWeight: 700, fontSize: 15 }}>
            Browse listings
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(272px,1fr))', gap: 24 }}>
          {listings.map(l => <ListingCard key={l.id} listing={l} savedIds={savedIds} onSave={handleSave} />)}
        </div>
      )}
    </div>
  );
}
