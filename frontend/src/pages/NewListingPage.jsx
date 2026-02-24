import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Input, Btn, useToast } from '../components/UI';

const TYPES = ['house','apartment','villa','cabin','condo','studio','beach_house','treehouse','farm','boat'];
const AMENITY_FIELDS = [
  'has_wifi','has_kitchen','has_parking','has_pool','has_ac',
  'has_washer','has_tv','has_gym','has_workspace','has_fireplace','has_bbq','has_ev_charger'
];

const INITIAL = {
  title: '', description: '', property_type: 'apartment',
  price_per_night: '', address: '', city: '', state: '', country: '',
  latitude: '', longitude: '',
  guests: 1, bedrooms: 1, beds: 1, bathrooms: 1,
  has_wifi: false, has_kitchen: false, has_parking: false, has_pool: false,
  has_ac: false, has_washer: false, has_tv: false, has_gym: false,
  has_workspace: false, has_fireplace: false, has_bbq: false, has_ev_charger: false,
  images: [],
};

export default function NewListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { show, ToastEl } = useToast();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const addImage = () => {
    if (!imageUrl.trim()) return;
    setForm(f => ({ ...f, images: [...f.images, imageUrl.trim()] }));
    setImageUrl('');
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!form.country.trim()) e.country = 'Country is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.price_per_night || Number(form.price_per_night) <= 0) e.price_per_night = 'Enter a valid price';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        price_per_night: Number(form.price_per_night),
        guests: Number(form.guests),
        bedrooms: Number(form.bedrooms),
        beds: Number(form.beds),
        bathrooms: Number(form.bathrooms),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      };
      const listing = await apiFetch('/listings/', { method: 'POST', body: JSON.stringify(payload) });
      show('Listing created! 🎉');
      navigate(`/listing/${listing.id}`);
    } catch (e) {
      show('Failed to create listing', 'error');
      setErrors(e || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 24px 80px' }}>
      {ToastEl}
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, marginBottom: 6 }}>List your space</h1>
      <p style={{ color: 'var(--text-light)', marginBottom: 36 }}>Share your home with travelers from around the world</p>

      {/* Basics */}
      <Section title="Basics">
        <div style={{ display: 'grid', gap: 16 }}>
          <Input label="Title" value={form.title} onChange={set('title')} placeholder="Cozy beachfront villa with ocean views" error={errors.title} />
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={5}
              placeholder="Describe your space, its unique features, and what makes it special..."
              style={{ width: '100%', padding: '11px 14px', border: `1.5px solid ${errors.description ? '#dc2626' : 'var(--border)'}`, borderRadius: 8, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
            {errors.description && <span style={{ fontSize: 12, color: '#dc2626' }}>{errors.description}</span>}
          </div>
          <div>
            <label style={labelStyle}>Property type</label>
            <select value={form.property_type} onChange={set('property_type')}
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: 'white', outline: 'none' }}>
              {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
      </Section>

      {/* Location */}
      <Section title="Location">
        <div style={{ display: 'grid', gap: 14 }}>
          <Input label="Address" value={form.address} onChange={set('address')} placeholder="123 Main Street" error={errors.address} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="City" value={form.city} onChange={set('city')} placeholder="Miami" error={errors.city} />
            <Input label="State / Region" value={form.state} onChange={set('state')} placeholder="Florida" />
          </div>
          <Input label="Country" value={form.country} onChange={set('country')} placeholder="USA" error={errors.country} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Latitude (optional)" type="number" value={form.latitude} onChange={set('latitude')} placeholder="25.7617" />
            <Input label="Longitude (optional)" type="number" value={form.longitude} onChange={set('longitude')} placeholder="-80.1918" />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-light)' }}>💡 Providing coordinates enables the map view on your listing page.</p>
        </div>
      </Section>

      {/* Capacity */}
      <Section title="Capacity & rooms">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[['guests','Guests'], ['bedrooms','Bedrooms'], ['beds','Beds'], ['bathrooms','Bathrooms']].map(([k, l]) => (
            <div key={k}>
              <label style={labelStyle}>{l}</label>
              <input type="number" min={1} max={99} value={form[k]} onChange={set(k)}
                style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none', textAlign: 'center' }} />
            </div>
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing">
        <div style={{ maxWidth: 240 }}>
          <Input label="Price per night ($)" type="number" min={1} value={form.price_per_night} onChange={set('price_per_night')} placeholder="150" error={errors.price_per_night} />
        </div>
      </Section>

      {/* Amenities */}
      <Section title="Amenities">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {AMENITY_FIELDS.map(k => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 12px', border: `1.5px solid ${form[k] ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 8, background: form[k] ? 'var(--primary-light)' : 'white', transition: 'all .12s' }}>
              <input type="checkbox" checked={form[k]} onChange={set(k)} style={{ accentColor: 'var(--primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{k.replace('has_', '').replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* Images */}
      <Section title="Photos">
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Paste an image URL..."
            style={{ flex: 1, padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
            onKeyDown={e => e.key === 'Enter' && addImage()} />
          <button onClick={addImage} style={{ padding: '11px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            Add photo
          </button>
        </div>
        {form.images.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {form.images.map((url, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={url} alt="" style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                  style={{ position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ×
                </button>
                {i === 0 && <span style={{ position: 'absolute', bottom: 4, left: 4, background: 'var(--primary)', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>Cover</span>}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Btn full size="lg" onClick={handleSubmit} disabled={loading} style={{ borderRadius: 12 }}>
        {loading ? 'Creating listing...' : 'Create listing'}
      </Btn>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid var(--border)' }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 18 }}>{title}</h2>
    {children}
  </div>
);

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 6 };
