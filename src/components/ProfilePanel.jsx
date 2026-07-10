import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { getProfile, saveProfile } from '../lib/profile.js';
import { useDismiss } from '../lib/useDismiss.js';
import DatePicker from './DatePicker.jsx';

const BIO_MAX = 600;

// Curated passions/hobbies for the multi-select. Bilingual labels; the picker
// shows them as quick-add chips and as live search results, and the user can
// also type any custom one. Stored on the profile as a comma-separated string
// (field `hobbies`) so it feeds the AI prompt like the other fields.
const HOBBY_SUGGESTIONS = [
  { fr: 'Cuisine', en: 'Cooking' },
  { fr: 'Pâtisserie', en: 'Baking' },
  { fr: 'Jeux vidéo', en: 'Gaming' },
  { fr: 'Lecture', en: 'Reading' },
  { fr: 'Randonnée', en: 'Hiking' },
  { fr: 'Course à pied', en: 'Running' },
  { fr: 'Vélo', en: 'Cycling' },
  { fr: 'Musculation', en: 'Fitness' },
  { fr: 'Yoga', en: 'Yoga' },
  { fr: 'Photographie', en: 'Photography' },
  { fr: 'Jardinage', en: 'Gardening' },
  { fr: 'Voyages', en: 'Travel' },
  { fr: 'Musique', en: 'Music' },
  { fr: 'Guitare', en: 'Guitar' },
  { fr: 'Peinture', en: 'Painting' },
  { fr: 'Dessin', en: 'Drawing' },
  { fr: 'Tricot', en: 'Knitting' },
  { fr: 'Pêche', en: 'Fishing' },
  { fr: 'Camping', en: 'Camping' },
  { fr: 'Football', en: 'Football' },
  { fr: 'Tennis', en: 'Tennis' },
  { fr: 'Natation', en: 'Swimming' },
  { fr: 'Ski', en: 'Skiing' },
  { fr: 'Jeux de société', en: 'Board games' },
  { fr: 'Café', en: 'Coffee' },
  { fr: 'Vin', en: 'Wine' },
  { fr: 'Bricolage', en: 'DIY' },
  { fr: 'Astronomie', en: 'Astronomy' },
  { fr: 'Programmation', en: 'Coding' },
  { fr: 'Cinéma', en: 'Movies' },
  { fr: 'Danse', en: 'Dancing' },
  { fr: 'Mode', en: 'Fashion' },
];

