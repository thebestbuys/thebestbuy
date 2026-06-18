import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { listIncomingRequests, listFriends, respondFriendRequest } from '../lib/cloud.js';
import {
  listOccasions,
  addOccasion,
  removeOccasion,
  daysUntil,
  turningAge,
} from '../lib/occasions.js';
import { upcomingHolidays } from '../lib/holidays.js';

function initials(name = '') {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
}

// Bell hub: pending friend requests + upcoming occasions (friends' birthdays +
// manual occasions), each with a "find a gift" shortcut.
export default function NotificationsPanel({ open, onClose, onGift }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [incoming, setIncoming] = useState([]);
  const [friends, setFriends] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');

  const refresh = () => {
    listIncomingRequests().then(setIncoming);
    listFriends().then(setFriends);
    setOccasions(listOccasions(user?.sub));
  };

  useEffect(() => {
    if (!open) return;
    refresh();
    setLabel('');
    setDate('');
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.sub]);

  if (!open) return null;

  const respond = async (id, accept) => {
    setIncoming((cur) => cur.filter((r) => r.id !== id));
    await respondFriendRequest(id, accept);
    refresh();
  };

  // Build the sorted upcoming list (next 365 days).
  const upcoming = [];
  for (const f of friends) {
    if (!f.birthday) continue;
    const d = daysUntil(f.birthday, true);
    if (d == null) continue;
    upcoming.push({
      key: 'f_' + f.user_id,
      kind: 'bday',
      name: f.display_name,
      friendId: f.user_id,
      avatar: f.avatar_url,
      days: d,
      age: turningAge(f.birthday),
    });
  }
  for (const o of occasions) {
    const d = daysUntil(o.date, o.recurring);
    if (d == null || d < 0) continue;
    upcoming.push({ key: o.id, kind: 'occ', name: o.label, days: d, occId: o.id });
  }
  for (const h of upcomingHolidays()) {
    upcoming.push({
      key: 'h_' + h.key,
      kind: 'holiday',
      name: t('holiday.' + h.key),
      emoji: h.emoji,
      days: h.days,
    });
  }
  upcoming.sort((a, b) => a.days - b.days);

  const whenLabel = (d) =>
    d === 0 ? t('occ.today') : d === 1 ? t('occ.tomorrow') : t('occ.inDays', { n: d });

  const giftFor = (e) => {
    if (e.kind === 'bday') {
      onGift?.({ friendId: e.friendId, friendName: e.name, occasion: t('gift.occ.birthday') });
    } else if (e.kind === 'holiday') {
      onGift?.({ occasion: e.name });
    } else {
      onGift?.({ occasion: e.name });
    }
    // App decides what to do (start directly for a friend, or open the gift form
    // prefilled with the occasion) and closes this panel.
  };

  const addManual = () => {
    if (!label.trim() || !date) return;
    addOccasion(user?.sub, { label, date, recurring: true });
    setLabel('');
    setDate('');
    setOccasions(listOccasions(user?.sub));
  };

  const delManual = (id) => {
    removeOccasion(user?.sub, id);
    setOccasions(listOccasions(user?.sub));
  };

  const nothing = incoming.length === 0 && upcoming.length === 0;

  return (
    <div className="auth-modal-bg" onClick={onClose}>
      <div
        className="history-panel notif-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="history-head">
          <div>
            <h2 id="notif-title" className="history-title">{t('notif.title')}</h2>
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
        </header>

        {!user ? (
          <div className="history-empty">
            <div className="history-empty-icon">🔔</div>
            <div className="history-empty-text">{t('friends.signedOut')}</div>
          </div>
        ) : (
          <div className="friends-body">
            {incoming.length > 0 && (
              <>
                <div className="friends-section">{t('notif.requests')}</div>
                <ul className="friends-list">
                  {incoming.map((r) => (
                    <li key={r.id} className="friend-row">
                      <span className="friend-avatar-fallback" style={{ width: 36, height: 36, fontSize: 13 }}>
                        {initials(r.display_name)}
                      </span>
                      <span className="friend-name">{r.display_name}</span>
                      <button type="button" className="friend-btn" onClick={() => respond(r.id, true)}>
                        {t('friends.accept')}
                      </button>
                      <button type="button" className="friend-btn ghost" onClick={() => respond(r.id, false)}>
                        {t('friends.decline')}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="friends-section">{t('notif.occasions')}</div>
            {upcoming.length === 0 ? (
              <div className="friends-hint">{nothing ? t('notif.empty') : '—'}</div>
            ) : (
              <ul className="friends-list">
                {upcoming.map((e) => (
                  <li key={e.key} className="friend-row occ-row">
                    <span className="occ-emoji" aria-hidden="true">{e.kind === 'bday' ? '🎂' : e.emoji || '🎉'}</span>
                    <span className="friend-name occ-main">
                      <span className="occ-name">
                        {e.kind === 'bday' ? t('occ.birthdayOf', { name: e.name }) : e.name}
                        {e.kind === 'bday' && e.age ? ` · ${t('occ.turns', { age: e.age })}` : ''}
                      </span>
                      <span className="occ-when">{whenLabel(e.days)}</span>
                    </span>
                    <button type="button" className="friend-btn" onClick={() => giftFor(e)}>
                      🎁
                    </button>
                    {e.kind === 'occ' && (
                      <button type="button" className="friend-btn ghost" onClick={() => delManual(e.occId)}>
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="friends-section">{t('occ.addTitle')}</div>
            <div className="occ-add">
              <input
                type="text"
                className="profile-input"
                value={label}
                maxLength={80}
                placeholder={t('occ.labelPlaceholder')}
                onChange={(e) => setLabel(e.target.value)}
              />
              <input
                type="date"
                className="profile-input occ-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <button type="button" className="friend-btn" disabled={!label.trim() || !date} onClick={addManual}>
                {t('occ.add')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
