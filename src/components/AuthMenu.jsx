import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';

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

function LoginModal({ onClose }) {
  const { ready, clientId, renderButton } = useAuth();
  const { t } = useI18n();
  const btnRef = useRef(null);

  useEffect(() => {
    if (ready && btnRef.current) {
      renderButton(btnRef.current, { width: 280 });
    }
  }, [ready, renderButton]);

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
        ) : (
          <div className="auth-modal-google" ref={btnRef} />
        )}

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

function UserDropdown({ user, onClose, onSignOut }) {
  const { t } = useI18n();
  const wrapRef = useRef(null);
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
      <button type="button" className="auth-dropdown-item" disabled>
        {t('auth.mySelections')}
        <span className="auth-dropdown-soon">{t('auth.soon')}</span>
      </button>
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

export default function AuthMenu({ variant = 'home' }) {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [openLogin, setOpenLogin] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  if (!user) {
    return (
      <>
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
        />
      )}
    </div>
  );
}
