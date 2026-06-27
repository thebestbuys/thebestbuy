import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { AmazonPrice, ProductImage, Stars } from './ProductCard.jsx';
import { formatRelative } from '../lib/history.js';
import {
  getSelectionsRevision,
  listSelections,
  removeSelection,
  removeListFromAll,
} from '../lib/selections.js';
import { listLists, getListsRevision, updateList, deleteList } from '../lib/lists.js';
import { buildShareUrl } from '../lib/gift.js';
import FavoriteButton from './FavoriteButton.jsx';

// Saved products, organized into named lists (private/public).
export default function SelectionsPanel({ open, onClose, getAmazonUrl, onBuy }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const [items, setItems] = useState([]);
  const [lists, setLists] = useState([]);
  const [active, setActive] = useState('all'); // 'all' | listId | 'unfiled'
  const [shared, setShared] = useState(false);
  const loadedSig = useRef(null);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
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

  const remove = (id, e) => {
    e.stopPropagation();
    removeSelection(user?.sub, id);
    reload();
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
    <div className="sheet-page selections-panel" role="dialog" aria-modal="true" aria-labelledby="selections-title">
        <header className="sheet-head">
          <div>
            <h2 id="selections-title" className="history-title">{t('selections.title')}</h2>
            <p className="history-sub">
              {user ? t('selections.subUser') : t('selections.subGuest')}
            </p>
          </div>
          <div className="selections-head-actions">
            {shown.length > 0 && (
              <button type="button" className="selections-share-btn" onClick={shareList}>
                <span aria-hidden="true">🔗</span>
                {shared ? t('selections.shareCopied') : t('selections.share')}
              </button>
            )}
            <button className="sheet-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
          </div>
        </header>
        <div className="sheet-body">

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
            <button type="button" className="sel-manage-btn" onClick={onRenameList}>
              {t('lists.rename')}
            </button>
            <button type="button" className="sel-manage-btn danger" onClick={onDeleteList}>
              {t('lists.delete')}
            </button>
          </div>
        )}

        {shown.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">♡</div>
            <div className="history-empty-text">{t('selections.emptyText')}</div>
            <div className="history-empty-sub">{t('selections.emptySub')}</div>
          </div>
        ) : (
          <>
            <ul className="selections-grid">
              {shown.map((p) => {
                const url = getAmazonUrl ? getAmazonUrl(p) : p.amazon_url;
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
                    <a className="amz-card-img" href={url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => onBuy?.(p)}>
                      <ProductImage product={p} size="small" />
                    </a>
                    <div className="amz-card-body">
                      <a className="amz-card-title" href={url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => onBuy?.(p)}>
                        {[p.brand, p.model].filter(Boolean).join(' ')}
                      </a>
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
                      <a className="amz-buy-btn" href={url} target="_blank" rel="noopener noreferrer sponsored" onClick={() => onBuy?.(p)}>
                        {t('product.viewAmazon')}
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="selections-note">{t('selections.priceNote')}</p>
          </>
        )}
      </div>
    </div>
  );
}
