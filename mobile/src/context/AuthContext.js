import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, logout as clearSession } from '../services/api';
import { getProfile } from '../services/loteApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerDraft, setRegisterDraft] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const profile = await getProfile();
          setUser(profile);
        }
      } catch {
        await clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      registerDraft,
      setRegisterDraft,
      signOut: async () => {
        await clearSession();
        setUser(null);
        setRegisterDraft({});
      },
    }),
    [user, loading, registerDraft]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
