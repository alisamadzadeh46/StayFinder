const TYPES = ['house', 'apartment', 'villa', 'cabin', 'condo', 'studio', 'beach_house', 'treehouse', 'farm', 'boat'];
const AMENITIES = [
  { key: 'has_wifi', label: 'WiFi' }, { key: 'has_pool', label: 'Pool' },
  { key: 'has_kitchen', label: 'Kitchen' }, { key: 'has_parking', label: 'Parking' },
  { key: 'has_ac', label: 'AC' }, { key: 'has_gym', label: 'Gym' },
  { key: 'has_workspace', label: 'Workspace' }, { key: 'has_fireplace', label: 'Fireplace' },
];

export default function FilterBar({ filters, onChange }) {
  const set = (k, v) => onChange({ ...filters, [k]: v });
  const toggleAmenity = (k) => set(k, filters[k] === 'true' ? '' : 'true');

  return (
    <div style={{ borderBottom: '1px solid var(--border)', background: 'white' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '10px 24px', overflowX: 'auto', display: 'flex', gap: 20, alignItems: 'flex-start', scrollbarWidth: 'none' }}>

        {/* Property type */}
        <div style={groupStyle}>
          <label style={labelStyle}>Type</label>
          <div style={chipsRow}>
            <Chip active={!filters.property_type} onClick={() => set('property_type', '')}>All</Chip>
            {TYPES.map(t => (
              <Chip key={t} active={filters.property_type === t} onClick={() => set('property_type', t)}>
                {t.replace('_', ' ')}
              </Chip>
            ))}
          </div>
        </div>

        {/* Price */}
        <div style={groupStyle}>
          <label style={labelStyle}>Price / night</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" placeholder="Min $" value={filters.min_price}
              onChange={e => set('min_price', e.target.value)}
              style={inputSm} />
            <span style={{ color: 'var(--text-light)' }}>–</span>
            <input type="number" placeholder="Max $" value={filters.max_price}
              onChange={e => set('max_price', e.target.value)}
              style={inputSm} />
          </div>
        </div>

        {/* Guests */}
        <div style={groupStyle}>
          <label style={labelStyle}>Min Guests</label>
          <input type="number" min={1} placeholder="Any" value={filters.min_guests}
            onChange={e => set('min_guests', e.target.value)}
            style={{ ...inputSm, width: 80 }} />
        </div>

        {/* Bedrooms */}
        <div style={groupStyle}>
          <label style={labelStyle}>Bedrooms</label>
          <input type="number" min={1} placeholder="Any" value={filters.min_bedrooms}
            onChange={e => set('min_bedrooms', e.target.value)}
            style={{ ...inputSm, width: 80 }} />
        </div>

        {/* Amenities */}
        <div style={groupStyle}>
          <label style={labelStyle}>Amenities</label>
          <div style={chipsRow}>
            {AMENITIES.map(a => (
              <Chip key={a.key} active={filters[a.key] === 'true'} onClick={() => toggleAmenity(a.key)}>
                {a.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const groupStyle = { display: 'flex', flexDirection: 'column', gap: 6, minWidth: 'max-content' };
const labelStyle = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: 'var(--text-light)' };
const chipsRow = { display: 'flex', gap: 5, flexWrap: 'nowrap' };
const inputSm = {
  padding: '5px 10px', border: '1.5px solid var(--border)', borderRadius: 20,
  fontSize: 13, outline: 'none', background: 'white', width: 80,
};

const Chip = ({ children, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '5px 13px', border: `1.5px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
    borderRadius: 20, background: active ? 'var(--primary)' : 'white',
    color: active ? 'white' : 'var(--text)', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
    transition: 'all .12s',
  }}>
    {children}
  </button>
);
