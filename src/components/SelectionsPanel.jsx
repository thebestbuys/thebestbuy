import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { ProductImage } from './ProductCard.jsx';
import { formatRelative } from '../lib/history.js';
import { listSelections, removeSelection } from '../lib/selections.js';

// Mirror of HistoryPanel, for saved products. Reads fresh on open.
export default function SelectionsPanel({ open, onClose, getAmazonUrl, onBuy }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open) setItems(listSelections(user?.sub));
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
            <ul className="selections-list">
              {items.map((p) => {
                const catLabel = ['phone', 'laptop', 'headphones'].includes(p.category)
                  ? t('cat.' + p.category)
                  : p.category;
                const url = getAmazonUrl ? getAmazonUrl(p) : p.amazon_url;
                return (
                  <li key={p.id} className="selection-item">
                    <div className="selection-thumb">
                      <ProductImage product={p} size="small" />
                    </div>
                    <div className="selection-info">
                      <div className="selection-brand">{p.brand}</div>
                      <div className="selection-model">{p.model}</div>
                      <div className="selection-meta">
                        {catLabel && (
                          <span className="history-item-cat">{catLabel}</span>
                        )}
                        {p.score != null && (
                          <span className="selection-score">
                            {t('product.matchPct', { score: p.score })}
                          </span>
                        )}
                        <span>{t('selections.added', { when: formatRelative(p.addedAt) })}</span>
                      </div>
                    </div>
                    <div className="selection-actions">
                      {p.price != null && (
                        <div className="selection-price">
                          {p.price.toLocaleString(locale)} €
                        </div>
                      )}
                      <a
                        className="btn-primary small"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        onClick={() => onBuy?.(p)}
                      >
                        {t('product.viewAmazon')}
                      </a>
                      <button
                        type="button"
                        className="history-item-del selection-del"
                        aria-label={t('selections.remove')}
                        title={t('selections.remove')}
                        onClick={(e) => remove(p.id, e)}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M3 5h8m-6.5 0V3.5h5V5M5 7v4m4-4v4M4 5l.5 7h5L10 5"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
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
