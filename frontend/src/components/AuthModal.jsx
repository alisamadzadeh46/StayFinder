import { useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Modal, Input, Btn } from './UI';

export default function AuthModal({ mode: initMode, onClose, onSuccess }) {
  const [mode, setMode]       = useState(initMode || 'login');
  const [form, setForm]       = useState({ email: '', password: '', password2: '', username: '', first_name: '', last_name: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register }   = useAuth();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Validate client-side before hitting API
  const validate = () => {
    if (!form.email.includes('@')) return 'Enter a valid email address.';
    if (form.password.length < 8)  return 'Password must be at least 8 characters.';
    if (mode === 'register' && form.password !== form.password2) return 'Passwords do not match.';
    return null;
  };

  // useCallback prevents re-creating on every render — fixes duplicate submit bug
  const handleSubmit = useCallback(async () => {
    if (loading) return;   // guard against double-click
    const validErr = validate();
    if (validErr) { setError(validErr); return; }

    setError('');
    setLoading(true);
    try {
      const user = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form);
      onSuccess?.(user);
      onClose();
    } catch (e) {
      const msg =
        e?.detail ||
        e?.non_field_errors?.[0] ||
        e?.email?.[0] ||
        e?.password?.[0] ||
        e?.username?.[0] ||
        'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [loading, form, mode]);

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <Modal onClose={onClose} title={mode === 'login' ? 'Welcome back' : 'Create your account'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {mode === 'register' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="First name" value={form.first_name} onChange={set('first_name')} placeholder="Jane" />
              <Input label="Last name"  value={form.last_name}  onChange={set('last_name')}  placeholder="Smith" />
            </div>
            <Input label="Username" value={form.username} onChange={set('username')} placeholder="janesmith (optional)" />
          </>
        )}

        <Input label="Email address" type="email"    value={form.email}    onChange={set('email')}    placeholder="you@example.com" />
        <Input label="Password"      type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" />

        {mode === 'register' && (
          <Input label="Confirm password" type="password" value={form.password2} onChange={set('password2')} placeholder="••••••••" />
        )}

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, fontSize: 13, color: '#dc2626', border: '1px solid #fecaca' }}>
            {error}
          </div>
        )}

        <Btn full onClick={handleSubmit} disabled={loading} size="lg" style={{ marginTop: 4 }}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
        </Btn>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#888' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={switchMode}
            style={{ background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', color: '#1a1a1a', textDecoration: 'underline', fontFamily: 'inherit', fontSize: 14 }}
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </Modal>
  );
}
