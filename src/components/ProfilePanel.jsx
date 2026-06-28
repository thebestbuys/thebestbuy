import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { getProfile, saveProfile } from '../lib/profile.js';
import { useDismiss } from '../lib/useDismiss.js';

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

const pad2 = (n) => String(n).padStart(2, '0');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Calendar date picker for the birthday, styled to match the site (no native
// <input type="date">, which followed the BROWSER locale and showed MM/DD in
// English — ambiguous, easy to invert). Month/weekday names are localized to the
// APP language via Intl; the value stays canonical 'YYYY-MM-DD'. Tapping the
// "Month Year" title opens a year grid so jumping back decades is quick.
function BirthdayPicker({ value, lang, t, onChange }) {
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(value || '')
    ? { y: +value.slice(0, 4), m: +value.slice(5, 7) - 1, d: +value.slice(8, 10) }
    : null;

  const [open, setOpen] = useState(false);
  const [yearGrid, setYearGrid] = useState(false);
  // Month currently shown in the calendar.
  const initial = selected || { y: new Date().getFullYear() - 25, m: 0, d: 1 };
  const [view, setView] = useState({ y: initial.y, m: initial.m });
  const rootRef = useRef(null);

  // Re-centre on the selected date each time the popover opens.
  useEffect(() => {
    if (open) {
      setYearGrid(false);
      setView({ y: (selected || initial).y, m: (selected || initial).m });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const triggerLabel = selected
    ? cap(new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })
        .format(new Date(selected.y, selected.m, selected.d)))
    : t('profile.birthdayPlaceholder');

  // Monday-first weekday headers (Jan 1 2024 is a Monday).
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    cap(new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + i))).replace('.', ''),
  );
  const monthName = cap(new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    .format(new Date(view.y, view.m, 1)));

  const firstOffset = (new Date(view.y, view.m, 1).getDay() + 6) % 7; // Monday=0
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const today = new Date();
  const isToday = (d) => today.getFullYear() === view.y && today.getMonth() === view.m && today.getDate() === d;
  const isSelected = (d) => selected && selected.y === view.y && selected.m === view.m && selected.d === d;

  const shift = (delta) => {
    const dt = new Date(view.y, view.m + delta, 1);
    setView({ y: dt.getFullYear(), m: dt.getMonth() });
  };
  const pick = (d) => {
    onChange(`${view.y}-${pad2(view.m + 1)}-${pad2(d)}`);
    setOpen(false);
  };

  const nowY = new Date().getFullYear();
  const years = Array.from({ length: nowY - 1920 + 1 }, (_, i) => nowY - i);

  return (
    <div className="birthday-field" ref={rootRef}>
      <button
        type="button"
        className={'profile-input birthday-trigger' + (selected ? '' : ' is-empty')}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{triggerLabel}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2.5" y="3.5" width="11" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="birthday-pop" role="dialog" aria-label={t('profile.birthday')}>
          <div className="bp-head">
            <button type="button" className="bp-nav" onClick={() => shift(-1)} aria-label="−" disabled={yearGrid}>‹</button>
            <button type="button" className="bp-title" onClick={() => setYearGrid((v) => !v)}>
              {yearGrid ? t('profile.birthdayYear') : monthName}
            </button>
            <button type="button" className="bp-nav" onClick={() => shift(1)} aria-label="+" disabled={yearGrid}>›</button>
          </div>

          {yearGrid ? (
            <div className="bp-years">
              {years.map((yr) => (
                <button
                  type="button"
                  key={yr}
                  className={'bp-year' + (yr === view.y ? ' is-selected' : '')}
                  onClick={() => { setView((v) => ({ ...v, y: yr })); setYearGrid(false); }}
                >
                  {yr}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="bp-weekdays">
                {weekdays.map((w) => <span key={w} className="bp-weekday">{w}</span>)}
              </div>
              <div className="bp-grid">
                {cells.map((d, i) =>
                  d == null ? (
                    <span key={`b${i}`} className="bp-day is-blank" />
                  ) : (
                    <button
                      type="button"
                      key={d}
                      className={'bp-day' + (isSelected(d) ? ' is-selected' : '') + (isToday(d) ? ' is-today' : '')}
                      onClick={() => pick(d)}
                    >
                      {d}
                    </button>
                  ),
                )}
              </div>
            </>
          )}

          {selected && (
            <button type="button" className="bp-clear" onClick={() => { onChange(''); setOpen(false); }}>
              {t('profile.clear')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// "Mon profil": structured fields (gender, age, profession, nationality,
// address) plus a free-form self-description, stored per user and injected into
// the AI prompts so questions/recommendations match the user. Mirrors the modal
// styling of SelectionsPanel / HistoryPanel.
export default function ProfilePanel({ open, onClose }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { closing, close } = useDismiss(onClose);
  const [form, setForm] = useState(getProfile());
  const [saved, setSaved] = useState(false);
  const [hobbyQuery, setHobbyQuery] = useState('');

  // Load fresh whenever the panel opens (or the user changes).
  useEffect(() => {
    if (!open) return;
    setForm(getProfile(user?.sub));
    setSaved(false);
    setHobbyQuery('');
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
              <BirthdayPicker
                value={form.birthday}
                lang={lang}
                t={t}
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
        </div>
      </div>
    </div>
  );
}
