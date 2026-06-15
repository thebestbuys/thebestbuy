import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { getProfile, saveProfile } from '../lib/profile.js';

const MAX_LEN = 600;

// "Mon profil": a short free-form self-description, stored per user and injected
// into the AI prompts so questions/recommendations match the user. Mirrors the
// modal styling of SelectionsPanel / HistoryPanel.
export default function ProfilePanel({ open, onClose }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [bio, setBio] = useState('');
  const [saved, setSaved] = useState(false);

  // Load fresh whenever the panel opens (or the user changes).
  useEffect(() => {
    if (!open) return;
    setBio(getProfile(user?.sub).bio || '');
    setSaved(false);
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = () => {
    const clean = saveProfile(user?.sub, { bio });
    setBio(clean.bio);
    setSaved(true);
  };

  const clear = () => {
    saveProfile(user?.sub, { bio: '' });
    setBio('');
    setSaved(false);
  };

  return (
    <div className="auth-modal-bg" onClick={onClose}>
      <div
        className="history-panel profile-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="history-head">
          <div>
            <h2 id="profile-title" className="history-title">
              {t('profile.title')}
            </h2>
            <p className="history-sub">{t('profile.sub')}</p>
          </div>
          <button
            className="auth-modal-close"
            onClick={onClose}
            aria-label={t('auth.close')}
          >
            ✕
          </button>
        </header>

        <div className="profile-form">
          <label className="profile-label" htmlFor="profile-bio">
            {t('profile.label')}
          </label>
          <textarea
            id="profile-bio"
            className="profile-textarea"
            value={bio}
            maxLength={MAX_LEN}
            placeholder={t('profile.placeholder')}
            onChange={(e) => {
              setBio(e.target.value);
              setSaved(false);
            }}
            rows={7}
          />
          <div className="profile-meta">
            <span className="profile-counter">
              {t('profile.counter', { n: bio.length })}
            </span>
            <span className="profile-hint">{t('profile.hint')}</span>
          </div>

          <div className="profile-actions">
            {bio.trim() && (
              <button type="button" className="profile-clear" onClick={clear}>
                {t('profile.clear')}
              </button>
            )}
            <button type="button" className="profile-save" onClick={save}>
              {saved ? t('profile.saved') : t('profile.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
