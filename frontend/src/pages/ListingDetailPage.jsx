import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch, formatPrice, formatDate } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Icon, StarRating, Badge, Spinner, useToast } from '../components/UI';
import MapView from '../components/MapView';

const AMENITY_LIST = [
  { key: 'has_wifi',      label: 'WiFi',          emoji: '📶' },
  { key: 'has_kitchen',   label: 'Kitchen',        emoji: '🍳' },
  { key: 'has_parking',   label: 'Free parking',   emoji: '🚗' },
  { key: 'has_pool',      label: 'Pool',           emoji: '🏊' },
  { key: 'has_ac',        label: 'Air conditioning',emoji: '❄️' },
  { key: 'has_washer',    label: 'Washer',         emoji: '🫧' },
  { key: 'has_tv',        label: 'TV',             emoji: '📺' },
  { key: 'has_gym',       label: 'Gym',            emoji: '💪' },
  { key: 'has_workspace', label: 'Workspace',      emoji: '💼' },
  { key: 'has_fireplace', label: 'Fireplace',      emoji: '🔥' },
  { key: 'has_bbq',       label: 'BBQ grill',      emoji: '🍖' },
  { key: 'has_ev_charger',label: 'EV charger',     emoji: '⚡' },
];

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { show, ToastEl } = useToast();

  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  // Booking
  const [checkIn, setCheckIn]     = useState('');
  const [checkOut, setCheckOut]   = useState('');
  const [guests, setGuests]       = useState(1);
  const [booking, setBooking]     = useState(null);
  const [bookErr, setBookErr]     = useState('');
  const [bookLoading, setBookLoading] = useState(false);

  // Review
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch(`/listings/${id}/`),
      apiFetch(`/reviews/listings/${id}/reviews/`),
    ]).then(([l, r]) => {
      setListing(l);
      setReviews(r.results || r);
      setLoading(false);
    }).catch(() => { setLoading(false); navigate('/'); });
  }, [id]);

  useEffect(() => {
    if (user) {
      apiFetch('/wishlists/saved/ids/')
        .then(ids => setIsSaved(ids.includes(Number(id))))
        .catch(() => {});
    }
  }, [user, id]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size={40} />
    </div>
  );
  if (!listing) return null;

  const images = listing.images?.length
    ? listing.images
    : [{ url: `https://picsum.photos/seed/${id}/1200/800` }];

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0;
  const subtotal = nights * Number(listing.price_per_night);
  const cleaningFee = Math.round(subtotal * 0.15);
  const total = subtotal + cleaningFee;

  const amenities = AMENITY_LIST.filter(a => listing[a.key]);
  const today = new Date().toISOString().split('T')[0];

  const handleSave = async () => {
    if (!user) { show('Log in to save listings', 'info'); return; }
    const r = await apiFetch(`/wishlists/toggle/${id}/`, { method: 'POST' });
    setIsSaved(r.saved);
    show(r.saved ? 'Saved to wishlist ❤️' : 'Removed from wishlist');
  };

  const handleBook = async () => {
    if (!user) { show('Please log in to book', 'info'); return; }
    if (!checkIn || !checkOut) { setBookErr('Please select dates.'); return; }
    setBookErr(''); setBookLoading(true);
    try {
      const b = await apiFetch('/bookings/', {
        method: 'POST',
        body: JSON.stringify({ listing: listing.id, check_in: checkIn, check_out: checkOut, guests }),
      });
      setBooking(b);
      show('Booking confirmed! 🎉');
    } catch (e) {
      setBookErr(e?.non_field_errors?.[0] || 'Dates unavailable. Please try other dates.');
    } finally {
      setBookLoading(false);
    }
  };

  const handleReview = async () => {
    if (!user) { show('Log in to leave a review', 'info'); return; }
    setReviewLoading(true);
    try {
      const r = await apiFetch(`/reviews/listings/${id}/reviews/`, {
        method: 'POST', body: JSON.stringify({ listing: Number(id), ...reviewForm }),
      });
      setReviews(prev => [r, ...prev]);
      setReviewForm({ rating: 5, comment: '' });
      show('Review posted! Thank you 🌟');
    } catch (e) {
      show(e?.non_field_errors?.[0] || 'Could not post review', 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {ToastEl}

      {/* Back button */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}>
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'inherit',
        }}>
          <Icon name="arrowLeft" size={16} /> Back to results
        </button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px' }}>

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,32px)', fontWeight: 700, marginBottom: 8 }}>
            {listing.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <StarRating rating={listing.average_rating} count={listing.review_count} size={15} />
            <span style={{ color: 'var(--text-light)' }}>·</span>
            <span style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <Icon name="location" size={14} />{listing.city}, {listing.country}
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
              <button onClick={handleSave} style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                border: '1.5px solid var(--border)', borderRadius: 8, padding: '7px 14px',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                color: isSaved ? 'var(--primary)' : 'var(--text)',
              }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {isSaved ? 'Saved' : 'Save'}
              </button>
            </span>
          </div>
        </div>

        {/* Gallery */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 32, height: 420 }}>
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <img src={images[imgIdx]?.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => {}} />
            {images.length > 1 && (
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} style={{
                    width: i === imgIdx ? 20 : 8, height: 8, borderRadius: 4,
                    background: i === imgIdx ? 'white' : 'rgba(255,255,255,.6)',
                    border: 'none', cursor: 'pointer', transition: 'width .2s', padding: 0,
                  }} />
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[1, 2, 3, 4].map(i => (
              images[i] ? (
                <img key={i} src={images[i].url} alt="" onClick={() => setImgIdx(i)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }} />
              ) : (
                <div key={i} style={{ background: '#f0f0f0' }} />
              )
            ))}
          </div>
        </div>

        {/* Content + Booking Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 56, alignItems: 'start' }}>

          {/* Left */}
          <div>
            {/* Host */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 28, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                  {listing.property_type?.replace('_', ' ')} hosted by {listing.host_name}
                </h2>
                <p style={{ color: 'var(--text-light)', fontSize: 15 }}>
                  {listing.guests} guests · {listing.bedrooms} bedrooms · {listing.beds} beds · {listing.bathrooms} baths
                </p>
              </div>
              {listing.host_avatar ? (
                <img src={listing.host_avatar} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                  {listing.host_name?.[0]}
                </div>
              )}
            </div>

            {/* Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 28, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
              {listing.host_is_superhost && (
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>🏆</span>
                  <div>
                    <p style={{ fontWeight: 700, marginBottom: 2 }}>Superhost</p>
                    <p style={{ fontSize: 14, color: 'var(--text-light)' }}>Superhosts are experienced, highly-rated hosts who are committed to providing great stays.</p>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>📍</span>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>Great location</p>
                  <p style={{ fontSize: 14, color: 'var(--text-light)' }}>{listing.address}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <section style={{ paddingBottom: 28, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
              <p style={{ lineHeight: 1.8, fontSize: 15, color: 'var(--text-mid)' }}>{listing.description}</p>
            </section>

            {/* Amenities */}
            {amenities.length > 0 && (
              <section style={{ paddingBottom: 28, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 18 }}>What this place offers</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {amenities.map(a => (
                    <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15 }}>
                      <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{a.emoji}</span>
                      <span>{a.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Map */}
            {listing.latitude && listing.longitude && (
              <section style={{ paddingBottom: 28, borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Where you'll be</h2>
                <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 16 }}>
                  {listing.city}, {listing.country}
                </p>
                <MapView
                  lat={Number(listing.latitude)}
                  lng={Number(listing.longitude)}
                  title={`${formatPrice(listing.price_per_night)}/night`}
                  zoom={13}
                  height={360}
                />
              </section>
            )}

            {/* Reviews */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700 }}>Reviews</h2>
                <StarRating rating={listing.average_rating} count={listing.review_count} size={16} />
              </div>

              {reviews.length === 0 && (
                <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>No reviews yet. Be the first to share your experience!</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
                {reviews.slice(0, 6).map(r => (
                  <div key={r.id} style={{ padding: 20, background: 'white', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      {r.author_avatar ? (
                        <img src={r.author_avatar} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {r.author_name?.[0]}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 700, fontSize: 14 }}>{r.author_name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{formatDate(r.created_at)}</p>
                      </div>
                      <StarRating rating={r.rating} size={13} />
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-mid)' }}>{r.comment}</p>
                  </div>
                ))}
              </div>

              {/* Write review */}
              {user && (
                <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Share your experience</h3>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                        <svg width={24} height={24} viewBox="0 0 24 24"
                          fill={reviewForm.rating >= n ? '#E8472A' : '#e8e8e8'}
                          stroke="none">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Tell others what you loved about this place..."
                    style={{
                      width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', fontSize: 14, fontFamily: 'inherit',
                      resize: 'vertical', minHeight: 100, outline: 'none',
                    }}
                  />
                  <button onClick={handleReview} disabled={reviewLoading || !reviewForm.comment.trim()}
                    style={{
                      marginTop: 12, padding: '10px 24px', background: 'var(--accent)',
                      color: 'white', border: 'none', borderRadius: 8,
                      fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                      opacity: reviewLoading || !reviewForm.comment.trim() ? .5 : 1,
                    }}>
                    {reviewLoading ? 'Posting...' : 'Post review'}
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* Booking Panel */}
          <div style={{ position: 'sticky', top: 90 }}>
            <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: 28, boxShadow: '0 6px 32px rgba(0,0,0,.12)', border: '1px solid var(--border)' }}>
              {booking ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ width: 60, height: 60, background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white' }}>
                    <Icon name="check" size={28} />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Booking confirmed!</h3>
                  <p style={{ color: 'var(--text-light)', marginBottom: 4 }}>{formatDate(booking.check_in)} → {formatDate(booking.check_out)}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)', marginBottom: 20 }}>{formatPrice(booking.total_price)} total</p>
                  <button onClick={() => navigate('/trips')} style={{ padding: '10px 24px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    View my trips
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>{formatPrice(listing.price_per_night)}</span>
                    <span style={{ color: 'var(--text-light)', fontSize: 15 }}> / night</span>
                    {listing.average_rating && (
                      <div style={{ marginTop: 4 }}>
                        <StarRating rating={listing.average_rating} count={listing.review_count} size={14} />
                      </div>
                    )}
                  </div>

                  {/* Date picker */}
                  <div style={{ border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ padding: '10px 14px', borderRight: '1px solid var(--border)' }}>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-light)', marginBottom: 4 }}>Check-in</label>
                        <input type="date" min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)}
                          style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent', fontFamily: 'inherit' }} />
                      </div>
                      <div style={{ padding: '10px 14px' }}>
                        <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-light)', marginBottom: 4 }}>Check-out</label>
                        <input type="date" min={checkIn || today} value={checkOut} onChange={e => setCheckOut(e.target.value)}
                          style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%', background: 'transparent', fontFamily: 'inherit' }} />
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px' }}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--text-light)', marginBottom: 6 }}>Guests</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => setGuests(g => Math.max(1, g - 1))} style={guestBtnStyle}>–</button>
                        <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{guests}</span>
                        <button onClick={() => setGuests(g => Math.min(listing.guests, g + 1))} style={guestBtnStyle}>+</button>
                        <span style={{ fontSize: 13, color: 'var(--text-light)' }}>/ max {listing.guests}</span>
                      </div>
                    </div>
                  </div>

                  {bookErr && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>{bookErr}</p>}

                  <button onClick={handleBook} disabled={bookLoading}
                    style={{
                      width: '100%', padding: 14, background: 'var(--primary)',
                      color: 'white', border: 'none', borderRadius: 'var(--radius-sm)',
                      fontWeight: 700, fontSize: 16, cursor: 'pointer',
                      fontFamily: 'inherit', marginBottom: nights > 0 ? 16 : 0,
                      opacity: bookLoading ? .7 : 1,
                    }}>
                    {bookLoading ? 'Reserving...' : user ? 'Reserve' : 'Log in to reserve'}
                  </button>

                  {nights > 0 && (
                    <div>
                      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-light)', marginBottom: 14 }}>You won't be charged yet</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                          <span style={{ textDecoration: 'underline' }}>{formatPrice(listing.price_per_night)} × {nights} nights</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                          <span style={{ textDecoration: 'underline' }}>Cleaning fee</span>
                          <span>{formatPrice(cleaningFee)}</span>
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
                          <span>Total</span>
                          <span>{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const guestBtnStyle = {
  width: 28, height: 28, border: '1.5px solid var(--border-mid)', borderRadius: '50%',
  background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 18, fontFamily: 'inherit',
};
