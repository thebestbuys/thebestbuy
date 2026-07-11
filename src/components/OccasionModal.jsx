import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { listOccasions, addOccasion, removeOccasion } from '../lib/occasions.js';
import DatePicker from './DatePicker.jsx';

// Dedicated "add an occasion" form, opened from the Mes amis quick-nav. Distinct
// from the notifications bell (which merely lists upcoming occasions): this is a
// focused create form + the list of the user's manual occasions with delete.
export default function OccasionModal({ onClose }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const [occasions, setOccasions] = useState(() => listOccasions(user?.sub));

  const add = () => {
    if (!label.trim() || !date) return;
    addOccasion(user?.sub, { label, date, recurring: true });
    setLabel('');
    setDate('');
    setOccasions(listOccasions(user?.sub));
  };
  const del = (id) => {
    removeOccasion(user?.sub, id);
    setOccasions(listOccasions(user?.sub));
  };

  return createPortal(
    <div className="occ-modal-bg" onClick={onClose}>
      <div className="occ-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="occ-modal-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
        <h2 className="occ-modal-title">{t('occ.addTitle')}</h2>

        <div className="occ-add">
          <input
            type="text"
            className="profile-input"
            value={label}
            maxLength={80}
            placeholder={t('occ.labelPlaceholder')}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          />
          <div className="occ-add-row">
            <DatePicker
              value={date}
              lang={lang}
              placeholder={t('profile.birthdayPlaceholder')}
              ariaLabel={t('occ.addTitle')}
              yearLabel={t('occ.year')}
              clearLabel={t('profile.clear')}
              minYear={new Date().getFullYear() - 100}
              maxYear={new Date().getFullYear() + 5}
              onChange={setDate}
            />
            <button type="button" className="friend-btn" disabled={!label.trim() || !date} onClick={add}>
              {t('occ.add')}
            </button>
          </div>
        </div>

        {occasions.length > 0 && (
          <ul className="occ-modal-list">
            {occasions.map((o) => (
              <li key={o.id} className="occ-modal-item">
                <span className="occ-modal-item-label">{o.label}</span>
                <span className="occ-modal-item-date">{o.date}</span>
                <button
                  type="button"
                  className="occ-modal-del"
                  onClick={() => del(o.id)}
                  aria-label={t('profile.clear')}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
