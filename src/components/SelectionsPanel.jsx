import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import PanelHelpButton from './PanelHelpButton.jsx';
import { AmazonPrice, ProductImage, Stars } from './ProductCard.jsx';
import { formatRelative } from '../lib/history.js';
import {
  getSelectionsRevision,
  listSelections,
  removeSelection,
  removeListFromAll,
} from '../lib/selections.js';
import { listLists, getListsRevision, updateList, deleteList } from '../lib/lists.js';
import { listOwned, removeOwned } from '../lib/owned.js';
import { cloudDeleteLinkClicks, cloudFetchLinkClicks } from '../lib/cloud.js';
import { buildShareUrl } from '../lib/gift.js';
import FavoriteButton from './FavoriteButton.jsx';
import { useDismiss } from '../lib/useDismiss.js';

// "Mes sélections" — three tabs sharing one page:
//  • Favoris   — saved products, organized into named lists (private/public).
//  • Consultés — products the user clicked through to Amazon (server log,
//    signed-in only — see cloudFetchLinkClicks).
//  • Achetés   — products marked "already bought" from the product detail
//    modal; feeds the advisor's exclude list (see ownedExclude in App.jsx).
// `initialTab` picks which tab is active on open (the account menu only
// links to 'favorites'; 'clicked'/'owned' are reached via the in-page tab
// bar). Clicking a Consultés/Achetés card opens the shared product detail
// modal (`onOpenProduct`); Favoris cards still link straight to Amazon,
// unchanged.
export default function SelectionsPanel({ open, onClose, getAmazonUrl, onBuy, renderProductDetail, initialTab = 'favorites' }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { closing, close } = useDismiss(onClose);
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const [tab, setTab] = useState(initialTab);
  // A product opened for its detail — rendered INSIDE the body (via
  // renderProductDetail) so the panel header stays visible, instead of a
  // full-screen overlay that would cover the whole sheet.
  const [detail, setDetail] = useState(null);
  const [items, setItems] = useState([]);
  const [lists, setLists] = useState([]);
  const [active, setActive] = useState('all'); // 'all' | listId | 'unfiled'
  const [shared, setShared] = useState(false);
  const [q, setQ] = useState('');
  const loadedSig = useRef(null);
  const [ownedItems, setOwnedItems] = useState([]);
  const [clickedItems, setClickedItems] = useState(null); // null = not loaded yet
  const [clickedLoading, setClickedLoading] = useState(false);
  const [qClicked, setQClicked] = useState('');
  const [qOwned, setQOwned] = useState('');

  const reload = () => {
    setItems(listSelections(user?.sub));
    setLists(listLists(user?.sub));
    loadedSig.current = `${user?.sub || '_anon'}:${getSelectionsRevision(user?.sub)}:${getListsRevision(user?.sub)}`;
  };

  useEffect(() => {
    if (!open) return;
    const sig = `${user?.sub || '_anon'}:${getSelectionsRevision(user?.sub)}:${getListsRevision(user?.sub)}`;
    if (sig === loadedSig.current) return;
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.sub]);

  const reloadOwned = () => setOwnedItems(listOwned(user?.sub));

  useEffect(() => {
    if (!open) return;
    reloadOwned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.sub]);

  // The "déjà acheté" toggle lives in the shared product detail modal, which
  // can be open on top of this panel (e.g. opened from a Consultés card) —
  // it has no direct reference back to us, so it broadcasts this event
  // instead (see owned.js) and we just reload when it's open.
  useEffect(() => {
    if (!open) return;
    const onChanged = () => reloadOwned();
    window.addEventListener('oraklia:owned-changed', onChanged);
    return () => window.removeEventListener('oraklia:owned-changed', onChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open || tab !== 'clicked' || !user) return;
    let alive = true;
    setClickedLoading(true);
    cloudFetchLinkClicks().then((list) => {
      if (!alive) return;
      setClickedItems(Array.isArray(list) ? list : []);
      setClickedLoading(false);
    });
    return () => { alive = false; };
  }, [open, tab, user?.sub]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const inList = (p, id) => Array.isArray(p.listIds) && p.listIds.includes(id);
  const isUnfiled = (p) => !Array.isArray(p.listIds) || p.listIds.length === 0;
  const countFor = (id) => items.filter((p) => inList(p, id)).length;
  const unfiledCount = items.filter(isUnfiled).length;

  const shown =
    active === 'all'
      ? items
      : active === 'unfiled'
      ? items.filter(isUnfiled)
      : items.filter((p) => inList(p, active));

  const activeList = lists.find((l) => l.id === active) || null;

  const matchesTerm = (p, term) =>
    [p.brand, p.model].filter(Boolean).some((s) => String(s).toLowerCase().includes(term));

  const term = q.trim().toLowerCase();
  const visible = term ? shown.filter((p) => matchesTerm(p, term)) : shown;

  const termClicked = qClicked.trim().toLowerCase();
  const visibleClicked = !clickedItems
    ? clickedItems
    : termClicked
    ? clickedItems.filter((p) => matchesTerm(p, termClicked))
    : clickedItems;

  const termOwned = qOwned.trim().toLowerCase();
  const visibleOwned = termOwned ? ownedItems.filter((p) => matchesTerm(p, termOwned)) : ownedItems;

  const remove = (id, e) => {
    e.stopPropagation();
    removeSelection(user?.sub, id);
    reload();
  };

  const removeOwnedItem = (id, e) => {
    e.stopPropagation();
    removeOwned(user?.sub, id);
    reloadOwned();
  };

  const removeClickedItem = (id, e) => {
    e.stopPropagation();
    setClickedItems((prev) => (prev ? prev.filter((p) => p.id !== id) : prev));
    cloudDeleteLinkClicks(id).catch(() => {});
  };

  const onDeleteList = () => {
    if (!activeList) return;
    if (!window.confirm(t('lists.deleteConfirm', { name: activeList.name }))) return;
    removeListFromAll(user?.sub, activeList.id);
    deleteList(user?.sub, activeList.id);
    setActive('all');
    reload();
  };

  const onRenameList = () => {
    if (!activeList) return;
    const name = window.prompt(t('lists.rename'), activeList.name);
    if (name == null) return;
    updateList(user?.sub, activeList.id, { name });
    reload();
  };

  const onToggleVisibility = () => {
    if (!activeList) return;
    updateList(user?.sub, activeList.id, {
      visibility: activeList.visibility === 'public' ? 'private' : 'public',
    });
    reload();
  };

  const shareList = async () => {
    const shareItems = shown.slice(0, 20).map((p) => ({
      b: p.brand,
      m: p.model,
      p: p.price ?? null,
      u: getAmazonUrl ? getAmazonUrl(p) : p.amazon_url,
      i: p.image_url || null,
      s: p.score ?? null,
    }));
    if (!shareItems.length) return;
    const name = activeList ? `${user?.name || ''} · ${activeList.name}` : user?.name || '';
    const payload = { k: 'wish', r: name, items: shareItems };
    const url = await buildShareUrl(payload);
    try {
      if (navigator.share) await navigator.share({ title: 'Oraklia', url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  };

  return (
    <div className={'sheet-page selections-panel' + (closing ? ' is-closing' : '')} role="dialog" aria-modal="true" aria-labelledby="selections-title">
        <header className="sheet-head">
          <div>
            <h2 id="selections-title" className="history-title">{t('selections.title')}</h2>
            <p className="history-sub">
              {user ? t('selections.subUser') : t('selections.subGuest')}
            </p>
          </div>
          <div className="selections-head-actions">
            <PanelHelpButton />
            <button className="sheet-close" onClick={close} aria-label={t('auth.close')}>✕</button>
          </div>
        </header>
        <div className="sheet-body">
        {detail ? renderProductDetail(detail, () => setDetail(null)) : (
        <>

        <div className="sel-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'favorites'} className={'sel-tab' + (tab === 'favorites' ? ' is-active' : '')} onClick={() => setTab('favorites')}>
            {t('sel.tabFavorites')}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'clicked'} className={'sel-tab' + (tab === 'clicked' ? ' is-active' : '')} onClick={() => setTab('clicked')}>
            {t('sel.tabClicked')}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'owned'} className={'sel-tab' + (tab === 'owned' ? ' is-active' : '')} onClick={() => setTab('owned')}>
            {t('sel.tabOwned')}
          </button>
        </div>

        {tab === 'favorites' && (
          <>
            {(lists.length > 0 || unfiledCount > 0) && (
              <div className="sel-lists-bar">
                <button
                  type="button"
                  className={'sel-list-chip' + (active === 'all' ? ' is-active' : '')}
                  onClick={() => setActive('all')}
                >
                  {t('lists.all')} <span className="sel-list-n">{items.length}</span>
                </button>
                {lists.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={'sel-list-chip' + (active === l.id ? ' is-active' : '')}
                    onClick={() => setActive(l.id)}
                  >
                    {l.visibility === 'public' ? '🌐 ' : ''}{l.name}{' '}
                    <span className="sel-list-n">{countFor(l.id)}</span>
                  </button>
                ))}
                {unfiledCount > 0 && (
                  <button
                    type="button"
                    className={'sel-list-chip' + (active === 'unfiled' ? ' is-active' : '')}
                    onClick={() => setActive('unfiled')}
                  >
                    {t('lists.unfiled')} <span className="sel-list-n">{unfiledCount}</span>
                  </button>
                )}
              </div>
            )}

            {activeList && (
              <div className="sel-list-manage">
                <button type="button" className="sel-manage-btn" onClick={onToggleVisibility}>
                  {activeList.visibility === 'public' ? t('lists.makePrivate') : t('lists.makePublic')}
                </button>
                <span className="sel-manage-note">
                  {activeList.visibility === 'public'
                    ? t('lists.visibilityPublicNote')
                    : t('lists.visibilityPrivateNote')}
                </span>
                <span className="sel-manage-spacer" />
                <button type="button" className="sel-manage-btn" onClick={shareList}>
                  <span aria-hidden="true">🔗</span> {shared ? t('selections.shareCopied') : t('selections.share')}
                </button>
                <button type="button" className="sel-manage-btn" onClick={onRenameList}>
                  {t('lists.rename')}
                </button>
                <button type="button" className="sel-manage-btn danger" onClick={onDeleteList}>
                  {t('lists.delete')}
                </button>
              </div>
            )}

            {items.length > 0 && (
              <div className="friends-search">
                <input
                  type="text"
                  className="profile-input"
                  value={q}
                  placeholder={t('selections.searchPlaceholder')}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            )}

            {shown.length === 0 ? (
              <div className="history-empty">
                <div className="history-empty-icon">♡</div>
                <div className="history-empty-text">{t('selections.emptyText')}</div>
                <div className="history-empty-sub">{t('selections.emptySub')}</div>
              </div>
            ) : visible.length === 0 ? (
              <div className="friends-hint">{t('search.noResults')}</div>
            ) : (
              <>
                <ul className="selections-grid">
                  {visible.map((p) => {
                    return (
                      <li key={p.id} className="amz-card">
                        <FavoriteButton product={p} variant="manage" onChange={reload} />
                        <button
                          type="button"
                          className="amz-card-remove"
                          aria-label={t('selections.remove')}
                          title={t('selections.remove')}
                          onClick={(e) => remove(p.id, e)}
                        >
                          ✕
                        </button>
                        <button type="button" className="amz-card-img" onClick={() => setDetail(p)}>
                          <ProductImage product={p} size="small" />
                        </button>
                        <div className="amz-card-body">
                          <button type="button" className="amz-card-title" onClick={() => setDetail(p)}>
                            {p.brand && p.model ? (
                            <>
                              <span className="amz-card-brand">{p.brand}</span>
                              <span className="amz-card-model">{p.model}</span>
                            </>
                          ) : (
                            <span className="amz-card-model">{[p.brand, p.model].filter(Boolean).join(' ')}</span>
                          )}
                          </button>
                          {p.rating != null && (
                            <div className="amz-card-rating">
                              <Stars rating={p.rating} />
                              {p.reviews != null && (
                                <span className="amz-card-reviews">{p.reviews.toLocaleString(locale)}</span>
                              )}
                            </div>
                          )}
                          {p.price != null && (
                            <div className="amz-card-price"><AmazonPrice price={p.price} /></div>
                          )}
                          <div className="amz-card-added">
                            {t('selections.added', { when: formatRelative(p.addedAt) })}
                          </div>
                          <button type="button" className="amz-buy-btn" onClick={() => setDetail(p)}>
                            {t('product.viewDetails')}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <p className="selections-note">{t('selections.priceNote')}</p>
              </>
            )}
          </>
        )}

        {tab === 'clicked' && (
          !user ? (
            <div className="history-empty">
              <div className="history-empty-icon">🔗</div>
              <div className="history-empty-text">{t('sel.clickedSignedOut')}</div>
            </div>
          ) : clickedLoading || clickedItems == null ? (
            <div className="history-empty">
              <div className="history-empty-text">…</div>
            </div>
          ) : clickedItems.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">🔗</div>
              <div className="history-empty-text">{t('sel.clickedEmptyText')}</div>
              <div className="history-empty-sub">{t('sel.clickedEmptySub')}</div>
            </div>
          ) : (
            <>
              <div className="friends-search">
                <input
                  type="text"
                  className="profile-input"
                  value={qClicked}
                  placeholder={t('selections.searchPlaceholder')}
                  onChange={(e) => setQClicked(e.target.value)}
                />
              </div>
              {visibleClicked.length === 0 ? (
                <div className="friends-hint">{t('search.noResults')}</div>
              ) : (
                <ul className="selections-grid">
                  {visibleClicked.map((p) => (
                    <li key={p.id} className="amz-card">
                      <button
                        type="button"
                        className="amz-card-remove"
                        aria-label={t('sel.clickedRemove')}
                        title={t('sel.clickedRemove')}
                        onClick={(e) => removeClickedItem(p.id, e)}
                      >
                        ✕
                      </button>
                      <button type="button" className="amz-card-img" onClick={() => setDetail(p)}>
                        <ProductImage product={p} size="small" />
                      </button>
                      <div className="amz-card-body">
                        <button type="button" className="amz-card-title" onClick={() => setDetail(p)}>
                          {p.brand && p.model ? (
                            <>
                              <span className="amz-card-brand">{p.brand}</span>
                              <span className="amz-card-model">{p.model}</span>
                            </>
                          ) : (
                            <span className="amz-card-model">{[p.brand, p.model].filter(Boolean).join(' ')}</span>
                          )}
                        </button>
                        {p.rating != null && (
                          <div className="amz-card-rating">
                            <Stars rating={p.rating} />
                            {p.reviews != null && (
                              <span className="amz-card-reviews">{p.reviews.toLocaleString(locale)}</span>
                            )}
                          </div>
                        )}
                        {p.price != null && (
                          <div className="amz-card-price"><AmazonPrice price={p.price} /></div>
                        )}
                        <div className="amz-card-added">
                          {t('selections.added', { when: formatRelative(p.clickedAt) })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        )}

        {tab === 'owned' && (
          ownedItems.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">🛍️</div>
              <div className="history-empty-text">{t('owned.emptyText')}</div>
              <div className="history-empty-sub">{t('owned.emptySub')}</div>
            </div>
          ) : (
            <>
              <div className="friends-search">
                <input
                  type="text"
                  className="profile-input"
                  value={qOwned}
                  placeholder={t('selections.searchPlaceholder')}
                  onChange={(e) => setQOwned(e.target.value)}
                />
              </div>
              {visibleOwned.length === 0 ? (
                <div className="friends-hint">{t('search.noResults')}</div>
              ) : (
                <ul className="selections-grid">
                  {visibleOwned.map((p) => (
                    <li key={p.id} className="amz-card">
                      <button
                        type="button"
                        className="amz-card-remove"
                        aria-label={t('owned.remove')}
                        title={t('owned.remove')}
                        onClick={(e) => removeOwnedItem(p.id, e)}
                      >
                        ✕
                      </button>
                      <button type="button" className="amz-card-img" onClick={() => setDetail(p)}>
                        <ProductImage product={p} size="small" />
                      </button>
                      <div className="amz-card-body">
                        <button type="button" className="amz-card-title" onClick={() => setDetail(p)}>
                          {p.brand && p.model ? (
                            <>
                              <span className="amz-card-brand">{p.brand}</span>
                              <span className="amz-card-model">{p.model}</span>
                            </>
                          ) : (
                            <span className="amz-card-model">{[p.brand, p.model].filter(Boolean).join(' ')}</span>
                          )}
                        </button>
                        {p.price != null && (
                          <div className="amz-card-price"><AmazonPrice price={p.price} /></div>
                        )}
                        <div className="amz-card-added">
                          {t('selections.added', { when: formatRelative(p.addedAt) })}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        )}
        </>
        )}
      </div>
    </div>
  );
}
