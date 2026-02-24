const BASE = '/api';

const getHeaders = (extra = {}) => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

export const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: getHeaders(options.headers),
    ...options,
  });

  if (res.status === 401) {
    // Try refresh
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      const r = await fetch(`${BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (r.ok) {
        const data = await r.json();
        localStorage.setItem('access_token', data.access);
        // Retry original
        const retry = await fetch(`${BASE}${path}`, {
          headers: getHeaders(options.headers),
          ...options,
        });
        if (!retry.ok) throw await retry.json();
        return retry.status === 204 ? null : retry.json();
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!res.ok) throw await res.json().catch(() => ({ detail: 'Request failed' }));
  return res.status === 204 ? null : res.json();
};

export const formatPrice = (p) => `$${Number(p).toLocaleString()}`;
export const formatDate  = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const formatDateShort = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