// "a, b, c" <-> ['a','b','c']
const splitHobbies = (s) =>
  String(s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

// "Mon profil": structured fields (gender, age, profession, nationality,
// address) plus a free-form self-description, stored per user and injected into
// the AI prompts so questions/recommendations match the user. Mirrors the modal
// styling of SelectionsPanel / HistoryPanel.
export default function ProfilePanel({ open, onClose }) {
  const { user, deleteAccount } = useAuth();
  const { t, lang } = useI18n();
  const { closing, close } = useDismiss(onClose);
  const [form, setForm] = useState(getProfile());
  const [saved, setSaved] = useState(false);
  const [hobbyQuery, setHobbyQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // Load fresh whenever the panel opens (or the user changes).
  useEffect(() => {
    if (!open) return;
    setForm(getProfile(user?.sub));
    setSaved(false);
    setHobbyQuery('');
    setConfirmDelete(false);
    setDeleting(false);
    setDeleteError(false);
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
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
    setHobbyQuery('');
  };

  const doDelete = async () => {
    setDeleting(true);
    setDeleteError(false);
    const res = await deleteAccount();
    if (res?.ok) {
      close(); // signed out + local data wiped; drop back to the home
    } else {
      setDeleting(false);
      setDeleteError(true);
    }
  };

  // ── Passions / hobbies (multi-select) ──────────────────────────────────────
  const hobbies = splitHobbies(form.hobbies);
  const hasHobby = (label) =>
    hobbies.some((h) => h.toLowerCase() === label.trim().toLowerCase());
  const setHobbies = (list) => {
    // De-dupe (case-insensitive), keep first spelling, cap the total.
    const seen = new Set();
    const out = [];
    for (const h of list) {
      const v = h.trim();
      const k = v.toLowerCase();
      if (!v || seen.has(k)) continue;
      seen.add(k);
      out.push(v);
    }
    setForm((f) => ({ ...f, hobbies: out.slice(0, 30).join(', ') }));
    setSaved(false);
  };
  const addHobby = (label) => {
    const v = String(label || '').trim();
    if (!v) return;
    setHobbies([...hobbies, v]);
    setHobbyQuery('');
  };
  const removeHobby = (label) =>
    setHobbies(hobbies.filter((h) => h !== label));

  // Suggestions for the current language, not already picked.
  const q = hobbyQuery.trim().toLowerCase();
  const suggestionLabels = HOBBY_SUGGESTIONS.map((h) => h[lang] || h.fr);
  const filteredSuggestions = suggestionLabels.filter(
    (label) => !hasHobby(label) && (!q || label.toLowerCase().includes(q)),
  );

  const hasAny = Object.values(form).some((v) => String(v || '').trim());

  return (
    <div className={'sheet-page profile-panel' + (closing ? ' is-closing' : '')} role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <header className="sheet-head">
          <div>
            <h2 id="profile-title" className="history-title">
              {t('profile.title')}
            </h2>
            <p className="history-sub">{t('profile.sub')}</p>
          </div>
          <button
            className="sheet-close"
            onClick={close}
            aria-label={t('auth.close')}
          >
            ✕
          </button>
        </header>
        <div className="sheet-body">

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
              <label className="profile-label" id="profile-birthday-label">
                {t('profile.birthday')}
              </label>
              <DatePicker
                value={form.birthday}
                lang={lang}
                placeholder={t('profile.birthdayPlaceholder')}
                ariaLabel={t('profile.birthday')}
                yearLabel={t('profile.birthdayYear')}
                clearLabel={t('profile.clear')}
                onChange={(v) => {
                  setForm((f) => ({ ...f, birthday: v }));
                  setSaved(false);
                }}
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

          <div className="hobby-section">
            <label className="profile-label" htmlFor="profile-hobbies">
              {t('profile.hobbies')}
            </label>
            <p className="profile-hint hobby-sub">{t('profile.hobbiesHint')}</p>

            {hobbies.length > 0 && (
              <div className="hobby-selected">
                {hobbies.map((h) => (
                  <button
                    type="button"
                    key={h}
                    className="hobby-chip is-on"
                    onClick={() => removeHobby(h)}
                    title={t('profile.hobbyRemove', { name: h })}
                  >
                    {h}
                    <span className="hobby-chip-x" aria-hidden="true">✕</span>
                  </button>
                ))}
              </div>
            )}

            <input
              id="profile-hobbies"
              className="profile-input"
              type="text"
              value={hobbyQuery}
              placeholder={t('profile.hobbiesPlaceholder')}
              onChange={(e) => setHobbyQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addHobby(hobbyQuery);
                }
              }}
            />

            {filteredSuggestions.length > 0 && (
              <div className="hobby-suggestions">
                {/* When typing, offer a custom add for the exact text first. */}
                {q && !suggestionLabels.some((l) => l.toLowerCase() === q) && !hasHobby(hobbyQuery) && (
                  <button type="button" className="hobby-chip hobby-chip-add" onClick={() => addHobby(hobbyQuery)}>
                    + {hobbyQuery.trim()}
                  </button>
                )}
                {filteredSuggestions.slice(0, 14).map((s) => (
                  <button type="button" key={s} className="hobby-chip" onClick={() => addHobby(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
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

          {user && (
            <div className="profile-danger">
              {!confirmDelete ? (
                <>
                  <button
                    type="button"
                    className="profile-delete-btn"
                    onClick={() => { setConfirmDelete(true); setDeleteError(false); }}
                  >
                    {t('profile.deleteAccount')}
                  </button>
                  <p className="profile-hint profile-delete-hint">
                    {t('profile.deleteAccountHint')}
                  </p>
                </>
              ) : (
                <div className="profile-delete-confirm">
                  <p className="profile-delete-title">{t('profile.deleteConfirmTitle')}</p>
                  <p className="profile-hint">{t('profile.deleteConfirmBody')}</p>
                  {deleteError && (
                    <p className="profile-delete-error">{t('profile.deleteError')}</p>
                  )}
                  <div className="profile-delete-actions">
                    <button
                      type="button"
                      className="profile-clear"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                    >
                      {t('profile.deleteCancel')}
                    </button>
                    <button
                      type="button"
                      className="profile-delete-btn is-confirm"
                      onClick={doDelete}
                      disabled={deleting}
                    >
                      {deleting ? t('profile.deleting') : t('profile.deleteConfirm')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
