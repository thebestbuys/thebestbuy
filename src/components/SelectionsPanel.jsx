import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { ProductImage, Stars } from './ProductCard.jsx';
import { formatRelative } from '../lib/history.js';
import {
  getSelectionsRevision,
  listSelections,
  removeSelection,
} from '../lib/selections.js';

// Mirror of HistoryPanel, for saved products. Reads fresh on open.
export default function SelectionsPanel({ open, onClose, getAmazonUrl, onBuy }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const [items, setItems] = useState([]);
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

  // Amazon-style price: large integer part, superscript cents, then €.
  const splitPrice = (price) => {
    const whole = Math.floor(price);
    const frac = Math.round((price - whole) * 100);
    return { whole: whole.toLocaleString(locale), frac: String(frac).padStart(2, '0') };
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
          <button
            className="auth-modal-close"
            onClick={onClose}
            aria-label={t('auth.close')}
          >
            ✕
          </button>
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
                const price = p.price != null ? splitPrice(p.price) : null;
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
                      {price && (
                        <div className="amz-card-price">
                          <span className="amz-price-whole">{price.whole}</span>
                          <span className="amz-price-frac">{price.frac}</span>
                          <span className="amz-price-cur">€</span>
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
