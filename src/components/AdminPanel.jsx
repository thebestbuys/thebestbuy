import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { useDismiss } from '../lib/useDismiss.js';
import {
  adminListUsers,
  adminUserLists,
  adminListItems,
  adminUserSelections,
  adminUserOwned,
  adminUserConversations,
  adminMetrics,
  adminTopProducts,
  adminDailySeries,
} from '../lib/cloud.js';
import { AmazonPrice, ProductImage } from './ProductCard.jsx';
import MetricsDashboard from './MetricsDashboard.jsx';

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

function amazonUrl(p) {
  return (
    p.amazon_url ||
    `https://www.amazon.fr/s?k=${encodeURIComponent(`${p.brand} ${p.model}`)}&tag=oraklia123-21`
  );
}

// A list of product snapshots, rendered as Amazon "shared link" rows.
function ProductRows({ items }) {
  return (
    <ul className="pub-items">
      {items.map((p, i) => {
        const url = amazonUrl(p);
        return (
          <li key={i} className="pub-item">
            <a className="pub-item-img" href={url} target="_blank" rel="noopener noreferrer sponsored">
              <ProductImage product={p} size="small" />
            </a>
            <a className="pub-item-main" href={url} target="_blank" rel="noopener noreferrer sponsored">
              <span className="pub-item-title">{[p.brand, p.model].filter(Boolean).join(' ')}</span>
              {p.price != null && (
                <span className="pub-item-price"><AmazonPrice price={p.price} /></span>
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

// Superuser "god mode": browse every account's lists, favourites, owned items
// and conversation history. The Admin entry is only shown to the superuser, and
// every fetch goes through a SECURITY DEFINER RPC that re-checks the identity
// server-side (see is_superuser() in supabase/schema.sql), so this panel is inert
// for anyone else even if rendered.
export default function AdminPanel({ open, onClose }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const { closing, close } = useDismiss(onClose);
  const [q, setQ] = useState('');
  const [mainTab, setMainTab] = useState('users'); // 'users' | 'metrics'
  const [users, setUsers] = useState(null);   // null = loading
  const [metrics, setMetrics] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [dailySeries, setDailySeries] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [tab, setTab] = useState('lists');

  // Per-user data (loaded lazily when a tab is first opened).
  const [lists, setLists] = useState(null);
  const [openListId, setOpenListId] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [favs, setFavs] = useState(null);
  const [owned, setOwned] = useState(null);
  const [convos, setConvos] = useState(null);
  const [openConvoId, setOpenConvoId] = useState(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setMainTab('users');
    setViewing(null);
    setUsers(null);
    adminListUsers().then(setUsers);
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, user?.sub]);

  if (!open) return null;

  const selectMainTab = (next) => {
    setMainTab(next);
    if (next === 'metrics') {
      if (metrics === null) adminMetrics().then(setMetrics);
      if (topProducts === null) adminTopProducts(12).then(setTopProducts);
      if (dailySeries === null) adminDailySeries(365).then(setDailySeries);
    }
  };

  const openUser = (u) => {
    setViewing(u);
    setTab('lists');
    setLists(null);
    setOpenListId(null);
    setListItems([]);
    setFavs(null);
    setOwned(null);
    setConvos(null);
    setOpenConvoId(null);
    adminUserLists(u.user_id).then(setLists);
  };

  const selectTab = (next) => {
    setTab(next);
    if (next === 'favs' && favs === null) adminUserSelections(viewing.user_id).then(setFavs);
    if (next === 'owned' && owned === null) adminUserOwned(viewing.user_id).then(setOwned);
    if (next === 'history' && convos === null) adminUserConversations(viewing.user_id).then(setConvos);
    if (next === 'lists' && lists === null) adminUserLists(viewing.user_id).then(setLists);
  };

  const openList = (l) => {
    if (openListId === l.id) {
      setOpenListId(null);
      return;
    }
    setOpenListId(l.id);
    setListItems([]);
    adminListItems(l.id).then(setListItems);
  };

  const filtered = (users || []).filter((u) => {
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return (
      (u.display_name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  });

  const TABS = [
    ['lists', t('admin.tab.lists')],
    ['favs', t('admin.tab.favs')],
    ['owned', t('admin.tab.owned')],
    ['history', t('admin.tab.history')],
  ];

  return (
    <div className={'sheet-page friends-panel admin-panel' + (closing ? ' is-closing' : '')} role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <header className="sheet-head">
        <div>
          {viewing ? (
            <>
              <button type="button" className="friends-back" onClick={() => setViewing(null)}>
                {t('admin.back')}
              </button>
              <h2 className="history-title">{viewing.display_name || viewing.email}</h2>
              {viewing.email && viewing.display_name && (
                <p className="history-sub">{viewing.email}</p>
              )}
            </>
          ) : (
            <>
              <h2 id="admin-title" className="history-title">{t('admin.title')}</h2>
              <p className="history-sub">{t('admin.sub')}</p>
            </>
          )}
        </div>
        <button className="sheet-close" onClick={close} aria-label={t('auth.close')}>✕</button>
      </header>
      <div className="sheet-body">
        {!viewing ? (
          <div className="friends-body">
            <div className="auth-seg admin-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mainTab === 'users'}
                className={'auth-seg-btn' + (mainTab === 'users' ? ' is-active' : '')}
                onClick={() => selectMainTab('users')}
              >
                {t('admin.users')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mainTab === 'metrics'}
                className={'auth-seg-btn' + (mainTab === 'metrics' ? ' is-active' : '')}
                onClick={() => selectMainTab('metrics')}
              >
                {t('admin.metrics')}
              </button>
            </div>

            {mainTab === 'users' ? (
              <>
                <div className="friends-search">
                  <input
                    type="text"
                    className="profile-input"
                    value={q}
                    placeholder={t('admin.searchPlaceholder')}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <div className="friends-section">
                  {t('admin.users')}
                  {users !== null && <span className="friends-section-n"> — {filtered.length}</span>}
                </div>
                {users === null ? (
                  <div className="friends-hint">…</div>
                ) : filtered.length === 0 ? (
                  <div className="friends-hint">{t('admin.noUsers')}</div>
                ) : (
                  <ul className="friends-list">
                    {filtered.map((u) => (
                      <li key={u.user_id} className="friend-row">
                        <Avatar name={u.display_name || u.email} url={u.avatar_url} />
                        <span className="friend-name">
                          {u.display_name || u.email}
                          {u.display_name && u.email && (
                            <span className="admin-user-email"> · {u.email}</span>
                          )}
                        </span>
                        {u.wishlist_count > 0 && (
                          <span className="sel-list-n">{t('friends.wishCount', { n: u.wishlist_count })}</span>
                        )}
                        <button type="button" className="friend-btn" onClick={() => openUser(u)}>
                          {t('friends.viewLists')}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <MetricsDashboard metrics={metrics} topProducts={topProducts} dailySeries={dailySeries} />
            )}
          </div>
        ) : (
          <div className="friends-body">
            <div className="auth-seg admin-tabs" role="tablist">
              {TABS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={'auth-seg-btn' + (tab === id ? ' is-active' : '')}
                  onClick={() => selectTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'lists' && (
              lists === null ? (
                <div className="friends-hint">…</div>
              ) : lists.length === 0 ? (
                <div className="friends-hint">{t('admin.empty.lists')}</div>
              ) : (
                lists.map((l) => (
                  <div key={l.id} className="pub-list">
                    <button type="button" className="pub-list-head" onClick={() => openList(l)}>
                      <span className="pub-list-name">{l.visibility === 'public' ? '🌐' : '🔒'} {l.name}</span>
                      <span className="sel-list-n">{t('lists.count', { n: l.item_count })}</span>
                      <span className="pub-list-caret">{openListId === l.id ? '▾' : '▸'}</span>
                    </button>
                    {openListId === l.id && <ProductRows items={listItems} />}
                  </div>
                ))
              )
            )}

            {tab === 'favs' && (
              favs === null ? (
                <div className="friends-hint">…</div>
              ) : favs.length === 0 ? (
                <div className="friends-hint">{t('admin.empty.favs')}</div>
              ) : (
                <ProductRows items={favs} />
              )
            )}

            {tab === 'owned' && (
              owned === null ? (
                <div className="friends-hint">…</div>
              ) : owned.length === 0 ? (
                <div className="friends-hint">{t('admin.empty.owned')}</div>
              ) : (
                <ProductRows items={owned} />
              )
            )}

            {tab === 'history' && (
              convos === null ? (
                <div className="friends-hint">…</div>
              ) : convos.length === 0 ? (
                <div className="friends-hint">{t('admin.empty.history')}</div>
              ) : (
                convos.map((c) => {
                  const msgCount = Array.isArray(c.messages) ? c.messages.length : 0;
                  const recs = Array.isArray(c.recommendedProducts) ? c.recommendedProducts : [];
                  const isOpen = openConvoId === c.id;
                  return (
                    <div key={c.id} className="pub-list">
                      <button
                        type="button"
                        className="pub-list-head"
                        onClick={() => setOpenConvoId(isOpen ? null : c.id)}
                      >
                        <span className="pub-list-name">💬 {c.title || c.objet || 'Conversation'}</span>
                        <span className="sel-list-n">{t('admin.convoMessages', { n: msgCount })}</span>
                        <span className="pub-list-caret">{isOpen ? '▾' : '▸'}</span>
                      </button>
                      {isOpen && (
                        <div className="admin-convo">
                          <ul className="admin-convo-msgs">
                            {(c.messages || [])
                              .filter((m) => m && m.text)
                              .map((m, i) => (
                                <li key={i} className={'admin-msg admin-msg-' + (m.role || 'bot')}>
                                  {m.text}
                                </li>
                              ))}
                          </ul>
                          {recs.length > 0 && (
                            <>
                              <div className="friends-section">{t('admin.convoRecs')}</div>
                              <ProductRows items={recs} />
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
