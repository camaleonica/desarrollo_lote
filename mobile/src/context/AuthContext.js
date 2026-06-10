import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, clearSession } from '../services/api';
import { getProfile, fetchPaymentMethods, logout } from '../services/loteApi';
import { ApiError } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [registerDraft, setRegisterDraft] = useState({});
  const [pendingPaymentSetup, setPendingPaymentSetup] = useState(false);
  const [initialAppRoute, setInitialAppRoute] = useState(null);
  const [authEntryRoute, setAuthEntryRoute] = useState('Login');

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
    setIsGuest(false);
    setUser(normalizedProfile);
    return normalizedProfile;
  }, []);

  const canAccessApp = Boolean(user?.id) && !pendingPaymentSetup;
  const canBrowseApp = canAccessApp || isGuest;

  const enterAsGuest = useCallback(async () => {
    await clearSession();
    setIsGuest(true);
    setUser(null);
    setPendingPaymentSetup(false);
    setRegisterDraft({});
  }, []);

  const exitGuest = useCallback(() => {
    setIsGuest(false);
  }, []);

  const openAuthEntry = useCallback((route = 'Login') => {
    setAuthEntryRoute(route);
    setIsGuest(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      loading,
      isGuest,
      canAccessApp,
      canBrowseApp,
      enterAsGuest,
      exitGuest,
      openAuthEntry,
      authEntryRoute,
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
        setIsGuest(false);
        setRegisterDraft({});
        setPendingPaymentSetup(false);
        setInitialAppRoute(null);
        setAuthEntryRoute('Login');
      },
    }),
    [
      user,
      loading,
      isGuest,
      canAccessApp,
      canBrowseApp,
      registerDraft,
      pendingPaymentSetup,
      initialAppRoute,
      authEntryRoute,
      completeRegistration,
      enterAsGuest,
      exitGuest,
      openAuthEntry,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
