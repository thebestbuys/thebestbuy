import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { useDismiss } from '../lib/useDismiss.js';
import {
  adminListUsers,
  adminUserLists,
  adminListItems,
  adminUserSelections,
  adminUserClicks,
  adminUserOwned,
  adminUserConversations,
  adminMetrics,
  adminTopProducts,
  adminDailySeries,
  adminUserProfile,
  adminSetTester,
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

// Read-only view of a user's profile fields (superuser). `profile` is null while
// loading, then {} (no row) or { display_name, email, avatar_url, data }.
function ProfileCard({ profile, t }) {
  if (profile === null) return <div className="friends-hint">…</div>;
  const d = (profile && profile.data) || {};
  const rows = [
    ['profile.gender', d.gender],
    ['profile.age', d.age],
    ['profile.profession', d.profession],
    ['profile.nationality', d.nationality],
    ['profile.address', d.address],
    ['profile.birthday', d.birthday],
    ['profile.hobbies', d.hobbies],
  ].filter(([, v]) => v != null && String(v).trim());
  const bio = String(d.bio || '').trim();
  if (rows.length === 0 && !bio && !(profile && profile.email)) {
    return <div className="friends-hint">{t('admin.noProfile')}</div>;
  }
  return (
    <div className="admin-profile">
      {profile.email && (
        <div className="admin-profile-row">
          <span className="admin-profile-k">Email</span>
          <span className="admin-profile-v">{profile.email}</span>
        </div>
      )}
      {rows.map(([k, v]) => (
        <div key={k} className="admin-profile-row">
          <span className="admin-profile-k">{t(k)}</span>
          <span className="admin-profile-v">{String(v)}</span>
        </div>
      ))}
      {bio && (
        <div className="admin-profile-bio">
          <span className="admin-profile-k">{t('profile.label')}</span>
          <p>{bio}</p>
        </div>
      )}
    </div>
  );
}

// Superuser "god mode": browse every account's lists, favourites, owned items
// and conversation history. The Admin entry is only shown to the superuser, and
// every fetch goes through a SECURITY DEFINER RPC that re-checks the identity
// server-side (see is_superuser() in supabase/schema.sql), so this panel is inert
// for anyone else even if rendered.
export default function AdminPanel({ open, onClose, onOpenProduct }) {
  const { user, cloudReady } = useAuth();
  const { t } = useI18n();
  const { closing, close } = useDismiss(onClose);
  const [q, setQ] = useState('');
  const [mainTab, setMainTab] = useState('users'); // 'users' | 'metrics'
  const [users, setUsers] = useState(null);   // null = loading
  const [metrics, setMetrics] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [dailySeries, setDailySeries] = useState(null);
  const [includeTesters, setIncludeTesters] = useState(false);
  // Which user's row is expanded inline (accordion), and that user's profile.
  const [expandedId, setExpandedId] = useState(null);
  // Row playing its collapse animation: kept rendered (with its now-stale data)
  // until the height transition finishes, so closing looks as smooth as opening.
  const [closingId, setClosingId] = useState(null);
  const closeTimer = useRef(null);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('lists');
  const [listsSubTab, setListsSubTab] = useState('lists'); // 'lists' | 'favs'
  const [activitySubTab, setActivitySubTab] = useState('clicked'); // 'clicked' | 'owned'

  // Per-user data (loaded lazily when a tab is first opened).
  const [lists, setLists] = useState(null);
  const [openListId, setOpenListId] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [favs, setFavs] = useState(null);
  const [clicks, setClicks] = useState(null);
  const [owned, setOwned] = useState(null);
  const [convos, setConvos] = useState(null);
  const [openConvoId, setOpenConvoId] = useState(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setMainTab('users');
    setExpandedId(null);
    setUsers(null);
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open || !cloudReady) return;
    adminListUsers().then(setUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.sub, cloudReady]);

  if (!open) return null;

  const selectMainTab = (next) => setMainTab(next);

  // (Re)load the dashboard whenever it's shown or the "include testers" toggle
  // changes, so the stats reflect the current choice.
  useEffect(() => {
    if (!open || mainTab !== 'metrics' || !cloudReady) return;
    adminMetrics(includeTesters).then(setMetrics);
    adminTopProducts(12, null, null, includeTesters).then(setTopProducts);
    adminDailySeries(365, includeTesters).then(setDailySeries);
  }, [open, mainTab, includeTesters, cloudReady]);

  // Toggle a user's inline detail (accordion). Opening one resets the per-user
  // data and loads their profile + first tab; clicking the open one collapses it.
  const toggleUser = (u) => {
    clearTimeout(closeTimer.current);
    if (expandedId === u.user_id) {
      setExpandedId(null);
      setClosingId(u.user_id);
      closeTimer.current = setTimeout(() => setClosingId((id) => (id === u.user_id ? null : id)), 220);
      return;
    }
    setClosingId(null);
    setExpandedId(u.user_id);
    setTab('profile');
    setListsSubTab('lists');
    setActivitySubTab('clicked');
    setProfile(null);
    setLists(null);
    setOpenListId(null);
    setListItems([]);
    setFavs(null);
    setClicks(null);
    setOwned(null);
    setConvos(null);
    setOpenConvoId(null);
    adminUserProfile(u.user_id).then(setProfile);
  };

  // Flag / unflag a user as a tester (excluded from the dashboard stats).
  // Optimistic: update the row immediately, revert if the RPC fails.
  const toggleTester = async (u) => {
    const next = !u.is_tester;
    setUsers((list) => (list || []).map((x) => (x.user_id === u.user_id ? { ...x, is_tester: next } : x)));
    const ok = await adminSetTester(u.user_id, next);
    if (!ok) {
      setUsers((list) => (list || []).map((x) => (x.user_id === u.user_id ? { ...x, is_tester: !next } : x)));
    }
  };

  const selectTab = (next) => {
    setTab(next);
    if (next === 'lists' && listsSubTab === 'lists' && lists === null) adminUserLists(expandedId).then(setLists);
    if (next === 'lists' && listsSubTab === 'favs' && favs === null) adminUserSelections(expandedId).then(setFavs);
    if (next === 'activity' && activitySubTab === 'clicked' && clicks === null) adminUserClicks(expandedId).then(setClicks);
    if (next === 'activity' && activitySubTab === 'owned' && owned === null) adminUserOwned(expandedId).then(setOwned);
    if (next === 'history' && convos === null) adminUserConversations(expandedId).then(setConvos);
  };

  // Sub-tab of the "Listes & Favoris" tab.
  const selectListsSubTab = (next) => {
    setListsSubTab(next);
    if (next === 'lists' && lists === null) adminUserLists(expandedId).then(setLists);
    if (next === 'favs' && favs === null) adminUserSelections(expandedId).then(setFavs);
  };

  // Sub-tab of the "Consultés & Achetés" tab.
  const selectActivitySubTab = (next) => {
    setActivitySubTab(next);
    if (next === 'clicked' && clicks === null) adminUserClicks(expandedId).then(setClicks);
    if (next === 'owned' && owned === null) adminUserOwned(expandedId).then(setOwned);
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
    ['profile', t('admin.tab.profile')],
    ['lists', t('admin.tab.listsFavs')],
    ['activity', t('admin.tab.activity')],
    ['history', t('admin.tab.history')],
  ];

  // The detail shown inline under an expanded user row (accordion).
  const userDetail = () => (
    <div className="admin-user-detail">
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

      {tab === 'profile' && <ProfileCard profile={profile} t={t} />}

      {tab === 'lists' && (
        <div className="admin-sel-sub">
          <div className="auth-seg admin-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={listsSubTab === 'lists'}
              className={'auth-seg-btn' + (listsSubTab === 'lists' ? ' is-active' : '')}
              onClick={() => selectListsSubTab('lists')}
            >
              {t('admin.tab.lists')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={listsSubTab === 'favs'}
              className={'auth-seg-btn' + (listsSubTab === 'favs' ? ' is-active' : '')}
              onClick={() => selectListsSubTab('favs')}
            >
              {t('sel.tabFavorites')}
            </button>
          </div>
          {listsSubTab === 'lists' ? (
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
          ) : favs === null ? (
            <div className="friends-hint">…</div>
          ) : favs.length === 0 ? (
            <div className="friends-hint">{t('admin.empty.favs')}</div>
          ) : (
            <ProductRows items={favs} />
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="admin-sel-sub">
          <div className="auth-seg admin-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activitySubTab === 'clicked'}
              className={'auth-seg-btn' + (activitySubTab === 'clicked' ? ' is-active' : '')}
              onClick={() => selectActivitySubTab('clicked')}
            >
              {t('sel.tabClicked')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activitySubTab === 'owned'}
              className={'auth-seg-btn' + (activitySubTab === 'owned' ? ' is-active' : '')}
              onClick={() => selectActivitySubTab('owned')}
            >
              {t('sel.tabOwned')}
            </button>
          </div>
          {activitySubTab === 'clicked' ? (
            clicks === null ? (
              <div className="friends-hint">…</div>
            ) : clicks.length === 0 ? (
              <div className="friends-hint">{t('admin.empty.clicked')}</div>
            ) : (
              <ProductRows items={clicks} />
            )
          ) : owned === null ? (
            <div className="friends-hint">…</div>
          ) : owned.length === 0 ? (
            <div className="friends-hint">{t('admin.empty.owned')}</div>
          ) : (
            <ProductRows items={owned} />
          )}
        </div>
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
  );

  return (
    <div className={'sheet-page friends-panel admin-panel' + (closing ? ' is-closing' : '')} role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <header className="sheet-head">
        <div>
          <h2 id="admin-title" className="history-title">{t('admin.title')}</h2>
          <p className="history-sub">{t('admin.sub')}</p>
        </div>
        <button className="sheet-close" onClick={close} aria-label={t('auth.close')}>✕</button>
      </header>
      <div className="sheet-body">
        {(
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
                    {filtered.map((u) => {
                      const isOpen = expandedId === u.user_id;
                      const isClosing = closingId === u.user_id;
                      return (
                        <li key={u.user_id} className={'admin-user' + (isOpen ? ' is-open' : '') + (u.is_tester ? ' is-tester' : '')}>
                          <div className="friend-row">
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
                            <button
                              type="button"
                              role="switch"
                              aria-checked={!!u.is_tester}
                              className={'admin-tester-switch' + (u.is_tester ? ' is-on' : '')}
                              onClick={() => toggleTester(u)}
                              title={t('admin.testerHint')}
                            >
                              <span className="admin-tester-switch-label">{t('admin.tester')}</span>
                              <span className="admin-tester-track"><span className="admin-tester-knob" /></span>
                            </button>
                            <button type="button" className="friend-btn" onClick={() => toggleUser(u)}>
                              {isOpen ? t('admin.hideProfile') : t('admin.viewProfile')}
                            </button>
                          </div>
                          <div className={'admin-user-detail-wrap' + (isOpen ? ' is-open' : '')}>
                            {(isOpen || isClosing) && userDetail()}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            ) : (
              <MetricsDashboard
                metrics={metrics}
                topProducts={topProducts}
                dailySeries={dailySeries}
                includeTesters={includeTesters}
                onIncludeTesters={setIncludeTesters}
                onOpenProduct={onOpenProduct}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
