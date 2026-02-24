import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch, formatPrice, formatDate } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { Icon, Badge, StarRating, Spinner, useToast } from '../components/UI';

// ── small reusable stat card ──────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color = '#E8472A', to }) => {
  const inner = (
    <div style={{
      background: 'white', borderRadius: 14, padding: '20px 22px',
      boxShadow: '0 1px 4px rgba(0,0,0,.07)',
      display: 'flex', flexDirection: 'column', gap: 8,
      border: '1px solid #f0f0f0',
      transition: 'box-shadow .15s',
      cursor: to ? 'pointer' : 'default',
    }}
      onMouseEnter={e => { if (to) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.11)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.07)'; }}
    >
      <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon name={icon} size={18} />
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{value ?? '—'}</p>
      <p style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>{label}</p>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>{inner}</Link> : inner;
};

// ── section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div style={{ background: 'white', borderRadius: 16, padding: '28px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f0f0f0' }}>
    {title && <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid #f0f0f0' }}>{title}</h2>}
    {children}
  </div>
);

// ── labeled input ─────────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  padding: '10px 13px', border: '1.5px solid #e8e8e8', borderRadius: 8,
  fontSize: 14, fontFamily: 'inherit', outline: 'none', background: 'white',
  transition: 'border-color .15s',
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { show, ToastEl } = useToast();

  const [tab, setTab] = useState('profile');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // profile form
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', bio: '', avatar: '', phone: '' });
  const [saving, setSaving] = useState(false);

  // password form
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    setForm({
      first_name: user.first_name || '',
      last_name:  user.last_name  || '',
      username:   user.username   || '',
      bio:        user.bio        || '',
      avatar:     user.avatar     || '',
      phone:      user.phone      || '',
    });

    apiFetch('/auth/profile/stats/')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const set  = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const setPw = k => e => setPwForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiFetch('/auth/profile/update/', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      updateUser(updated);
      show('Profile updated ✓');
    } catch (e) {
      show(e?.detail || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwError('');
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("New passwords don't match.");
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    setPwSaving(true);
    try {
      await apiFetch('/auth/profile/password/', {
        method: 'POST',
        body: JSON.stringify({ old_password: pwForm.old_password, new_password: pwForm.new_password }),
      });
      setPwForm({ old_password: '', new_password: '', confirm: '' });
      show('Password changed successfully ✓');
    } catch (e) {
      setPwError(e?.error || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  };

  const displayName = `${user.first_name} ${user.last_name}`.trim() || user.username;
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ background: '#fafaf8', minHeight: '100vh' }}>
      {ToastEl}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Hero card ── */}
        <div style={{
          background: 'white', borderRadius: 20, padding: '32px 32px',
          boxShadow: '0 1px 4px rgba(0,0,0,.07)', border: '1px solid #f0f0f0',
          display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 28,
          flexWrap: 'wrap',
        }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {user.avatar ? (
              <img src={user.avatar} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 0 0 2px #E8472A' }} />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg,#E8472A,#c73a1f)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 36, boxShadow: '0 4px 16px rgba(232,71,42,.3)' }}>
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            {user.is_host && (
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, background: '#E8472A', borderRadius: '50%', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="home" size={13} style={{ color: 'white' }} />
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 26, fontWeight: 700, margin: 0 }}>{displayName}</h1>
              {user.is_host && (
                <span style={{ background: '#fff0ed', color: '#E8472A', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid #ffd0c5' }}>
                  🏠 Host
                </span>
              )}
            </div>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>@{user.username} · Member since {memberSince}</p>
            {user.bio && <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65, maxWidth: 480 }}>{user.bio}</p>}
            <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
              {user.phone && (
                <span style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="users" size={13} /> {user.phone}
                </span>
              )}
              <span style={{ fontSize: 13, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="user" size={13} /> {user.email}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
            {user.is_host && (
              <Link to="/host/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#E8472A', color: 'white', borderRadius: 9, fontWeight: 600, fontSize: 13 }}>
                <Icon name="chart" size={14} /> Dashboard
              </Link>
            )}
            <Link to="/trips" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', border: '1.5px solid #e8e8e8', color: '#1a1a1a', borderRadius: 9, fontWeight: 600, fontSize: 13 }}>
              <Icon name="calendar" size={14} /> Trips
            </Link>
          </div>
        </div>

        {/* ── Stats ── */}
        {!loading && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard icon="calendar" label="Total trips"    value={stats.total_trips}     color="#7c3aed" to="/trips" />
            <StatCard icon="check"    label="Upcoming stays" value={stats.upcoming_trips}  color="#059669" to="/trips" />
            <StatCard icon="star"     label="Reviews written" value={stats.total_reviews}  color="#d97706" />
            <StatCard icon="heart"    label="Saved places"   value={null}                  color="#E8472A" to="/saved" />
            {user.is_host && <>
              <StatCard icon="home"   label="Active listings"  value={stats.active_listings}  color="#E8472A"  to="/host/dashboard" />
              <StatCard icon="users"  label="Guest bookings"   value={stats.host_bookings}     color="#2563eb" to="/host/dashboard" />
              <StatCard icon="cash"   label="Total revenue"    value={stats.total_revenue != null ? formatPrice(stats.total_revenue) : '—'} color="#059669" />
              {stats.average_rating != null && (
                <StatCard icon="award" label="Host rating" value={`${stats.average_rating} ★`} color="#E8472A" />
              )}
            </>}
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e8e8e8', marginBottom: 24 }}>
          {['profile', 'security'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '9px 20px', border: 'none', background: 'none',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              textTransform: 'capitalize',
              color: tab === t ? '#E8472A' : '#888',
              borderBottom: `2px solid ${tab === t ? '#E8472A' : 'transparent'}`,
              transition: 'all .15s',
            }}>
              {t === 'profile' ? '👤 Profile' : '🔒 Security'}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {tab === 'profile' && (
          <Section title="Edit your profile">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <Field label="First name">
                <input style={inputStyle} value={form.first_name} onChange={set('first_name')} placeholder="Jane"
                  onFocus={e => e.target.style.borderColor = '#E8472A'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </Field>
              <Field label="Last name">
                <input style={inputStyle} value={form.last_name} onChange={set('last_name')} placeholder="Smith"
                  onFocus={e => e.target.style.borderColor = '#E8472A'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </Field>
              <Field label="Username">
                <input style={inputStyle} value={form.username} onChange={set('username')} placeholder="janesmith"
                  onFocus={e => e.target.style.borderColor = '#E8472A'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </Field>
              <Field label="Phone">
                <input style={inputStyle} value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" type="tel"
                  onFocus={e => e.target.style.borderColor = '#E8472A'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </Field>
            </div>

            <Field label="Avatar URL">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input style={{ ...inputStyle, flex: 1 }} value={form.avatar} onChange={set('avatar')} placeholder="https://example.com/photo.jpg"
                  onFocus={e => e.target.style.borderColor = '#E8472A'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
                {form.avatar && (
                  <img src={form.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #e8e8e8', flexShrink: 0 }}
                    onError={e => { e.target.style.display = 'none'; }} />
                )}
              </div>
            </Field>

            <div style={{ marginTop: 16 }}>
              <Field label="Bio">
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
                  value={form.bio} onChange={set('bio')}
                  placeholder="Tell the community a little about yourself..."
                  onFocus={e => e.target.style.borderColor = '#E8472A'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </Field>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '11px 28px', background: '#E8472A', color: 'white',
                border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                opacity: saving ? .65 : 1, transition: 'opacity .15s',
              }}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>

            {/* Read-only info */}
            <div style={{ marginTop: 24, padding: '16px 18px', background: '#fafafa', borderRadius: 10, border: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Account info (read-only)</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 12, color: '#aaa', marginBottom: 2 }}>Email</p>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{user.email}</p>
                </div>
                <div>
                  <p style={{ fontSize: 12, color: '#aaa', marginBottom: 2 }}>Member since</p>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>{memberSince}</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#aaa', marginTop: 8 }}>To change your email, contact support.</p>
            </div>
          </Section>
        )}

        {/* ── Security tab ── */}
        {tab === 'security' && (
          <Section title="Change password">
            <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Current password">
                <input type="password" style={inputStyle} value={pwForm.old_password} onChange={setPw('old_password')} placeholder="••••••••"
                  onFocus={e => e.target.style.borderColor = '#E8472A'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </Field>
              <Field label="New password">
                <input type="password" style={inputStyle} value={pwForm.new_password} onChange={setPw('new_password')} placeholder="Min 8 characters"
                  onFocus={e => e.target.style.borderColor = '#E8472A'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </Field>
              <Field label="Confirm new password">
                <input type="password" style={inputStyle} value={pwForm.confirm} onChange={setPw('confirm')} placeholder="••••••••"
                  onFocus={e => e.target.style.borderColor = '#E8472A'}
                  onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
              </Field>

              {/* Strength indicator */}
              {pwForm.new_password && (
                <div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => {
                      const strength = getStrength(pwForm.new_password);
                      const filled = i <= strength;
                      const color = strength <= 1 ? '#dc2626' : strength === 2 ? '#d97706' : strength === 3 ? '#2563eb' : '#059669';
                      return <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: filled ? color : '#e8e8e8', transition: 'background .2s' }} />;
                    })}
                  </div>
                  <p style={{ fontSize: 12, color: '#888' }}>
                    {['', 'Weak', 'Fair', 'Good', 'Strong'][getStrength(pwForm.new_password)]} password
                  </p>
                </div>
              )}

              {pwError && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, fontSize: 13, color: '#dc2626', border: '1px solid #fecaca' }}>
                  {pwError}
                </div>
              )}

              <button onClick={handlePasswordChange} disabled={pwSaving || !pwForm.old_password || !pwForm.new_password} style={{
                padding: '11px 24px', background: '#1a1a2e', color: 'white',
                border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14,
                cursor: pwSaving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                alignSelf: 'flex-start', marginTop: 4,
                opacity: (pwSaving || !pwForm.old_password || !pwForm.new_password) ? .5 : 1,
              }}>
                {pwSaving ? 'Changing...' : 'Change password'}
              </button>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
