import { useState, useEffect } from 'react';

// ─── Icons ────────────────────────────────────────────────────────────────────
const paths = {
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  star: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  heart: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  user: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  map: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
  users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  wifi: "M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0",
  close: "M6 18L18 6M6 6l12 12",
  menu: "M4 6h16M4 12h16M4 18h16",
  chevronLeft: "M15 19l-7-7 7-7",
  chevronRight: "M9 5l7 7-7 7",
  plus: "M12 4v16m8-8H4",
  check: "M5 13l4 4L19 7",
  logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  filter: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z",
  chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  cash: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  award: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  location: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z",
  arrowLeft: "M10 19l-7-7m0 0l7-7m-7 7h18",
  arrowRight: "M14 5l7 7m0 0l-7 7m7-7H3",
  share: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
};

export const Icon = ({ name, size = 20, className = '', style = {} }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
    className={className} style={style}>
    <path d={paths[name]} />
  </svg>
);

export const StarRating = ({ rating, count, size = 14 }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: size }}>
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#E8472A" stroke="none">
      <path d={paths.star} />
    </svg>
    <span style={{ fontWeight: 600 }}>{rating ? rating.toFixed(1) : 'New'}</span>
    {count > 0 && <span style={{ color: 'var(--text-light)' }}>({count})</span>}
  </span>
);

export const Badge = ({ children, color = 'default' }) => {
  const colors = {
    default: { bg: '#f0f0f0', text: '#555' },
    green:   { bg: '#e6f9f0', text: '#15803d' },
    red:     { bg: '#fef2f2', text: '#dc2626' },
    amber:   { bg: '#fffbeb', text: '#d97706' },
    blue:    { bg: '#eff6ff', text: '#2563eb' },
    primary: { bg: '#fff0ed', text: '#E8472A' },
  };
  const c = colors[color] || colors.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      background: c.bg, color: c.text,
    }}>
      {children}
    </span>
  );
};

export const Spinner = ({ size = 24 }) => (
  <div style={{
    width: size, height: size,
    border: '2px solid #e8e8e8',
    borderTop: '2px solid #E8472A',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export const Toast = ({ message, type = 'success', onClose }) => (
  <div className={`toast toast-${type}`}>
    <span>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}>
      <Icon name="close" size={16} />
    </button>
    <style>{`
      .toast {
        position: fixed; bottom: 28px; right: 28px;
        display: flex; align-items: center; gap: 12px;
        padding: 14px 20px; border-radius: 8px;
        font-size: 14px; font-weight: 500; font-family: inherit;
        z-index: 9999; box-shadow: 0 12px 40px rgba(0,0,0,.14);
        animation: slideInToast .3s ease; max-width: 380px;
      }
      .toast-success { background: #1a1a1a; color: white; }
      .toast-error   { background: #dc2626; color: white; }
      .toast-info    { background: #2563eb; color: white; }
      @keyframes slideInToast {
        from { transform: translateX(110%); opacity: 0; }
        to   { transform: translateX(0);   opacity: 1; }
      }
    `}</style>
  </div>
);

export const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const ToastEl = toast
    ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
    : null;
  return { show, ToastEl };
};

export const Modal = ({ children, onClose, title, width = 520 }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', h);
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, backdropFilter: 'blur(3px)', zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px',
          width: '100%', maxWidth: width, maxHeight: '92vh',
          overflow: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          animation: 'modalIn .25s ease',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #e8e8e8',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', borderRadius: '50%', color: '#1a1a1a',
            }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { transform: scale(.95) translateY(10px); opacity: 0; }
          to   { transform: none; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export const Btn = ({
  children, variant = 'primary', size = 'md', full = false,
  onClick, disabled, type = 'button', style: extraStyle = {}
}) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, border: 'none', borderRadius: '8px',
    fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all .15s', fontFamily: 'inherit',
    width: full ? '100%' : 'auto', opacity: disabled ? 0.55 : 1,
    ...(size === 'sm' ? { padding: '7px 14px',  fontSize: 13 } :
        size === 'lg' ? { padding: '14px 28px', fontSize: 16 } :
                        { padding: '10px 20px', fontSize: 14 }),
  };
  const variants = {
    primary: { background: '#E8472A', color: 'white' },
    outline: { background: 'white',   color: '#1a1a1a', border: '1.5px solid #d0d0d0' },
    ghost:   { background: 'transparent', color: '#1a1a1a' },
    dark:    { background: '#1a1a2e', color: 'white' },
    danger:  { background: '#dc2626', color: 'white' },
  };
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...extraStyle }}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, error, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && (
      <label style={{ fontSize: 13, fontWeight: 600, color: '#444' }}>
        {label}
      </label>
    )}
    <input
      style={{
        padding: '11px 14px',
        border: `1.5px solid ${error ? '#dc2626' : '#e8e8e8'}`,
        borderRadius: '8px', fontSize: 14, outline: 'none',
        transition: 'border-color .15s', background: 'white',
        fontFamily: 'inherit',
      }}
      onFocus={e  => { if (!error) e.target.style.borderColor = '#E8472A'; }}
      onBlur={e   => { if (!error) e.target.style.borderColor = '#e8e8e8'; }}
      {...props}
    />
    {error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
  </div>
);
