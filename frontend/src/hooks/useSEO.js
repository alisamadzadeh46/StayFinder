import { useEffect } from 'react';

const SITE_NAME = 'StayFinder';
const DEFAULT_IMAGE = '/og-default.jpg';

function setMeta(selector, attr, value) {
  if (!value) return;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    if (selector.includes('property='))
      el.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
    else if (selector.includes('name='))
      el.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

function injectJSON(id, data) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = id; document.head.appendChild(el); }
  el.textContent = JSON.stringify(data);
}

// ── main hook ─────────────────────────────────────────────────────────────────
export function useSEO({ title, description, image, url, structuredData, breadcrumb } = {}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Find your perfect stay`;
  const desc  = description || '';
  const img   = image || DEFAULT_IMAGE;
  const canon = url || (typeof window !== 'undefined' ? window.location.href : '');

  useEffect(() => {
    document.title = fullTitle;
    setMeta('meta[name="description"]',        'content', desc);
    setMeta('meta[name="robots"]',             'content', 'index, follow');
    setLink('canonical', canon);
    setMeta('meta[property="og:title"]',       'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', desc);
    setMeta('meta[property="og:image"]',       'content', img);
    setMeta('meta[property="og:url"]',         'content', canon);
    setMeta('meta[property="og:site_name"]',   'content', SITE_NAME);
    setMeta('meta[name="twitter:card"]',       'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]',      'content', fullTitle);
    setMeta('meta[name="twitter:description"]','content', desc);
    setMeta('meta[name="twitter:image"]',      'content', img);
    if (structuredData) injectJSON('ld-json-main', structuredData);
    if (breadcrumb)     injectJSON('ld-json-breadcrumb', breadcrumb);
  }, [fullTitle, desc, img, canon]); // ← only primitive deps — stable
}

// ── listing SEO builder ───────────────────────────────────────────────────────
export function buildListingSEO(listing) {
  if (!listing) return {};
  const SITE_URL = (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');
  const url = `${SITE_URL}/listing/${listing.slug}`;

  return {
    title: listing.seo_title || listing.title,
    description: listing.seo_description || (listing.description || '').slice(0, 155),
    image: listing.primary_image || DEFAULT_IMAGE,
    url,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'LodgingBusiness',
      name: listing.title,
      url,
      priceRange: `$${listing.price_per_night}/night`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: listing.city,
        addressCountry: listing.country,
      },
      ...(listing.average_rating ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(listing.average_rating),
          reviewCount: listing.review_count,
          bestRating: '5',
        }
      } : {}),
    },
  };
}

// ── page presets ──────────────────────────────────────────────────────────────
export const PAGE_SEO = {
  home:       { title: null,              description: 'Discover unique homes, villas and apartments around the world.' },
  trips:      { title: 'My Trips',        description: 'View and manage your bookings.' },
  saved:      { title: 'Saved Places',    description: 'Your wishlist of favourite homes.' },
  profile:    { title: 'My Profile',      description: 'Manage your StayFinder account.' },
  newListing: { title: 'List your space', description: 'Become a host on StayFinder.' },
  dashboard:  { title: 'Host Dashboard',  description: 'Manage your listings and bookings.' },
};
