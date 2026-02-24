import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, formatPrice, formatDate } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Icon, Badge, StarRating, Spinner, useToast } from '../components/UI';

const STAT_CARD = ({ icon, label, value, sub, color = 'var(--primary)' }) => (
  <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ width: 42, height: 42, background: color + '18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon name={icon} size={20} />
      </div>
    </div>
    <p style={{ fontSize: 28, fontWeight: 800, marginBottom: 2 }}>{value}</p>
    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-mid)', marginBottom: sub ? 2 : 0 }}>{label}</p>
    {sub && <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{sub}</p>}
  </div>
);

const STATUS_COLOR = { pending: 'amber', confirmed: 'green', cancelled: 'red', completed: 'blue' };

export default function HostDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { show, ToastEl } = useToast();

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/'); return; }

    Promise.all([
      apiFetch('/listings/host/stats/'),
      apiFetch('/listings/host/my-listings/'),
      apiFetch('/listings/host/bookings/'),
    ]).then(([s, l, b]) => {
      setStats(s); setListings(l); setBookings(b);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, authLoading]);

  const handleConfirm = async (id) => {
    try {
      await apiFetch(`/bookings/${id}/confirm/`, { method: 'POST' });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
      show('Booking confirmed!');
    } catch { show('Failed to confirm', 'error'); }
  };

  const handleToggleListing = async (id, isActive) => {
    try {
      await apiFetch(`/listings/${id}/`, { method: 'PATCH', body: JSON.stringify({ is_active: !isActive }) });
      setListings(prev => prev.map(l => l.id === id ? { ...l, is_active: !isActive } : l));
      show(isActive ? 'Listing deactivated' : 'Listing activated');
    } catch { show('Failed to update', 'error'); }
  };

  if (loading || authLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={40} />
    </div>
  );

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {ToastEl}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 4 }}>
              Host Dashboard
            </h1>
            <p style={{ color: 'var(--text-light)', fontSize: 15 }}>
              Welcome back, {user?.first_name || user?.email} 👋
            </p>
          </div>
          <button onClick={() => navigate('/host/new-listing')} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 22px', background: 'var(--primary)',
            color: 'white', border: 'none', borderRadius: 10,
            fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <Icon name="plus" size={16} /> Add listing
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
          {['overview', 'listings', 'bookings'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', border: 'none', background: 'none',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              color: tab === t ? 'var(--primary)' : 'var(--text-light)',
              borderBottom: `2px solid ${tab === t ? 'var(--primary)' : 'transparent'}`,
              textTransform: 'capitalize', transition: 'all .15s',
            }}>
              {t}
              {t === 'bookings' && pendingCount > 0 && (
                <span style={{ marginLeft: 6, background: 'var(--primary)', color: 'white', borderRadius: 20, fontSize: 11, padding: '1px 7px' }}>
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 32 }}>
              <STAT_CARD icon="home"     label="Active listings"    value={stats.active_listings}    sub={`${stats.total_listings} total`} color="var(--primary)" />
              <STAT_CARD icon="calendar" label="Total bookings"     value={stats.total_bookings}     sub={`${stats.pending_bookings} pending`} color="#7c3aed" />
              <STAT_CARD icon="cash"     label="Total revenue"      value={formatPrice(stats.total_revenue)} sub="from confirmed stays" color="#059669" />
              <STAT_CARD icon="users"    label="Total guests"       value={stats.total_guests}       sub="across all bookings" color="#d97706" />
              <STAT_CARD icon="star"     label="Average rating"     value={stats.average_rating ? `${stats.average_rating} ★` : '—'} sub={`${stats.total_reviews} reviews`} color="#E8472A" />
            </div>

            {/* Recent bookings */}
            {bookings.length > 0 && (
              <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Recent bookings</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {bookings.slice(0, 5).map((b, i) => (
                    <div key={b.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
                      borderBottom: i < Math.min(bookings.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <img src={b.primary_image || `https://picsum.photos/seed/${b.listing}/60/60`} alt=""
                        style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.listing_title}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                          {b.guest_name} · {formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.nights} nights
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{formatPrice(b.total_price)}</span>
                        <Badge color={STATUS_COLOR[b.status]}>{b.status}</Badge>
                        {b.status === 'pending' && (
                          <button onClick={() => handleConfirm(b.id)} style={{
                            padding: '5px 14px', background: '#059669', color: 'white',
                            border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 12,
                            cursor: 'pointer', fontFamily: 'inherit',
                          }}>
                            Confirm
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Listings tab */}
        {tab === 'listings' && (
          <div>
            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏡</div>
                <h2 style={{ fontSize: 20, marginBottom: 8 }}>No listings yet</h2>
                <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>Create your first listing to start hosting</p>
                <button onClick={() => navigate('/host/new-listing')} style={{ padding: '11px 24px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Add your first listing
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {listings.map(l => (
                  <div key={l.id} style={{ background: 'white', borderRadius: 'var(--radius)', padding: 16, boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <img src={l.primary_image || `https://picsum.photos/seed/${l.id}/120/90`} alt=""
                      style={{ width: 100, height: 75, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</h3>
                        <Badge color={l.is_active ? 'green' : 'default'}>{l.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>
                        {l.city}, {l.country} · {l.property_type?.replace('_', ' ')}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
                        <span style={{ fontWeight: 700 }}>{formatPrice(l.price_per_night)}/night</span>
                        <StarRating rating={l.average_rating} count={l.review_count} size={13} />
                        <span style={{ color: 'var(--text-light)' }}>{l.bookings?.length || 0} bookings</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <Link to={`/listing/${l.id}`} style={{ padding: '7px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon name="eye" size={14} /> View
                      </Link>
                      <button onClick={() => handleToggleListing(l.id, l.is_active)} style={{
                        padding: '7px 14px', border: '1.5px solid var(--border)',
                        borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        background: 'none', color: l.is_active ? '#d97706' : '#059669',
                        fontFamily: 'inherit',
                      }}>
                        {l.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bookings tab */}
        {tab === 'bookings' && (
          <div>
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                <h2 style={{ fontSize: 20, marginBottom: 8 }}>No bookings yet</h2>
                <p style={{ color: 'var(--text-light)' }}>Bookings for your listings will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bookings.map(b => (
                  <div key={b.id} style={{ background: 'white', borderRadius: 'var(--radius)', padding: 20, boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <img src={b.primary_image || `https://picsum.photos/seed/${b.listing}/100/80`} alt=""
                      style={{ width: 80, height: 64, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{b.listing_title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {b.guest_avatar ? (
                          <img src={b.guest_avatar} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>
                            {b.guest_name?.[0]}
                          </div>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{b.guest_name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-light)' }}>{b.guest_email}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-light)' }}>
                        {formatDate(b.check_in)} → {formatDate(b.check_out)} · {b.nights} nights · {b.guests} guests
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>{formatPrice(b.total_price)}</span>
                      <Badge color={STATUS_COLOR[b.status]}>{b.status}</Badge>
                      {b.status === 'pending' && (
                        <button onClick={() => handleConfirm(b.id)} style={{
                          padding: '6px 16px', background: '#059669', color: 'white',
                          border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 13,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}>
                          ✓ Confirm
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
