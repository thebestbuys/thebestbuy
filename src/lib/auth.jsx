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
  const [lastError, setLastError] = useState(null);
  const initializedRef = useRef(false);

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
