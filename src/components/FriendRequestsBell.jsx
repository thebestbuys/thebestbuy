import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { listIncomingRequests, listFriends, incomingPolls } from '../lib/cloud.js';
import {
  listOccasions,
  daysToOccurrence,
  withinReminderWindow,
  REMIND_AHEAD,
  REMIND_PAST,
} from '../lib/occasions.js';
import { upcomingHolidays } from '../lib/holidays.js';
import NotificationsPanel from './NotificationsPanel.jsx';

// Bell with a badge counting pending incoming friend requests + upcoming
// occasions. Clicking toggles an anchored notifications popover (Facebook-style)
// rather than a centered modal. Open state is controlled by the parent so the
// account menu's "Occasions" entry can open it too; the bell closes it on an
// outside click or Escape. Count refreshes on mount, focus, every 60s, and
// whenever `pingKey` changes (e.g. the popover closing).
export default function FriendRequestsBell({ open = false, onToggle, onClose, onGift, pingKey }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [count, setCount] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const [reqs, friends, polls] = await Promise.all([
          listIncomingRequests(),
          listFriends(),
          incomingPolls(),
        ]);
        if (!active) return;
        let n = Array.isArray(reqs) ? reqs.length : 0;
        n += (polls || []).filter((p) => p.my_vote == null).length;
        for (const f of friends || []) {
          if (f.birthday && withinReminderWindow(daysToOccurrence(f.birthday, true))) n += 1;
        }
        for (const o of listOccasions(user?.sub)) {
          if (withinReminderWindow(daysToOccurrence(o.date, o.recurring))) n += 1;
        }
        n += upcomingHolidays(REMIND_AHEAD, new Date(), REMIND_PAST).length;
        setCount(n);
      } catch {
        /* ignore */
      }
    };
    load();
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      window.removeEventListener('focus', onFocus);
      clearInterval(id);
    };
  }, [user, pingKey]);

  // Close on outside click / Escape while open.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      // The date picker inside NotificationsPanel (occasions form) is portaled
      // to document.body so its calendar isn't clipped by this popover's own
      // overflow:auto body — exclude it or every click inside it (month nav,
      // year grid, …) would register as "outside" and close this popover.
      if (e.target.closest('.birthday-pop')) return;
      if (wrapRef.current && !wrapRef.current.contains(e.target)) onClose?.();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!user) return null;

  return (
    <div className="bell-wrap" ref={wrapRef}>
      <button
        type="button"
        className={'bell-btn' + (open ? ' is-open' : '')}
        onClick={onToggle}
        aria-label={t('notif.title')}
        title={t('notif.title')}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path
            d="M9 2.4a4 4 0 0 0-4 4c0 3-1.1 4.2-1.6 4.7-.25.25-.07.65.28.65h10.64c.35 0 .53-.4.28-.65C14.1 10.6 13 9.4 13 6.4a4 4 0 0 0-4-4Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path d="M7.5 14a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        {count > 0 && <span className="bell-badge">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && <NotificationsPanel onClose={onClose} onGift={onGift} />}
    </div>
  );
}
