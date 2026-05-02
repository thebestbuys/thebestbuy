import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import App from './App.jsx';
import MobileApp from './mobile/MobileApp.jsx';
import './styles.css';

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

  useEffect(() => {
    if (getOverride() || Capacitor.isNativePlatform()) return;
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setView(mq.matches ? 'mobile' : 'web');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return view === 'mobile' ? <MobileApp /> : <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
