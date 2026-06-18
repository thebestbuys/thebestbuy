import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { getProfile, saveProfile } from '../lib/profile.js';

const BIO_MAX = 600;

// "Mon profil": structured fields (gender, age, profession, nationality,
// address) plus a free-form self-description, stored per user and injected into
// the AI prompts so questions/recommendations match the user. Mirrors the modal
// styling of SelectionsPanel / HistoryPanel.
export default function ProfilePanel({ open, onClose }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState(getProfile());
  const [saved, setSaved] = useState(false);

  // Load fresh whenever the panel opens (or the user changes).
  useEffect(() => {
    if (!open) return;
    setForm(getProfile(user?.sub));
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

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const save = () => {
    setForm(saveProfile(user?.sub, form));
    setSaved(true);
  };

  const clear = () => {
    setForm(saveProfile(user?.sub, {}));
    setSaved(false);
  };

  const hasAny = Object.values(form).some((v) => String(v || '').trim());

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
          <div className="profile-grid">
            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-gender">
                {t('profile.gender')}
              </label>
              <select
                id="profile-gender"
                className="profile-input"
                value={form.gender}
                onChange={set('gender')}
              >
                <option value="">{t('profile.genderPlaceholder')}</option>
                <option value={t('profile.gender.female')}>{t('profile.gender.female')}</option>
                <option value={t('profile.gender.male')}>{t('profile.gender.male')}</option>
                <option value={t('profile.gender.other')}>{t('profile.gender.other')}</option>
                <option value={t('profile.gender.na')}>{t('profile.gender.na')}</option>
              </select>
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-age">
                {t('profile.age')}
              </label>
              <input
                id="profile-age"
                className="profile-input"
                type="number"
                min="0"
                max="120"
                inputMode="numeric"
                value={form.age}
                placeholder={t('profile.agePlaceholder')}
                onChange={set('age')}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-profession">
                {t('profile.profession')}
              </label>
              <input
                id="profile-profession"
                className="profile-input"
                type="text"
                value={form.profession}
                placeholder={t('profile.professionPlaceholder')}
                onChange={set('profession')}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-nationality">
                {t('profile.nationality')}
              </label>
              <input
                id="profile-nationality"
                className="profile-input"
                type="text"
                value={form.nationality}
                placeholder={t('profile.nationalityPlaceholder')}
                onChange={set('nationality')}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="profile-birthday">
                {t('profile.birthday')}
              </label>
              <input
                id="profile-birthday"
                className="profile-input"
                type="date"
                value={form.birthday || ''}
                onChange={set('birthday')}
              />
            </div>

            <div className="profile-field profile-field-wide">
              <label className="profile-label" htmlFor="profile-address">
                {t('profile.address')}
              </label>
              <input
                id="profile-address"
                className="profile-input"
                type="text"
                value={form.address}
                placeholder={t('profile.addressPlaceholder')}
                onChange={set('address')}
              />
            </div>
          </div>

          <label className="profile-label profile-bio-label" htmlFor="profile-bio">
            {t('profile.label')}
          </label>
          <textarea
            id="profile-bio"
            className="profile-textarea"
            value={form.bio}
            maxLength={BIO_MAX}
            placeholder={t('profile.placeholder')}
            onChange={set('bio')}
            rows={6}
          />
          <div className="profile-meta">
            <span className="profile-counter">
              {t('profile.counter', { n: form.bio.length })}
            </span>
            <span className="profile-hint">{t('profile.hint')}</span>
          </div>

          <label className="profile-consent">
            <input
              type="checkbox"
              className="profile-consent-check"
              checked={form.shareTrends !== 'false'}
              onChange={(e) => {
                setForm((f) => ({ ...f, shareTrends: e.target.checked ? 'true' : 'false' }));
                setSaved(false);
              }}
            />
            <span className="profile-consent-text">
              <span className="profile-consent-label">{t('profile.shareTrends')}</span>
              <span className="profile-consent-hint">{t('profile.shareTrendsHint')}</span>
            </span>
          </label>

          <div className="profile-actions">
            {hasAny && (
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
