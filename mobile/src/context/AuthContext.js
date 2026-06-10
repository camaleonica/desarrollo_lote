import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { getToken, clearSession } from '../services/api';
import { getProfile, fetchPaymentMethods, logout } from '../services/loteApi';
import { ApiError } from '../services/api';

const AuthContext = createContext(null);

const PROFILE_POLL_MS = 15000;

function normalizeProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    id: profile.id != null ? Number(profile.id) : profile.id,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [registerDraft, setRegisterDraft] = useState({});
  const [pendingPaymentSetup, setPendingPaymentSetup] = useState(false);
  const [initialAppRoute, setInitialAppRoute] = useState(null);
  const [authEntryRoute, setAuthEntryRoute] = useState('Login');
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const profile = await getProfile();
        const methods = await fetchPaymentMethods();

        if (methods.length === 0) {
          setPendingPaymentSetup(true);
          setUser(normalizeProfile(profile));
          return;
        }

        setPendingPaymentSetup(false);
        setUser(normalizeProfile(profile));
      } catch {
        await clearSession();
        setPendingPaymentSetup(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await getToken();
    if (!token) return null;

    try {
      const profile = normalizeProfile(await getProfile());
      setUser(profile);
      return profile;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && userRef.current?.id) {
        refreshUser();
      }
    });
    return () => sub.remove();
  }, [refreshUser]);

  useEffect(() => {
    if (isGuest || !user?.id) {
      return undefined;
    }

    const timer = setInterval(() => {
      refreshUser();
    }, PROFILE_POLL_MS);

    return () => clearInterval(timer);
  }, [isGuest, user?.id, refreshUser]);

  const completeRegistration = useCallback(async () => {
    const profile = normalizeProfile(await getProfile());
    const userId = profile?.id;

    if (!userId) {
      throw new ApiError('No se pudo cargar tu perfil. Intentá de nuevo.');
    }

    setPendingPaymentSetup(false);
    setRegisterDraft({});
    setIsGuest(false);
    setUser(profile);
    return profile;
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
      refreshUser,
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
      refreshUser,
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
