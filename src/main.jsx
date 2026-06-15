import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App.jsx';
import MobileApp from './mobile/MobileApp.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { LanguageProvider } from './lib/i18n.jsx';
import ThemeEditor from './components/ThemeEditor.jsx';
import { applyStoredTheme } from './lib/theme.js';
import './styles.css';

// Apply any saved "charte graphique" overrides before first paint (no flash).
applyStoredTheme();

const MOBILE_BREAKPOINT = 768;

function getOverride() {
  const v = new URLSearchParams(window.location.search).get('view');
  return v === 'mobile' || v === 'web' ? v : null;
}

function pickInitial() {
  const override = getOverride();
  if (override) return override;
  if (Capacitor.isNativePlatform()) return 'mobile';
  return window.innerWidth < MOBILE_BREAKPOINT ? 'mobile' : 'web';
}

function Root() {
  const [view, setView] = useState(pickInitial);
  const [themeOpen, setThemeOpen] = useState(false);

  useEffect(() => {
    if (getOverride() || Capacitor.isNativePlatform()) return;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setView(mq.matches ? 'mobile' : 'web');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Toggle the live charte-graphique editor with Alt+Shift+T.
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && e.shiftKey && (e.key === 'T' || e.key === 't' || e.code === 'KeyT')) {
        e.preventDefault();
        setThemeOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {view === 'mobile' ? <MobileApp /> : <App />}
      <ThemeEditor open={themeOpen} onClose={() => setThemeOpen(false)} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
