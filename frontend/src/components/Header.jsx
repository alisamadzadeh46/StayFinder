import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icon } from './UI';

export default function Header({ onAuthOpen, searchValue, onSearchChange }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); setMenuOpen(false); navigate('/'); };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 200, background: 'white',
      borderBottom: '1px solid var(--border)',
      height: 'var(--header-h)',
    }}>
      <div style={{
        maxWidth: 1440, margin: '0 auto', padding: '0 24px',
        height: '100%', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <svg viewBox="0 0 32 32" width="30" height="30" fill="var(--primary)">
            <path d="M16 1C7.716 1 1 7.716 1 16s6.716 15 15 15 15-6.716 15-15S24.284 1 16 1zm0 4.5c1.38 0 2.5 1.12 2.5 2.5S17.38 10.5 16 10.5 13.5 9.38 13.5 8 14.62 5.5 16 5.5zm5.25 17.5h-10.5c-.69 0-1.25-.56-1.25-1.25v-.5c0-.69.56-1.25 1.25-1.25h.75v-6h-.75c-.69 0-1.25-.56-1.25-1.25v-.5c0-.69.56-1.25 1.25-1.25h7c.69 0 1.25.56 1.25 1.25v7.75h.75c.69 0 1.25.56 1.25 1.25v.5c0 .69-.56 1.25-1.25 1.25z"/>
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>
            StayFinder
          </span>
        </Link>

        {/* Search */}
        <div style={{
          flex: 1, maxWidth: 560,
          display: 'flex', alignItems: 'center',
          border: '1.5px solid var(--border)', borderRadius: 40,
          overflow: 'hidden', transition: 'box-shadow .2s, border-color .2s',
        }}
          onFocus={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(232,71,42,.12)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onBlur={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <input
            style={{ flex: 1, padding: '10px 18px', border: 'none', outline: 'none', fontSize: 14, background: 'transparent' }}
            placeholder="Search destinations, cities..."
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
          />
          <button style={{
            padding: '9px 14px', background: 'var(--primary)', border: 'none',
            color: 'white', display: 'flex', alignItems: 'center', cursor: 'pointer',
            borderRadius: '0 40px 40px 0',
          }}>
            <Icon name="search" size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>
          {user?.is_host && (
            <Link to="/host/dashboard" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              fontSize: 13, fontWeight: 600, color: 'var(--text)',
              background: 'var(--bg)',
            }}>
              <Icon name="chart" size={15} /> Dashboard
            </Link>
          )}

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(m => !m)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 14px', border: '1.5px solid var(--border)',
                  borderRadius: 40, background: 'white', cursor: 'pointer',
                }}
              >
                <Icon name="menu" size={16} />
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>
                  {user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
              </button>

              {menuOpen && (
                <>
                  <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    background: 'white', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
                    padding: '8px', minWidth: 200, zIndex: 20,
                  }}>
                    <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                      <p style={{ fontWeight: 700, fontSize: 14 }}>{user.first_name} {user.last_name}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-light)' }}>{user.email}</p>
                    </div>
                    {[
                      { label: 'My trips', icon: 'calendar', to: '/trips' },
                      { label: 'Saved', icon: 'heart', to: '/saved' },
                      { label: 'Profile', icon: 'user', to: '/profile' },
                      ...(user.is_host ? [{ label: 'Host Dashboard', icon: 'chart', to: '/host/dashboard' }] : []),
                    ].map(item => (
                      <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, fontSize: 14, color: 'var(--text)', width: '100%' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        <Icon name={item.icon} size={16} /> {item.label}
                      </Link>
                    ))}
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '6px 0' }} />
                    <button onClick={handleLogout} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                      borderRadius: 8, fontSize: 14, color: '#dc2626',
                      background: 'none', border: 'none', cursor: 'pointer', width: '100%',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <Icon name="logout" size={16} /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <button onClick={() => onAuthOpen('login')} style={{ padding: '9px 18px', background: 'none', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: 'var(--text)' }}>
                Log in
              </button>
              <button onClick={() => onAuthOpen('register')} style={{ padding: '9px 20px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Sign up
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
