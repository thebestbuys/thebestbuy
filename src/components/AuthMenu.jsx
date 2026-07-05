import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { listSelections } from '../lib/selections.js';
import { isSuperuserEmail } from '../lib/cloud.js';
import { getMode, setMode as setThemeMode } from '../lib/theme.js';
import { requestsLeft } from '../lib/usage.js';
import LangToggle from './LangToggle.jsx';

const APPEARANCE_MODES = ['system', 'light', 'dark'];

function AppearanceToggle() {
  const { t } = useI18n();
  const [mode, setMode] = useState(getMode);
  const change = (m) => {
    setThemeMode(m);
    setMode(m);
  };
  return (
    <div className="auth-appearance">
      <span className="auth-appearance-label">{t('appearance.label')}</span>
      <div className="auth-seg" role="radiogroup" aria-label={t('appearance.label')}>
        {APPEARANCE_MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            className={'auth-seg-btn' + (mode === m ? ' is-active' : '')}
            onClick={() => change(m)}
          >
            {t('appearance.' + m)}
          </button>
        ))}
      </div>
    </div>
  );
}

// Discreet "AI requests left today" line, mirrored from the server's per-account
// quota (see lib/usage.js). Hidden when no snapshot exists yet (e.g. quota
// disabled server-side, or no request made today).
function QuotaLine() {
  const { t } = useI18n();
  const left = requestsLeft();
  if (left == null) return null;
  return (
    <div className="auth-appearance auth-quota-line">
      <span className="auth-appearance-label">{t('auth.aiQuota', { left })}</span>
    </div>
  );
}

function initials(name = '', email = '') {
  const src = (name || email || '').trim();
  if (!src) return '?';
  const parts = src.split(/[\s._@-]+/).filter(Boolean);
  const first = parts[0]?.[0] || '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + second).toUpperCase() || src[0].toUpperCase();
}

