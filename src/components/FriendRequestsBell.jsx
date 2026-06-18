import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { listIncomingRequests, listFriends } from '../lib/cloud.js';
import { listOccasions, daysUntil } from '../lib/occasions.js';

const SOON_DAYS = 14;

// Bell with a badge counting pending incoming friend requests. Clicking opens
// the Friends panel. Refreshes on mount, on window focus, every 60s, and
// whenever `pingKey` changes (e.g. the Friends panel closing).
export default function FriendRequestsBell({ onOpen, pingKey }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const [reqs, friends] = await Promise.all([listIncomingRequests(), listFriends()]);
        if (!active) return;
        let n = Array.isArray(reqs) ? reqs.length : 0;
        for (const f of friends || []) {
          if (f.birthday) {
            const d = daysUntil(f.birthday, true);
            if (d != null && d <= SOON_DAYS) n += 1;
          }
        }
        for (const o of listOccasions(user?.sub)) {
          const d = daysUntil(o.date, o.recurring);
          if (d != null && d >= 0 && d <= SOON_DAYS) n += 1;
        }
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

  if (!user) return null;

  return (
    <button
      type="button"
      className="bell-btn"
      onClick={onOpen}
      aria-label={t('notif.title')}
      title={t('notif.title')}
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
  );
}
