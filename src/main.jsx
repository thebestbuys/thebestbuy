import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { LanguageProvider } from './lib/i18n.jsx';
import ThemeEditor from './components/ThemeEditor.jsx';
import Toaster from './components/Toaster.jsx';
import { applyStoredTheme, getMode } from './lib/theme.js';
import './styles.css';

// Apply any saved "charte graphique" overrides before first paint (no flash).
applyStoredTheme();

// Single responsive UI for every viewport (desktop / tablet / phone) and the
// native Capacitor build. App.jsx adapts its layout via CSS + a `useIsNarrow`
// hook; the old self-contained MobileApp.jsx was retired.
function Root() {
  const [themeOpen, setThemeOpen] = useState(false);

  // Re-apply the theme when the OS scheme changes, while preference is "system".
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getMode() === 'system') applyStoredTheme();
    };
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
      <App />
      <ThemeEditor open={themeOpen} onClose={() => setThemeOpen(false)} />
      <Toaster />
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
