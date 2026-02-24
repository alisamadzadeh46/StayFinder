import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Modal, Input, Btn } from './UI';

export default function AuthModal({ mode: initMode, onClose, onSuccess }) {
  const [mode, setMode] = useState(initMode || 'login');
  const [form, setForm] = useState({ email: '', password: '', password2: '', username: '', first_name: '', last_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login(form.email, form.password);
      } else {
        user = await register(form);
      }
      onSuccess?.(user);
      onClose();
    } catch (e) {
      const msg = e?.detail || e?.non_field_errors?.[0] || e?.email?.[0] || 'Something went wrong.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose} title={mode === 'login' ? 'Welcome back' : 'Create your account'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'register' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="First name" value={form.first_name} onChange={set('first_name')} placeholder="Jane" />
            <Input label="Last name" value={form.last_name} onChange={set('last_name')} placeholder="Smith" />
          </div>
        )}
        {mode === 'register' && (
          <Input label="Username" value={form.username} onChange={set('username')} placeholder="janesmith" />
        )}
        <Input label="Email address" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••" />
        {mode === 'register' && (
          <Input label="Confirm password" type="password" value={form.password2} onChange={set('password2')} placeholder="••••••••" />
        )}

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
            {error}
          </div>
        )}

        <Btn full onClick={handleSubmit} disabled={loading} size="lg" style={{ marginTop: 4 }}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
        </Btn>

        <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-light)' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', color: 'var(--text)', textDecoration: 'underline', fontFamily: 'inherit' }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </Modal>
  );
}