function Avatar({ user, size = 32 }) {
  const [broken, setBroken] = useState(false);
  if (user?.picture && !broken) {
    return (
      <img
        src={user.picture}
        alt={user?.name || 'avatar'}
        className="auth-avatar-img"
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span
      className="auth-avatar-fallback"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(user?.name, user?.email)}
    </span>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function LoginModal({ onClose }) {
  const { ready, clientId, renderButton, isNative, signInNative, lastError } = useAuth();
  const { t } = useI18n();
  const btnRef = useRef(null);

  useEffect(() => {
    // Web only: render the official Google Identity button. On native there is
    // no GIS script, so we render our own button that calls signInNative().
    if (!isNative && ready && btnRef.current) {
      renderButton(btnRef.current, { width: 280 });
    }
  }, [isNative, ready, renderButton]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="auth-modal-bg" onClick={onClose}>
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="auth-modal-close"
          onClick={onClose}
          aria-label={t('auth.close')}
        >
          ✕
        </button>
        <h2 id="auth-modal-title" className="auth-modal-title">
          {t('auth.welcome')}
        </h2>
        <p className="auth-modal-sub">{t('auth.sub')}</p>

        {!clientId ? (
          <div className="auth-modal-error">
            {t('auth.notConfigured')}
            <br />
            <span className="auth-modal-error-code">VITE_GOOGLE_CLIENT_ID</span>{' '}
            {t('auth.missing')} <code>.env</code>.
          </div>
        ) : !ready ? (
          <div className="auth-modal-loading">{t('auth.loading')}</div>
        ) : isNative ? (
          <button type="button" className="auth-google-btn" onClick={() => signInNative()}>
            <GoogleGlyph />
            {t('auth.signInGoogle')}
          </button>
        ) : (
          <div className="auth-modal-google" ref={btnRef} />
        )}

        {lastError && <div className="auth-modal-error">{lastError}</div>}

        <div className="auth-modal-foot">
          {t('auth.terms').split(/(\{terms\}|\{privacy\})/).map((p, i) => {
            if (p === '{terms}') return <a key={i} href="#">{t('auth.termsLink')}</a>;
            if (p === '{privacy}') return <a key={i} href="#">{t('auth.privacyLink')}</a>;
            return p;
          })}
        </div>
      </div>
    </div>
  );
}

function UserDropdown({ user, onClose, onSignOut, onOpenSelections, onOpenProfile, onOpenFriends, onOpenHistory, onOpenAsk, onOpenNotifications, onOpenTrending, onOpenAdmin }) {
  const { t } = useI18n();
  const wrapRef = useRef(null);
  const count = listSelections(user?.sub).length;
  // The left rail was retired, so the account menu is now the single home for
  // all navigation (selections / history / occasions / friends / ask / trends)
  // on every surface, plus the account actions (profile / appearance / sign out).
  const item = (label, onOpen, extra = null) => (
    <button
      type="button"
      className="auth-dropdown-item"
      onClick={() => {
        onOpen?.();
        onClose();
      }}
    >
      {label}
      {extra}
    </button>
  );
  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) onClose();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="auth-dropdown" ref={wrapRef}>
      <div className="auth-dropdown-head">
        <Avatar user={user} size={40} />
        <div className="auth-dropdown-id">
          <div className="auth-dropdown-name">{user.name || user.email}</div>
          {user.email && user.name && (
            <div className="auth-dropdown-email">{user.email}</div>
          )}
        </div>
      </div>
      <div className="auth-dropdown-sep" />
      {item(t('auth.myProfile'), onOpenProfile)}
      {item(
        t('auth.mySelections'),
        onOpenSelections,
        count > 0 ? <span className="auth-dropdown-count">{count}</span> : null,
      )}
      {item(t('home.history'), onOpenHistory)}
      {item(t('auth.occasions'), onOpenNotifications)}
      {item(t('auth.myFriends'), onOpenFriends)}
      {/* "Demander l'avis d'un ami" and "Tendances de mes amis" live inside the
          "Mes amis" view now (quick-nav there), so they're not repeated here. */}
      {isSuperuserEmail(user.email) && (
        <>
          <div className="auth-dropdown-sep" />
          {item(t('auth.admin'), onOpenAdmin)}
        </>
      )}
      <div className="auth-dropdown-sep" />
      <div className="auth-appearance">
        <span className="auth-appearance-label">{t('lang.label')}</span>
        <LangToggle />
      </div>
      <AppearanceToggle />
      <QuotaLine />
      <div className="auth-dropdown-sep" />
      <button
        type="button"
        className="auth-dropdown-item danger"
        onClick={() => {
          onSignOut();
          onClose();
        }}
      >
        {t('auth.signOut')}
      </button>
    </div>
  );
}

export default function AuthMenu({ variant = 'home', onOpenSelections, onOpenProfile, onOpenFriends, onOpenHistory, onOpenAsk, onOpenNotifications, onOpenTrending, onOpenAdmin }) {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [openLogin, setOpenLogin] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  if (!user) {
    return (
      <>
        {/* Signed-in users get the FR/EN toggle inside this menu's dropdown
            (see UserDropdown below) — but a signed-out visitor has no menu to
            open, so without this they'd have no way to switch language at all. */}
        <LangToggle />
        <button
          type="button"
          className={`auth-trigger auth-trigger-${variant}`}
          onClick={() => setOpenLogin(true)}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.4" />
            <path
              d="M2.5 13.5c.8-2.4 3-3.8 5.5-3.8s4.7 1.4 5.5 3.8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          {t('auth.signIn')}
        </button>
        {openLogin && <LoginModal onClose={() => setOpenLogin(false)} />}
      </>
    );
  }

  return (
    <div className="auth-userwrap">
      <button
        type="button"
        className="auth-userbtn"
        onClick={() => setOpenMenu((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={openMenu}
      >
        <Avatar user={user} size={32} />
        <span className="auth-userbtn-name">
          {user.given_name || user.name?.split(' ')[0] || t('auth.account')}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path
            d="M2 4l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {openMenu && (
        <UserDropdown
          user={user}
          onClose={() => setOpenMenu(false)}
          onSignOut={signOut}
          onOpenSelections={onOpenSelections}
          onOpenProfile={onOpenProfile}
          onOpenFriends={onOpenFriends}
          onOpenHistory={onOpenHistory}
          onOpenAsk={onOpenAsk}
          onOpenNotifications={onOpenNotifications}
          onOpenTrending={onOpenTrending}
          onOpenAdmin={onOpenAdmin}
        />
      )}
    </div>
  );
}
