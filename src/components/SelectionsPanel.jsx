import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { AmazonPrice, ProductImage, Stars } from './ProductCard.jsx';
import { formatRelative } from '../lib/history.js';
import {
  getSelectionsRevision,
  listSelections,
  removeSelection,
} from '../lib/selections.js';
import { encodeGiftShare } from '../lib/gift.js';

// Mirror of HistoryPanel, for saved products. Reads fresh on open.
export default function SelectionsPanel({ open, onClose, getAmazonUrl, onBuy }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const [items, setItems] = useState([]);
  const [shared, setShared] = useState(false);
  // Signature of the data currently held in `items` (user + store revision).
  // We only reload when it changes, so reopening with no edits is a no-op.
  const loadedSig = useRef(null);

  useEffect(() => {
    if (!open) return;
    const sig = `${user?.sub || '_anon'}:${getSelectionsRevision(user?.sub)}`;
    if (sig === loadedSig.current) return;
    setItems(listSelections(user?.sub));
    loadedSig.current = sig;
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const remove = (id, e) => {
    e.stopPropagation();
    removeSelection(user?.sub, id);
    setItems((cur) => cur.filter((p) => p.id !== id));
    // Stay in sync with the bump removeSelection just made, so reopening
    // doesn't see a "changed" revision and reload.
    loadedSig.current = `${user?.sub || '_anon'}:${getSelectionsRevision(user?.sub)}`;
  };

  // Share the wishlist as a self-contained ?share=… link (reuses the read-only
  // SharedGiftList view, in wishlist mode).
  const shareList = async () => {
    const shareItems = items.slice(0, 20).map((p) => ({
      b: p.brand,
      m: p.model,
      p: p.price ?? null,
      u: getAmazonUrl ? getAmazonUrl(p) : p.amazon_url,
      i: p.image_url || null,
      s: p.score ?? null,
    }));
    if (!shareItems.length) return;
    const payload = { k: 'wish', r: user?.name || '', items: shareItems };
    const url = `${window.location.origin}${window.location.pathname}?share=${encodeGiftShare(payload)}`;
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
    <div className="auth-modal-bg" onClick={onClose}>
      <div
        className="history-panel selections-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="selections-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="history-head">
          <div>
            <h2 id="selections-title" className="history-title">
              {t('selections.title')}
            </h2>
            <p className="history-sub">
              {user ? t('selections.subUser') : t('selections.subGuest')}
            </p>
          </div>
          <div className="selections-head-actions">
            {items.length > 0 && (
              <button type="button" className="selections-share-btn" onClick={shareList}>
                <span aria-hidden="true">🔗</span>
                {shared ? t('selections.shareCopied') : t('selections.share')}
              </button>
            )}
            <button
              className="auth-modal-close"
              onClick={onClose}
              aria-label={t('auth.close')}
            >
              ✕
            </button>
          </div>
        </header>

        {items.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">♡</div>
            <div className="history-empty-text">{t('selections.emptyText')}</div>
            <div className="history-empty-sub">{t('selections.emptySub')}</div>
          </div>
        ) : (
          <>
            <ul className="selections-grid">
              {items.map((p) => {
                const url = getAmazonUrl ? getAmazonUrl(p) : p.amazon_url;
                return (
                  <li key={p.id} className="amz-card">
                    <button
                      type="button"
                      className="amz-card-remove"
                      aria-label={t('selections.remove')}
                      title={t('selections.remove')}
                      onClick={(e) => remove(p.id, e)}
                    >
                      ✕
                    </button>
                    <a
                      className="amz-card-img"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      onClick={() => onBuy?.(p)}
                    >
                      <ProductImage product={p} size="small" />
                    </a>
                    <div className="amz-card-body">
                      <a
                        className="amz-card-title"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        onClick={() => onBuy?.(p)}
                      >
                        {[p.brand, p.model].filter(Boolean).join(' ')}
                      </a>
                      {p.rating != null && (
                        <div className="amz-card-rating">
                          <Stars rating={p.rating} />
                          {p.reviews != null && (
                            <span className="amz-card-reviews">
                              {p.reviews.toLocaleString(locale)}
                            </span>
                          )}
                        </div>
                      )}
                      {p.price != null && (
                        <div className="amz-card-price">
                          <AmazonPrice price={p.price} />
                        </div>
                      )}
                      <div className="amz-card-added">
                        {t('selections.added', { when: formatRelative(p.addedAt) })}
                      </div>
                      <a
                        className="amz-buy-btn"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        onClick={() => onBuy?.(p)}
                      >
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
