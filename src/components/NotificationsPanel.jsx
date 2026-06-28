import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import {
  listIncomingRequests,
  listFriends,
  respondFriendRequest,
  incomingPolls,
  outgoingPolls,
  votePoll,
  deletePoll,
  dismissPoll,
} from '../lib/cloud.js';
import { getDismissed, dismissNotif, clearDismissed } from '../lib/dismissed.js';
import { AmazonPrice, ProductImage } from './ProductCard.jsx';
import {
  listOccasions,
  addOccasion,
  removeOccasion,
  daysToOccurrence,
  withinReminderWindow,
  turningAge,
  REMIND_AHEAD,
  REMIND_PAST,
} from '../lib/occasions.js';
import { upcomingHolidays } from '../lib/holidays.js';

function initials(name = '') {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
}

// Bell hub: pending friend requests + upcoming occasions (friends' birthdays +
// manual occasions), each with a "find a gift" shortcut.
export default function NotificationsPanel({ open = true, onClose, onGift }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [incoming, setIncoming] = useState([]);
  const [friends, setFriends] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [inPolls, setInPolls] = useState([]);
  const [outPolls, setOutPolls] = useState([]);
  const [hidden, setHidden] = useState(() => getDismissed(user?.sub));
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');

  const refresh = () => {
    listIncomingRequests().then(setIncoming);
    listFriends().then(setFriends);
    setOccasions(listOccasions(user?.sub));
    incomingPolls().then(setInPolls);
    outgoingPolls().then(setOutPolls);
    setHidden(getDismissed(user?.sub));
  };

  // Dismiss an incoming poll (remove myself as recipient) — optimistic.
  const dismissIn = async (pollId) => {
    setInPolls((cur) => cur.filter((p) => p.id !== pollId));
    await dismissPoll(pollId);
  };

  // Delete one of my own polls — optimistic.
  const deleteOut = async (pollId) => {
    setOutPolls((cur) => cur.filter((p) => p.id !== pollId));
    await deletePoll(pollId);
  };

  // Hide a derived reminder (birthday / holiday) for this occurrence.
  const hideReminder = (dismissKey) => {
    dismissNotif(user?.sub, dismissKey);
    setHidden((cur) => new Set(cur).add(dismissKey));
  };

  // Bring back everything hidden by mistake.
  const restoreHidden = () => {
    clearDismissed(user?.sub);
    setHidden(new Set());
  };

  const amazonUrl = (p) =>
    p.u || `https://www.amazon.fr/s?k=${encodeURIComponent(`${p.b || ''} ${p.m || ''}`)}&tag=oraklia123-21`;

  const vote = async (pollId, idx) => {
    setInPolls((cur) => cur.map((p) => (p.id === pollId ? { ...p, my_vote: idx } : p)));
    await votePoll(pollId, idx);
    incomingPolls().then(setInPolls);
    outgoingPolls().then(setOutPolls);
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

  // Occurrence-scoped key for a derived reminder, so hiding it only hides this
  // year's instance (it comes back next year).
  const occurrenceKey = (base, days) =>
    `${base}:${new Date(Date.now() + days * 86400000).getFullYear()}`;

  // Build the sorted list within the reminder window (2 weeks ahead → 2 days
  // after it passed); anything further out stays hidden.
  const upcoming = [];
  for (const f of friends) {
    if (!f.birthday) continue;
    const d = daysToOccurrence(f.birthday, true);
    if (!withinReminderWindow(d)) continue;
    upcoming.push({
      key: 'f_' + f.user_id,
      kind: 'bday',
      name: f.display_name,
      friendId: f.user_id,
      avatar: f.avatar_url,
      days: d,
      age: turningAge(f.birthday),
      dismissKey: occurrenceKey('f_' + f.user_id, d),
    });
  }
  for (const o of occasions) {
    const d = daysToOccurrence(o.date, o.recurring);
    if (!withinReminderWindow(d)) continue;
    upcoming.push({ key: o.id, kind: 'occ', name: o.label, days: d, occId: o.id });
  }
  for (const h of upcomingHolidays(REMIND_AHEAD, new Date(), REMIND_PAST)) {
    upcoming.push({
      key: 'h_' + h.key,
      kind: 'holiday',
      name: t('holiday.' + h.key),
      emoji: h.emoji,
      days: h.days,
      dismissKey: occurrenceKey('h_' + h.key, h.days),
    });
  }
  const visibleUpcoming = upcoming.filter((e) => !e.dismissKey || !hidden.has(e.dismissKey));
  visibleUpcoming.sort((a, b) => a.days - b.days);

  const whenLabel = (d) =>
    d === 0 ? t('occ.today')
      : d === 1 ? t('occ.tomorrow')
      : d === -1 ? t('occ.yesterday')
      : d < 0 ? t('occ.daysAgo', { n: -d })
      : t('occ.inDays', { n: d });

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

  const nothing = incoming.length === 0 && visibleUpcoming.length === 0;

  return (
    <div className="notif-pop" role="dialog" aria-label={t('notif.title')}>
      <div className="notif-pop-caret" aria-hidden="true" />
      <header className="notif-pop-head">
        <h3 className="notif-pop-title">{t('notif.title')}</h3>
        <button className="notif-pop-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
      </header>
      <div className="notif-pop-body">

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

            {inPolls.length > 0 && (
              <>
                <div className="friends-section">{t('poll.incoming')}</div>
                {inPolls.map((poll) => (
                  <div key={poll.id} className="poll-card">
                    <div className="poll-card-head">
                      <span>{t('poll.from', { name: poll.owner_name })}</span>
                      <button
                        type="button"
                        className="poll-card-x"
                        aria-label={t('poll.dismiss')}
                        title={t('poll.dismiss')}
                        onClick={() => dismissIn(poll.id)}
                      >
                        ✕
                      </button>
                    </div>
                    {poll.title && <div className="poll-card-title">{poll.title}</div>}
                    <ul className="pub-items poll-vote-items">
                      {(poll.items || []).map((p, idx) => {
                        const chosen = poll.my_vote === idx;
                        return (
                          <li key={idx} className={'pub-item poll-pick' + (chosen ? ' is-on' : '')}>
                            <a className="pub-item-img" href={amazonUrl(p)} target="_blank" rel="noopener noreferrer sponsored">
                              <ProductImage product={{ brand: p.b, model: p.m, image_url: p.i }} size="small" />
                            </a>
                            <span className="pub-item-main">
                              <span className="pub-item-title">{[p.b, p.m].filter(Boolean).join(' ')}</span>
                              {p.p != null && <span className="pub-item-price"><AmazonPrice price={p.p} /></span>}
                            </span>
                            <button
                              type="button"
                              className={'friend-btn' + (chosen ? '' : ' ghost')}
                              onClick={() => vote(poll.id, idx)}
                            >
                              {chosen ? t('poll.voted') : t('poll.vote')}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </>
            )}

            <div className="friends-section notif-occ-head">
              <span>{t('notif.occasions')}</span>
              {hidden.size > 0 && (
                <button type="button" className="notif-restore" onClick={restoreHidden}>
                  {t('notif.restoreHidden', { n: hidden.size })}
                </button>
              )}
            </div>
            {visibleUpcoming.length === 0 ? (
              <div className="friends-hint">{nothing ? t('notif.empty') : '—'}</div>
            ) : (
              <ul className="friends-list">
                {visibleUpcoming.map((e) => (
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
                    <button
                      type="button"
                      className="friend-btn ghost notif-x"
                      aria-label={t('notif.dismiss')}
                      title={t('notif.dismiss')}
                      onClick={() => (e.kind === 'occ' ? delManual(e.occId) : hideReminder(e.dismissKey))}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {outPolls.length > 0 && (
              <>
                <div className="friends-section">{t('poll.outgoing')}</div>
                {outPolls.map((poll) => {
                  const votes = Array.isArray(poll.votes) ? poll.votes : [];
                  return (
                    <div key={poll.id} className="poll-card">
                      <div className={'poll-card-head' + (poll.title ? '' : ' poll-card-head-end')}>
                        {poll.title && <span>{poll.title}</span>}
                        <button
                          type="button"
                          className="poll-card-x"
                          aria-label={t('poll.delete')}
                          title={t('poll.delete')}
                          onClick={() => deleteOut(poll.id)}
                        >
                          ✕
                        </button>
                      </div>
                      <ul className="pub-items">
                        {(poll.items || []).map((p, idx) => {
                          const voters = votes.filter((v) => v.choice === idx);
                          return (
                            <li key={idx} className="pub-item">
                              <span className="pub-item-img">
                                <ProductImage product={{ brand: p.b, model: p.m, image_url: p.i }} size="small" />
                              </span>
                              <span className="pub-item-main">
                                <span className="pub-item-title">{[p.b, p.m].filter(Boolean).join(' ')}</span>
                              </span>
                              <span className="poll-tally">{voters.length}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="poll-voters">
                        {votes.length === 0
                          ? t('poll.noVotes')
                          : votes.map((v, i) => `${v.name} → ${(v.choice ?? 0) + 1}`).join(' · ')}
                      </div>
                    </div>
                  );
                })}
              </>
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
