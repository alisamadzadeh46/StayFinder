import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiFetch } from '../utils/api';
import ListingCard from '../components/ListingCard';
import FilterBar from '../components/FilterBar';
import { Spinner, Icon, useToast } from '../components/UI';

const EMPTY_FILTERS = {
  property_type: '', min_price: '', max_price: '', min_guests: '',
  min_bedrooms: '', has_wifi: '', has_pool: '', has_kitchen: '',
  has_parking: '', has_ac: '', has_gym: '', has_workspace: '', has_fireplace: '',
};

export default function HomePage({ searchQuery }) {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [savedIds, setSavedIds] = useState([]);
  const { show, ToastEl } = useToast();

  useEffect(() => {
    if (user) {
      apiFetch('/wishlists/saved/ids/').then(setSavedIds).catch(() => {});
    }
  }, [user]);

  const fetchListings = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', page);

    apiFetch(`/search/?${params}`)
      .then(d => {
        setListings(d.results || d);
        setTotal(d.count || (d.results || d).length);
        setTotalPages(d.total_pages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [searchQuery, filters, page]);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { setPage(1); }, [searchQuery, filters]);

  const handleSave = async (id) => {
    if (!user) { show('Log in to save listings', 'info'); return; }
    try {
      const r = await apiFetch(`/wishlists/toggle/${id}/`, { method: 'POST' });
      if (r.saved) {
        setSavedIds(p => [...p, id]);
        show('Saved to wishlist ❤️');
      } else {
        setSavedIds(p => p.filter(i => i !== id));
        show('Removed from wishlist');
      }
    } catch { show('Something went wrong', 'error'); }
  };

  return (
    <div>
      {ToastEl}
      <FilterBar filters={filters} onChange={f => setFilters(f)} />

      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '28px 24px' }}>
        {/* Results count */}
        {!loading && (
          <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 20 }}>
            {total.toLocaleString()} place{total !== 1 ? 's' : ''} found
            {searchQuery && <span> for "<strong>{searchQuery}</strong>"</span>}
          </p>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(272px,1fr))', gap: 24 }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{ background: '#ebebeb', borderRadius: 'var(--radius)', aspectRatio: '3/4', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏡</div>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>No listings found</h2>
            <p style={{ color: 'var(--text-light)' }}>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(272px,1fr))', gap: 24 }}>
              {listings.map(l => (
                <ListingCard key={l.id} listing={l} savedIds={savedIds} onSave={handleSave} />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 48 }}>
                <button
                  onClick={() => setPage(p => p - 1)} disabled={page === 1}
                  style={pageBtnStyle(page > 1)}
                >
                  <Icon name="chevronLeft" size={16} /> Prev
                </button>
                <span style={{ fontSize: 14, color: 'var(--text-light)' }}>Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                  style={pageBtnStyle(page < totalPages)}
                >
                  Next <Icon name="chevronRight" size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  );
}

const pageBtnStyle = (active) => ({
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '9px 18px', border: '1.5px solid var(--border)',
  borderRadius: 8, background: 'white', cursor: active ? 'pointer' : 'not-allowed',
  fontSize: 14, fontWeight: 600, color: active ? 'var(--text)' : 'var(--text-light)',
  fontFamily: 'inherit', opacity: active ? 1 : .5,
});
