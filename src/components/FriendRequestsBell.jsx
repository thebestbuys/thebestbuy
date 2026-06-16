import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { listIncomingRequests } from '../lib/cloud.js';

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
    const load = () =>
      listIncomingRequests()
        .then((r) => {
          if (active) setCount(Array.isArray(r) ? r.length : 0);
        })
        .catch(() => {});
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
      aria-label={t('friends.requests')}
      title={t('friends.requests')}
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
