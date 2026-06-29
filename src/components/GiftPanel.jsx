import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import PanelHelpButton from './PanelHelpButton.jsx';
import { GIFT_EMPTY } from '../lib/gift.js';
import {
  listRecipients,
  removeRecipient,
  saveRecipient,
} from '../lib/recipients.js';
import { listFriends } from '../lib/cloud.js';

function chipInitials(name = '') {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
}

function ChipAvatar({ name, url }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        className="gift-chip-ava"
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  }
  return <span className="gift-chip-ava gift-chip-ava-fb">{chipInitials(name)}</span>;
}

// Visual occasion presets (emoji + i18n key).
const OCCASIONS = [
  { k: 'birthday', e: '🎂' },
  { k: 'christmas', e: '🎄' },
  { k: 'valentine', e: '❤️' },
  { k: 'wedding', e: '💍' },
  { k: 'newBaby', e: '👶' },
  { k: 'housewarming', e: '🏡' },
  { k: 'thankYou', e: '🙏' },
  { k: 'justBecause', e: '✨' },
  { k: 'other', e: '🎁' },
];

// Recipient form for gift mode. Collects relationship, gender, age, interests,
// occasion and budget, then hands the payload to onSubmit which starts a gift
// advisor session (reusing the normal recommend/refine pipeline).
//
// People can be saved & reused ("Mes proches"): the durable parts (name,
// relationship, gender, age, interests) persist per user; occasion and budget
// stay per search.
export default function GiftPanel({ open, onClose, onSubmit, initial }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [form, setForm] = useState(GIFT_EMPTY);
  const [people, setPeople] = useState([]);
  const [savedId, setSavedId] = useState(null);   // id of the loaded saved person
  const [personName, setPersonName] = useState('');
  const [friends, setFriends] = useState([]);
  const [friend, setFriend] = useState(null);     // { id, name } when gifting a friend

  useEffect(() => {
    if (!open) return;
    setForm({ ...GIFT_EMPTY, ...(initial || {}) });
    setPeople(listRecipients(user?.sub));
    setSavedId(null);
    setPersonName('');
    setFriend(null);
    listFriends().then(setFriends).catch(() => {});
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, user?.sub]);

  if (!open) return null;

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const loadPerson = (r) => {
    setForm((f) => ({
      ...f,
      relationship: r.relationship || '',
      gender: r.gender || '',
      age: r.age || '',
      interests: r.interests || '',
    }));
    setSavedId(r.id);
    setPersonName(r.label || '');
  };

  const deletePerson = (id, e) => {
    e.stopPropagation();
    removeRecipient(user?.sub, id);
    setPeople((cur) => cur.filter((r) => r.id !== id));
    if (savedId === id) {
      setSavedId(null);
      setPersonName('');
    }
  };

  const savePerson = () => {
    if (!personName.trim()) return;
    const item = saveRecipient(user?.sub, {
      id: savedId,
      label: personName,
      relationship: form.relationship,
      gender: form.gender,
      age: form.age,
      interests: form.interests,
    });
    setPeople(listRecipients(user?.sub));
    setSavedId(item.id);
  };

  // Build the payload: for a friend, only occasion/budget travel (the profile is
  // resolved server-side and never touches the client).
  const payload = (extra = {}) =>
    friend
      ? {
          friendId: friend.id,
          friendName: friend.name,
          occasion: form.occasion,
          budgetMin: form.budgetMin,
          budgetMax: form.budgetMax,
          ...extra,
        }
      : { ...form, ...extra };

  const submit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit?.(payload());
  };

  const canSubmit = friend || form.relationship || form.interests.trim();
  const canSave = personName.trim() && (form.relationship || form.interests.trim());

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
          <PanelHelpButton />
          {friends.length > 0 && (
            <div className="gift-people">
              <div className="profile-label">{t('gift.friendsSection')}</div>
              <div className="gift-people-row">
                {friends.map((f) => (
                  <button
                    type="button"
                    key={f.user_id}
                    className={'gift-chip has-ava' + (friend?.id === f.user_id ? ' is-active' : '')}
                    onClick={() =>
                      setFriend(friend?.id === f.user_id ? null : { id: f.user_id, name: f.display_name })
                    }
                  >
                    <ChipAvatar name={f.display_name} url={f.avatar_url} />
                    {f.display_name}
                    {f.wishlist_count > 0 && (
                      <span className="gift-chip-count" title={t('friends.wishCount', { n: f.wishlist_count })}>
                        🎁 {f.wishlist_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {friend && (
            <div className="gift-friend-banner">
              <span>🎁 {t('gift.friendPrivate', { name: friend.name })}</span>
              <button type="button" className="gift-friend-change" onClick={() => setFriend(null)}>
                {t('gift.changeRecipient')}
              </button>
            </div>
          )}

          {!friend && people.length > 0 && (
            <div className="gift-people">
              <div className="profile-label">{t('gift.saved')}</div>
              <div className="gift-people-row">
                {people.map((r) => (
                  <span
                    key={r.id}
                    className={'gift-chip' + (savedId === r.id ? ' is-active' : '')}
                    role="button"
                    tabIndex={0}
                    onClick={() => loadPerson(r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        loadPerson(r);
                      }
                    }}
                  >
                    {r.label || '—'}
                    <button
                      type="button"
                      className="gift-chip-x"
                      aria-label={t('gift.deletePerson')}
                      title={t('gift.deletePerson')}
                      onClick={(e) => deletePerson(r.id, e)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="profile-grid">
            {!friend && (
            <>
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
            </>
            )}

            <div className="profile-field profile-field-wide">
              <label className="profile-label">{t('gift.occasion')}</label>
              <div className="gift-occ-grid">
                {OCCASIONS.map((o) => {
                  const label = t('gift.occ.' + o.k);
                  const active = form.occasion === label;
                  return (
                    <button
                      type="button"
                      key={o.k}
                      className={'gift-occ' + (active ? ' is-active' : '')}
                      onClick={() => setForm((f) => ({ ...f, occasion: active ? '' : label }))}
                    >
                      <span className="gift-occ-emoji" aria-hidden="true">{o.e}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="profile-field profile-field-wide">
              <label className="profile-label">{t('gift.budget')}</label>
              <div className="gift-budget-inputs">
                <input
                  className="profile-input"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.budgetMin}
                  placeholder={t('gift.budgetMin')}
                  aria-label={t('gift.budgetMin')}
                  onChange={set('budgetMin')}
                />
                <span className="gift-budget-dash">–</span>
                <input
                  className="profile-input"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={form.budgetMax}
                  placeholder={t('gift.budgetMax')}
                  aria-label={t('gift.budgetMax')}
                  onChange={set('budgetMax')}
                />
                <span className="gift-budget-eur">€</span>
              </div>
            </div>
          </div>

          {!friend && (
          <>
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

          <div className="gift-save-row">
            <input
              type="text"
              className="profile-input gift-name-input"
              value={personName}
              maxLength={60}
              placeholder={t('gift.personNamePlaceholder')}
              aria-label={t('gift.personName')}
              onChange={(e) => setPersonName(e.target.value)}
            />
            <button type="button" className="profile-clear" onClick={savePerson} disabled={!canSave}>
              {savedId ? t('gift.updatePerson') : t('gift.savePerson')}
            </button>
          </div>
          </>
          )}

          <div className="profile-meta">
            <span className="profile-hint">{t('gift.hint')}</span>
          </div>

          <div className="profile-actions">
            <button
              type="button"
              className="profile-clear gift-surprise"
              disabled={!canSubmit}
              onClick={() => canSubmit && onSubmit?.(payload({ surprise: true }))}
            >
              ✨ {t('gift.surprise')}
            </button>
            <button type="submit" className="profile-save" disabled={!canSubmit}>
              🎁 {t('gift.submit')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
