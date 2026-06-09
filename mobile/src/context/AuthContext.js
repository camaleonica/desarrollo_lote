import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, logout as clearSession } from '../services/api';
import { getProfile, fetchPaymentMethods, logout } from '../services/loteApi';
import { ApiError } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registerDraft, setRegisterDraft] = useState({});
  const [pendingPaymentSetup, setPendingPaymentSetup] = useState(false);
  const [initialAppRoute, setInitialAppRoute] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const profile = await getProfile();
        const methods = await fetchPaymentMethods();

        if (methods.length === 0) {
          setPendingPaymentSetup(true);
          return;
        }

        setPendingPaymentSetup(false);
        setUser(profile);
      } catch {
        await clearSession();
        setPendingPaymentSetup(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completeRegistration = useCallback(async () => {
    const profile = await getProfile();
    const userId = profile?.id != null ? Number(profile.id) : null;

    if (!userId) {
      throw new ApiError('No se pudo cargar tu perfil. Intentá de nuevo.');
    }

    const normalizedProfile = { ...profile, id: userId };

    setPendingPaymentSetup(false);
    setRegisterDraft({});
    setUser(normalizedProfile);
    return normalizedProfile;
  }, []);

  const canAccessApp = Boolean(user?.id) && !pendingPaymentSetup;

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      canAccessApp,
      registerDraft,
      setRegisterDraft,
      pendingPaymentSetup,
      setPendingPaymentSetup,
      completeRegistration,
      initialAppRoute,
      setInitialAppRoute,
      signOut: async () => {
        await logout();
        setUser(null);
        setRegisterDraft({});
        setPendingPaymentSetup(false);
        setInitialAppRoute(null);
      },
    }),
    [user, loading, canAccessApp, registerDraft, pendingPaymentSetup, initialAppRoute, completeRegistration]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
