import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, StarRating } from './UI';
import { formatPrice } from '../utils/api';

export default function ListingCard({ listing, savedIds, onSave }) {
  const navigate = useNavigate();
  const [imgIdx, setImgIdx] = useState(0);
  const images = listing.images?.length
    ? listing.images
    : [{ url: `https://picsum.photos/seed/${listing.id}/800/600` }];
  const isSaved = savedIds?.includes(listing.id);

  return (
    <article
      style={{
        background: 'white', borderRadius: 'var(--radius)',
        overflow: 'hidden', cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform .2s, box-shadow .2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
    >
      {/* Image */}
      <div
        onClick={() => navigate(`/listing/${listing.id}`)}
        style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}
      >
        <img
          src={images[imgIdx]?.url || images[0].url}
          alt={listing.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}
        />

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            {imgIdx > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setImgIdx(i => i - 1); }}
                style={navBtnStyle('left')}
              ><Icon name="chevronLeft" size={14} /></button>
            )}
            {imgIdx < images.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setImgIdx(i => i + 1); }}
                style={navBtnStyle('right')}
              ><Icon name="chevronRight" size={14} /></button>
            )}
            <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
              {images.map((_, i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i === imgIdx ? 'white' : 'rgba(255,255,255,.5)' }} />
              ))}
            </div>
          </>
        )}

        {/* Save */}
        <button
          onClick={e => { e.stopPropagation(); onSave?.(listing.id); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            color: isSaved ? 'var(--primary)' : 'rgba(255,255,255,.85)',
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.5))',
            transition: 'transform .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}
        >
          <svg width={22} height={22} viewBox="0 0 24 24"
            fill={isSaved ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="1.8">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Type badge */}
        <span style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)',
          color: 'white', fontSize: 11, fontWeight: 600,
          padding: '3px 10px', borderRadius: 20, textTransform: 'capitalize',
        }}>
          {listing.property_type?.replace('_', ' ')}
        </span>
      </div>

      {/* Body */}
      <div onClick={() => navigate(`/listing/${listing.id}`)} style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{listing.city}, {listing.country}</span>
          <StarRating rating={listing.average_rating} count={listing.review_count} size={13} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {listing.title}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 8 }}>
          {listing.guests} guests · {listing.bedrooms} bed · {listing.bathrooms} bath
        </p>
        <p style={{ fontSize: 15 }}>
          <strong>{formatPrice(listing.price_per_night)}</strong>
          <span style={{ color: 'var(--text-light)', fontSize: 13 }}> / night</span>
        </p>
      </div>
    </article>
  );
}

const navBtnStyle = (side) => ({
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  [side]: 8,
  background: 'white', border: 'none', borderRadius: '50%',
  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.2)',
});
