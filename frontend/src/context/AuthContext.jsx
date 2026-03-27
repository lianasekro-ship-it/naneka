import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import api          from '../lib/api.js';

const TOKEN_KEY = 'naneka_phone_token';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for a stored phone-OTP token (customer session)
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          setUser({ id: payload.sub, phone: payload.phone, role: payload.role });
          setLoading(false);
          return; // skip Supabase session check — not needed for phone customers
        }
      } catch { /* malformed token — fall through */ }
      localStorage.removeItem(TOKEN_KEY);
    }

    // 2. Check for a Supabase session (admin / staff email login)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Only update if no phone token is active
      if (!localStorage.getItem(TOKEN_KEY)) {
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  /** Step 1 — ask backend to generate OTP and deliver it via Beem */
  async function sendOtp(phone) {
    const { data } = await api.post('/api/v1/auth/send-otp', { phone });
    return data;
  }

  /** Step 2 — verify OTP on backend; backend returns a signed JWT */
  async function verifyOtp(phone, code) {
    const { data } = await api.post('/api/v1/auth/verify-otp', { phone, code });
    localStorage.setItem(TOKEN_KEY, data.access_token);
    setUser({ id: data.user.id, phone: data.user.phone, role: data.user.role });
  }

  async function signOut() {
    localStorage.removeItem(TOKEN_KEY);
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, sendOtp, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
