import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(false); // false by default — don't block

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return; // no token → skip, show app immediately
    setLoading(true);
    apiFetch('/auth/profile/')
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    // JWT endpoint returns {access, refresh} directly
    const access  = data.access  || data.tokens?.access;
    const refresh = data.refresh || data.tokens?.refresh;
    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);
    const profile = await apiFetch('/auth/profile/');
    setUser(profile);
    return profile;
  };

  const register = async (form) => {
    const data = await apiFetch('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    const access  = data.tokens?.access  || data.access;
    const refresh = data.tokens?.refresh || data.refresh;
    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);
    const user = data.user || data;
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const updateUser = (updated) => setUser(updated);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
