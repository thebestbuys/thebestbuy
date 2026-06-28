import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { supabase, isSupabaseConfigured } from './supabase.js';
import { setCloudSession, cloudUpsertProfileIdentity } from './cloud.js';
import { linkAndSync, pullOnly } from './cloudSync.js';

const STORAGE_KEY = 'bb_auth_user';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const IS_NATIVE = Capacitor.isNativePlatform();

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function loadGisScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.id) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector(`script[src="${GIS_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

const AuthContext = createContext({
  user: null,
  ready: false,
  cloudReady: false,
  clientId: '',
  isNative: false,
  lastError: null,
  signInNative: async () => {},
  signOut: async () => {},
  renderButton: () => {},
  promptSignIn: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);
  // Reactive mirror of cloud.js's session: true once a Supabase session exists.
  // `user` is restored synchronously from localStorage, but the Supabase session
  // is set asynchronously after getSession() — consumers that need the cloud
  // (e.g. circle_trending) must wait for this rather than for `user`.
  const [cloudReady, setCloudReady] = useState(false);
  const [lastError, setLastError] = useState(null);
  const initializedRef = useRef(false);

  // Single place to set both the module-level session and the reactive flag.
  const applyCloudSession = useCallback((sess) => {
    setCloudSession(sess);
    setCloudReady(Boolean(sess));
  }, []);

  const handleCredential = useCallback((response) => {
    const payload = decodeJwt(response?.credential);
    if (!payload) return;
    const u = {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      given_name: payload.given_name,
      family_name: payload.family_name,
    };
    setUser(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {}
    // Exchange the Google ID token for a verified Supabase session, then merge
    // local data up and pull the account's data down. Best-effort: if cloud
    // isn't configured or fails, the app keeps working on localStorage.
    if (isSupabaseConfigured && response?.credential) {
      (async () => {
        try {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential,
          });
          if (error) {
            console.error('[auth] supabase sign-in failed', error);
            return;
          }
          applyCloudSession(data.session);
          await cloudUpsertProfileIdentity({
            displayName: u.name,
            avatarUrl: u.picture,
            email: u.email,
          }).catch(() => {});
          await linkAndSync(u.sub);
        } catch (e) {
          console.error('[auth] cloud sync failed', e);
        }
      })();
    }
  }, []);

  // Restore an existing Supabase session on load and pull the account's data.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {}
    const storedSub = storedUser?.sub || null;
    supabase.auth.getSession().then(({ data }) => {
      if (!active || !data?.session) return;
      applyCloudSession(data.session);
      // Refresh the public identity on every session restore, so users who were
      // already signed in before profiles existed become discoverable.
      if (storedUser) {
        cloudUpsertProfileIdentity({
          displayName: storedUser.name,
          avatarUrl: storedUser.picture,
          email: storedUser.email,
        }).catch(() => {});
      }
      pullOnly(storedSub).catch(() => {});
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => {
      applyCloudSession(sess);
    });
    return () => {
      active = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  // Re-pull the account's data whenever the app comes back to the foreground, so
  // a deletion made on another device propagates here without a full restart.
  // The server is authoritative; pullOnly only overwrites the local cache (never
  // pushes), so this can't resurrect anything. Throttled to avoid spamming.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let lastPull = 0;
    const maybePull = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastPull < 30000) return;
      lastPull = now;
      let sub = null;
      try {
        sub = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')?.sub || null;
      } catch {}
      pullOnly(sub).catch(() => {});
    };
    document.addEventListener('visibilitychange', maybePull);
    window.addEventListener('focus', maybePull);
    return () => {
      document.removeEventListener('visibilitychange', maybePull);
      window.removeEventListener('focus', maybePull);
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!CLIENT_ID) {
      console.warn(
        '[auth] VITE_GOOGLE_CLIENT_ID is not set. Google sign-in is disabled.',
      );
      return;
    }
    if (IS_NATIVE) {
      (async () => {
        try {
          await SocialLogin.initialize({ google: { webClientId: CLIENT_ID } });
          initializedRef.current = true;
        } catch (e) {
          console.error('[auth] native init failed', e);
          if (active) setLastError('init: ' + (e?.message || String(e)));
        }
        if (active) setReady(true);
      })();
      return () => {
        active = false;
      };
    }
    loadGisScript().then((ok) => {
      if (!active || !ok) return;
      if (!initializedRef.current && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: handleCredential,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          initializedRef.current = true;
        } catch (e) {
          console.error('[auth] init failed', e);
        }
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [handleCredential]);

  const signInNative = useCallback(async () => {
    if (!IS_NATIVE) return;
    setLastError(null);
    try {
      const res = await SocialLogin.login({
        provider: 'google',
        options: {},
      });
      const r = res?.result;
      if (!r || r.responseType !== 'online' || !r.profile) {
        setLastError('Réponse inattendue: ' + JSON.stringify(res).slice(0, 200));
        return;
      }
      const p = r.profile;
      const u = {
        sub: p.id,
        name: p.name,
        email: p.email,
        picture: p.imageUrl,
        given_name: p.givenName,
        family_name: p.familyName,
      };
      setUser(u);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      } catch {}
      // Establish the Supabase session from the native Google ID token.
      if (isSupabaseConfigured && r.idToken) {
        try {
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: r.idToken,
          });
          if (!error) {
            applyCloudSession(data.session);
            await cloudUpsertProfileIdentity({
              displayName: u.name,
              avatarUrl: u.picture,
              email: u.email,
            }).catch(() => {});
            await linkAndSync(u.sub);
          } else {
            console.error('[auth] supabase sign-in failed', error);
          }
        } catch (e) {
          console.error('[auth] cloud sync failed', e);
        }
      }
    } catch (e) {
      const msg = e?.message || e?.code || String(e);
      console.error('[auth] native sign-in failed', e);
      setLastError(msg);
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    // End the cloud session (keeps the account's server data intact).
    if (isSupabaseConfigured) {
      applyCloudSession(null);
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    if (IS_NATIVE) {
      try {
        await SocialLogin.logout({ provider: 'google' });
      } catch {}
    } else {
      try {
        window.google?.accounts?.id?.disableAutoSelect?.();
      } catch {}
    }
  }, []);

  const renderButton = useCallback((el, options = {}) => {
    if (!el || !window.google?.accounts?.id) return;
    try {
      el.innerHTML = '';
      window.google.accounts.id.renderButton(el, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left',
        ...options,
      });
    } catch (e) {
      console.error('[auth] renderButton failed', e);
    }
  }, []);

  const promptSignIn = useCallback(() => {
    try {
      window.google?.accounts?.id?.prompt?.();
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        cloudReady,
        clientId: CLIENT_ID,
        isNative: IS_NATIVE,
        lastError,
        signInNative,
        signOut,
        renderButton,
        promptSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
