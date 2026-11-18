'use client';
import {
  createContext, useContext, useState,
  useEffect, useRef, ReactNode,
} from 'react';
import API, { googleAuthAPI, facebookAuthAPI } from '@/lib/api';

interface User {
  id: string; name: string; email?: string; phone?: string;
  avatar?: string; role: string; provider: string;
}

interface AuthCtx {
  user:     User | null;
  token:    string | null;
  loading:  boolean;
  login:    (email: string | null, phone: string | null, password: string) => Promise<string | null>;
  register: (name: string, email: string | null, phone: string | null, password: string) => Promise<string | null>;
  loginWithGoogle:   (idToken: string) => Promise<string | null>;
  loginWithFacebook: (accessToken: string, userId: string) => Promise<string | null>;
  logout:   () => void;
  isAdmin:  boolean;
  setOnLoginSuccess: (fn: (token: string) => void) => void;
  /** Re-read the profile from the server (e.g. after adding a phone). */
  refreshUser: () => Promise<void>;
  /** Save a phone number on the account; returns an error message or null. */
  updatePhone: (phone: string) => Promise<string | null>;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const onLoginRef = useRef<((t: string) => void) | null>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem('el_token');
      const u = localStorage.getItem('el_user');
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
        API.defaults.headers.common['Authorization'] = `Bearer ${t}`;
        // Sign out if the saved token no longer matches an account (e.g. deleted).
        // Network errors / server waking up keep the session.
        API.get('/users/profile', { headers: { Authorization: `Bearer ${t}` } })
          .catch(e => {
            const s = e?.response?.status;
            if ((s === 401 || s === 404) && localStorage.getItem('el_token') === t) logout();
          });
      }
    } catch {}
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSession = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem('el_token', token);
    localStorage.setItem('el_user', JSON.stringify(user));
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Notify cart/wishlist
    if (onLoginRef.current) onLoginRef.current(token);
  };

  const parseUser = (d: any): User => ({
    id:       d.user?.id  || d.user?._id,
    name:     d.user?.name,
    email:    d.user?.email,
    phone:    d.user?.phone,
    avatar:   d.user?.avatar,
    role:     d.user?.role,
    provider: d.user?.provider,
  });

  const login = async (email: string | null, phone: string | null, password: string) => {
    try {
      const { data } = await API.post('/users/login', {
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        password,
      });
      if (data.token) { saveSession(data.token, parseUser(data)); return null; }
      return data.message || 'Erreur';
    } catch (e: any) {
      return e?.response?.data?.message || 'Erreur de connexion';
    }
  };

  const register = async (name: string, email: string | null, phone: string | null, password: string) => {
    try {
      const { data } = await API.post('/users/register', {
        name,
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        password,
      });
      if (data.token) { saveSession(data.token, parseUser(data)); return null; }
      return data.message || 'Erreur';
    } catch (e: any) {
      return e?.response?.data?.message || 'Erreur inscription';
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const data = await googleAuthAPI(idToken);
      if (data.token) { saveSession(data.token, parseUser(data)); return null; }
      return data.message || 'Erreur Google';
    } catch (e: any) {
      return e?.response?.data?.message || 'Erreur Google';
    }
  };

  const loginWithFacebook = async (accessToken: string, userId: string) => {
    try {
      const data = await facebookAuthAPI(accessToken, userId);
      if (data.token) { saveSession(data.token, parseUser(data)); return null; }
      return data.message || 'Erreur Facebook';
    } catch (e: any) {
      return e?.response?.data?.message || 'Erreur Facebook';
    }
  };

  const applyProfile = (d: any) => {
    if (!token || !user || !d) return;
    const next: User = { ...user, name: d.name ?? user.name, email: d.email ?? user.email,
      phone: d.phone || undefined, avatar: d.avatar ?? user.avatar, role: d.role ?? user.role };
    setUser(next);
    localStorage.setItem('el_user', JSON.stringify(next));
  };

  const refreshUser = async () => {
    if (!token) return;
    try { const { data } = await API.get('/users/profile', { headers: { Authorization: `Bearer ${token}` } }); applyProfile(data); }
    catch {}
  };

  const updatePhone = async (phone: string) => {
    if (!token) return 'Session expirée';
    try {
      const { data } = await API.put('/users/profile', { phone }, { headers: { Authorization: `Bearer ${token}` } });
      applyProfile(data);
      return null;
    } catch (e: any) {
      return e?.response?.data?.message || 'Erreur';
    }
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('el_token');
    localStorage.removeItem('el_user');
    localStorage.removeItem('el_cart');
    localStorage.removeItem('el_wishlist');
    delete API.defaults.headers.common['Authorization'];
  };

  return (
    <Ctx.Provider value={{
      user, token, loading,
      login, register, loginWithGoogle, loginWithFacebook,
      logout, isAdmin: user?.role === 'admin',
      setOnLoginSuccess: (fn) => { onLoginRef.current = fn; },
      refreshUser, updatePhone,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);