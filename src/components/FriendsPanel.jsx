import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import {
  searchUsers,
  sendFriendRequest,
  listIncomingRequests,
  listFriends,
  respondFriendRequest,
  removeFriend,
} from '../lib/cloud.js';

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

function Avatar({ name, url, size = 36 }) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <span className="friend-avatar-fallback" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}

// "Mes amis": search registered users by name, send/accept friend requests, see
// the friends list. Friend profiles stay private (used server-side for gifts).
export default function FriendsPanel({ open, onClose }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [friends, setFriends] = useState([]);

  const refresh = () => {
    listIncomingRequests().then(setIncoming);
    listFriends().then(setFriends);
  };

  useEffect(() => {
    if (!open) return;
    setQ('');
    setResults([]);
    setSearched(false);
    refresh();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, user?.sub]);

  // Debounced search.
  const qRef = useRef(q);
  qRef.current = q;
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const id = setTimeout(async () => {
      const r = await searchUsers(term);
      if (qRef.current.trim() === term) {
        setResults(r);
        setSearched(true);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [q, open]);

  if (!open) return null;

  const add = async (u) => {
    setResults((cur) => cur.map((r) => (r.user_id === u.user_id ? { ...r, status: 'pending' } : r)));
    const { ok } = await sendFriendRequest(u.user_id);
    if (!ok) setResults((cur) => cur.map((r) => (r.user_id === u.user_id ? { ...r, status: null } : r)));
  };

  const respond = async (reqId, accept) => {
    setIncoming((cur) => cur.filter((r) => r.id !== reqId));
    await respondFriendRequest(reqId, accept);
    refresh();
  };

  const remove = async (f) => {
    if (!window.confirm(t('friends.removeConfirm', { name: f.display_name }))) return;
    setFriends((cur) => cur.filter((x) => x.user_id !== f.user_id));
    await removeFriend(f.user_id);
    refresh();
  };

  return (
    <div className="auth-modal-bg" onClick={onClose}>
      <div
        className="history-panel friends-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="friends-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="history-head">
          <div>
            <h2 id="friends-title" className="history-title">{t('friends.title')}</h2>
            <p className="history-sub">{t('friends.sub')}</p>
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
        </header>

        {!user ? (
          <div className="history-empty">
            <div className="history-empty-icon">👋</div>
            <div className="history-empty-text">{t('friends.signedOut')}</div>
          </div>
        ) : (
          <div className="friends-body">
            <div className="friends-search">
              <input
                type="text"
                className="profile-input"
                value={q}
                placeholder={t('friends.searchPlaceholder')}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
            </div>

            {q.trim().length >= 2 && (
              <ul className="friends-list">
                {results.length === 0 && searched ? (
                  <li className="friends-hint">{t('friends.noResults')}</li>
                ) : (
                  results.map((u) => (
                    <li key={u.user_id} className="friend-row">
                      <Avatar name={u.display_name} url={u.avatar_url} />
                      <span className="friend-name">{u.display_name}</span>
                      {u.status === 'accepted' ? (
                        <span className="friend-tag">{t('friends.friend')}</span>
                      ) : u.status === 'pending' ? (
                        <span className="friend-tag muted">{t('friends.pending')}</span>
                      ) : (
                        <button type="button" className="friend-btn" onClick={() => add(u)}>
                          {t('friends.add')}
                        </button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}

            {incoming.length > 0 && (
              <>
                <div className="friends-section">{t('friends.requests')}</div>
                <ul className="friends-list">
                  {incoming.map((r) => (
                    <li key={r.id} className="friend-row">
                      <Avatar name={r.display_name} url={r.avatar_url} />
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

            <div className="friends-section">{t('friends.myFriends')}</div>
            {friends.length === 0 ? (
              <div className="friends-hint">{t('friends.empty')}</div>
            ) : (
              <ul className="friends-list">
                {friends.map((f) => (
                  <li key={f.user_id} className="friend-row">
                    <Avatar name={f.display_name} url={f.avatar_url} />
                    <span className="friend-name">{f.display_name}</span>
                    <button type="button" className="friend-btn ghost" onClick={() => remove(f)}>
                      {t('friends.remove')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
