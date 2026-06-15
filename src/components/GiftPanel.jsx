import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { GIFT_EMPTY } from '../lib/gift.js';

// Recipient form for gift mode. Collects relationship, gender, age, interests,
// occasion and budget, then hands the payload to onSubmit which starts a gift
// advisor session (reusing the normal recommend/refine pipeline).
export default function GiftPanel({ open, onClose, onSubmit }) {
  const { t } = useI18n();
  const [form, setForm] = useState(GIFT_EMPTY);

  useEffect(() => {
    if (!open) return;
    setForm(GIFT_EMPTY);
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
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.relationship && !form.interests.trim()) return;
    onSubmit?.(form);
  };

  const canSubmit = form.relationship || form.interests.trim();

  return (
    <div className="auth-modal-bg" onClick={onClose}>
      <form
        className="history-panel profile-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <header className="history-head">
          <div>
            <h2 id="gift-title" className="history-title">
              🎁 {t('gift.title')}
            </h2>
            <p className="history-sub">{t('gift.sub')}</p>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={onClose}
            aria-label={t('auth.close')}
          >
            ✕
          </button>
        </header>

        <div className="profile-form">
          <div className="profile-grid">
            <div className="profile-field profile-field-wide">
              <label className="profile-label" htmlFor="gift-rel">
                {t('gift.relationship')}
              </label>
              <select id="gift-rel" className="profile-input" value={form.relationship} onChange={set('relationship')}>
                <option value="">{t('gift.relationshipPlaceholder')}</option>
                <option value={t('gift.rel.partner')}>{t('gift.rel.partner')}</option>
                <option value={t('gift.rel.parent')}>{t('gift.rel.parent')}</option>
                <option value={t('gift.rel.child')}>{t('gift.rel.child')}</option>
                <option value={t('gift.rel.sibling')}>{t('gift.rel.sibling')}</option>
                <option value={t('gift.rel.friend')}>{t('gift.rel.friend')}</option>
                <option value={t('gift.rel.colleague')}>{t('gift.rel.colleague')}</option>
                <option value={t('gift.rel.other')}>{t('gift.rel.other')}</option>
              </select>
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="gift-gender">
                {t('gift.gender')}
              </label>
              <select id="gift-gender" className="profile-input" value={form.gender} onChange={set('gender')}>
                <option value="">{t('profile.genderPlaceholder')}</option>
                <option value={t('profile.gender.female')}>{t('profile.gender.female')}</option>
                <option value={t('profile.gender.male')}>{t('profile.gender.male')}</option>
                <option value={t('profile.gender.other')}>{t('profile.gender.other')}</option>
              </select>
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="gift-age">
                {t('gift.age')}
              </label>
              <input
                id="gift-age"
                className="profile-input"
                type="number"
                min="0"
                max="120"
                inputMode="numeric"
                value={form.age}
                placeholder={t('gift.agePlaceholder')}
                onChange={set('age')}
              />
            </div>

            <div className="profile-field profile-field-wide">
              <label className="profile-label" htmlFor="gift-occasion">
                {t('gift.occasion')}
              </label>
              <select id="gift-occasion" className="profile-input" value={form.occasion} onChange={set('occasion')}>
                <option value="">{t('gift.occasionPlaceholder')}</option>
                <option value={t('gift.occ.birthday')}>{t('gift.occ.birthday')}</option>
                <option value={t('gift.occ.christmas')}>{t('gift.occ.christmas')}</option>
                <option value={t('gift.occ.valentine')}>{t('gift.occ.valentine')}</option>
                <option value={t('gift.occ.wedding')}>{t('gift.occ.wedding')}</option>
                <option value={t('gift.occ.newBaby')}>{t('gift.occ.newBaby')}</option>
                <option value={t('gift.occ.housewarming')}>{t('gift.occ.housewarming')}</option>
                <option value={t('gift.occ.thankYou')}>{t('gift.occ.thankYou')}</option>
                <option value={t('gift.occ.justBecause')}>{t('gift.occ.justBecause')}</option>
                <option value={t('gift.occ.other')}>{t('gift.occ.other')}</option>
              </select>
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="gift-bmin">
                {t('gift.budgetMin')}
              </label>
              <input
                id="gift-bmin"
                className="profile-input"
                type="number"
                min="0"
                inputMode="numeric"
                value={form.budgetMin}
                placeholder="20"
                onChange={set('budgetMin')}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label" htmlFor="gift-bmax">
                {t('gift.budgetMax')}
              </label>
              <input
                id="gift-bmax"
                className="profile-input"
                type="number"
                min="0"
                inputMode="numeric"
                value={form.budgetMax}
                placeholder="80"
                onChange={set('budgetMax')}
              />
            </div>
          </div>

          <label className="profile-label profile-bio-label" htmlFor="gift-interests">
            {t('gift.interests')}
          </label>
          <textarea
            id="gift-interests"
            className="profile-textarea"
            value={form.interests}
            maxLength={400}
            placeholder={t('gift.interestsPlaceholder')}
            onChange={set('interests')}
            rows={4}
          />
          <div className="profile-meta">
            <span className="profile-hint">{t('gift.hint')}</span>
          </div>

          <div className="profile-actions">
            <button type="submit" className="profile-save" disabled={!canSubmit}>
              🎁 {t('gift.submit')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
