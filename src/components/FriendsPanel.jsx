import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import PanelHelpButton from './PanelHelpButton.jsx';
import {
  searchUsers,
  sendFriendRequest,
  listIncomingRequests,
  listFriends,
  respondFriendRequest,
  removeFriend,
  friendPublicLists,
  publicListItems,
  logLinkClick,
} from '../lib/cloud.js';
import { useDismiss } from '../lib/useDismiss.js';
import { AmazonPrice, ProductImage } from './ProductCard.jsx';

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
export default function FriendsPanel({ open, onClose, onOpenAsk, onOpenTrending, onAddFriend }) {
  const { user, cloudReady } = useAuth();
  const { t } = useI18n();
  const { closing, close } = useDismiss(onClose);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [incoming, setIncoming] = useState([]);
  const [friends, setFriends] = useState([]);
  const [viewing, setViewing] = useState(null);   // friend whose lists we browse
  const [closingId, setClosingId] = useState(null); // friend collapsing (keep mounted during the close animation)
  const [pubLists, setPubLists] = useState(null);  // null = loading
  const [openListId, setOpenListId] = useState(null);
  const [closingListId, setClosingListId] = useState(null); // list collapsing (keep items mounted during the close animation)
  const [listItems, setListItems] = useState([]);

  const refresh = () => {
    listIncomingRequests().then(setIncoming);
    listFriends().then(setFriends);
  };

  useEffect(() => {
    if (!open) return;
    setQ('');
    setResults([]);
    setSearched(false);
    setViewing(null);
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open || !cloudReady) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.sub, cloudReady]);

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

  // Toggle an inline expansion of the friend's public lists right under their
  // row (click again to collapse). Only one friend is expanded at a time, which
  // is why pubLists/openListId/listItems can stay single shared states.
  const browse = (f) => {
    if (viewing?.user_id === f.user_id) {
      // Collapse: keep the content mounted through the height transition so the
      // close animates too (grid-rows 1fr → 0fr), then unmount.
      setClosingId(f.user_id);
      setViewing(null);
      setTimeout(() => setClosingId((c) => (c === f.user_id ? null : c)), 260);
      return;
    }
    setClosingId(null);
    setViewing(f);
    setPubLists(null);
    setOpenListId(null);
    setListItems([]);
    friendPublicLists(f.user_id).then(setPubLists);
  };

  const openList = (l) => {
    if (openListId === l.id) {
      // Collapse: keep the items mounted through the height transition.
      setClosingListId(l.id);
      setOpenListId(null);
      setTimeout(() => setClosingListId((c) => (c === l.id ? null : c)), 260);
      return;
    }
    setClosingListId(null);
    setOpenListId(l.id);
    setListItems([]);
    publicListItems(l.id).then(setListItems);
  };

  const amazonUrl = (p) =>
    p.amazon_url ||
    `https://www.amazon.fr/s?k=${encodeURIComponent(`${p.brand} ${p.model}`)}&tag=oraklia123-21`;

  return (
    <div className={'sheet-page friends-panel' + (closing ? ' is-closing' : '')} role="dialog" aria-modal="true" aria-labelledby="friends-title">
        <header className="sheet-head">
          <div>
            <h2 id="friends-title" className="history-title">{t('friends.title')}</h2>
            <p className="history-sub">{t('friends.sub')}</p>
          </div>
          <div className="panel-head-actions">
            <PanelHelpButton />
            <button className="sheet-close" onClick={close} aria-label={t('auth.close')}>✕</button>
          </div>
        </header>
        <div className="sheet-body">

        {!user ? (
          <div className="history-empty">
            <div className="history-empty-icon">👋</div>
            <div className="history-empty-text">{t('friends.signedOut')}</div>
          </div>
        ) : (
          <div className="friends-body">
            {/* Add a person to gift to (relationship, age, interests…) — the
                recipient form that used to live behind the home "Trouver un cadeau". */}
            {onAddFriend && (
              <button type="button" className="friends-add-btn" onClick={() => onAddFriend()}>
                <span aria-hidden="true">🎁</span> {t('friends.addFriendCta')}
              </button>
            )}
            {/* Quick access to the two friend-centric views (also in the account
                menu), surfaced here right under the header for discoverability. */}
            {(onOpenAsk || onOpenTrending) && (
              <div className="friends-quicknav">
                {onOpenAsk && (
                  <button type="button" className="friends-quicknav-btn" onClick={() => onOpenAsk()}>
                    <span className="friends-quicknav-ico" aria-hidden="true">💬</span>
                    <span>{t('poll.ask')}</span>
                    <span className="friends-quicknav-arrow" aria-hidden="true">›</span>
                  </button>
                )}
                {onOpenTrending && (
                  <button type="button" className="friends-quicknav-btn" onClick={() => onOpenTrending()}>
                    <span className="friends-quicknav-ico" aria-hidden="true">📈</span>
                    <span>{t('auth.myTrends')}</span>
                    <span className="friends-quicknav-arrow" aria-hidden="true">›</span>
                  </button>
                )}
              </div>
            )}

            <div className="friends-search">
              <input
                type="text"
                className="profile-input"
                value={q}
                placeholder={t('friends.searchPlaceholder')}
                onChange={(e) => setQ(e.target.value)}
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
                <div className="friends-section">
                  {t('friends.requests')}
                  <span className="friends-section-n"> — {incoming.length}</span>
                </div>
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

            <div className="friends-section">
              {t('friends.myFriends')}
              <span className="friends-section-n"> — {friends.length}</span>
            </div>
            {friends.length === 0 ? (
              <div className="friends-hint">{t('friends.empty')}</div>
            ) : (
              <ul className="friends-list">
                {friends.map((f) => {
                  const expanded = viewing?.user_id === f.user_id;
                  const mounted = expanded || closingId === f.user_id;
                  return (
                  <li key={f.user_id} className={'friend-item' + (mounted ? ' is-expanded' : '')}>
                    <div className="friend-row">
                      <Avatar name={f.display_name} url={f.avatar_url} />
                      <span className="friend-name">{f.display_name}</span>
                      <button type="button" className={'friend-btn' + (expanded ? ' is-active' : '')} onClick={() => browse(f)}>
                        {t('friends.viewLists')}
                      </button>
                      <button type="button" className="friend-btn ghost" onClick={() => remove(f)}>
                        {t('friends.remove')}
                      </button>
                    </div>
                    <div className={'friend-lists-wrap' + (expanded ? ' is-open' : '')}>
                      <div className="friend-lists-inner">
                        {mounted && (
                          <div className="friend-lists">
                            {pubLists === null ? (
                              <div className="friends-hint">…</div>
                            ) : pubLists.length === 0 ? (
                              <div className="friends-hint">{t('friends.noPublicLists')}</div>
                            ) : (
                              pubLists.map((l) => (
                                <div key={l.id} className="pub-list">
                                  <button type="button" className="pub-list-head" onClick={() => openList(l)}>
                                    <span className="pub-list-name">🌐 {l.name}</span>
                                    <span className="sel-list-n">{t('lists.count', { n: l.item_count })}</span>
                                    <span className="pub-list-caret">{openListId === l.id ? '▾' : '▸'}</span>
                                  </button>
                                  <div className={'pub-items-wrap' + (openListId === l.id ? ' is-open' : '')}>
                                    <div className="pub-items-inner">
                                      {(openListId === l.id || closingListId === l.id) && (
                                        <ul className="pub-items">
                                          {listItems.map((p, i) => {
                                            const url = amazonUrl(p);
                                            const onAmazon = () => logLinkClick(p).catch(() => {});
                                            return (
                                              <li key={i} className="pub-item">
                                                <a className="pub-item-img" href={url} target="_blank" rel="noopener noreferrer sponsored" title={t('product.viewAmazon')} onClick={onAmazon}>
                                                  <ProductImage product={p} size="small" />
                                                </a>
                                                <a className="pub-item-main" href={url} target="_blank" rel="noopener noreferrer sponsored" onClick={onAmazon}>
                                                  <span className="pub-item-title">{[p.brand, p.model].filter(Boolean).join(' ')}</span>
                                                  {p.price != null && (
                                                    <span className="pub-item-price"><AmazonPrice price={p.price} /></span>
                                                  )}
                                                </a>
                                              </li>
                                            );
                                          })}
                                        </ul>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
