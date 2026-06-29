import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import PanelHelpButton from './PanelHelpButton.jsx';
import { PriceTag, ProductImage, ScoreRing, VerifiedBadge, VerifiedRating } from './ProductCard.jsx';
import { listClicked } from '../lib/clicked.js';
import { logLinkClick } from '../lib/cloud.js';
import { listOwned, ownedIdSet, toggleOwned } from '../lib/owned.js';
import { useDismiss } from '../lib/useDismiss.js';

// "Déjà acheté" — full-page, master/detail. Left: the products the user clicked
// on among the advisor's proposals (their detail was opened); right: the
// selected product's detail with a "Je l'ai déjà acheté" toggle. Owned products
// are appended to the `exclude` sent on every recommendation (see App's
// ownedExclude) so the advisor stops proposing them. Owned marks sync via
// owned.js; the clicked list is local (clicked.js).
export default function OwnedPanel({ open, onClose }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const { closing, close } = useDismiss(onClose);
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const [ownedSet, setOwnedSet] = useState(() => new Set());
  const [clicked, setClicked] = useState([]);
  const [ownedExtra, setOwnedExtra] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!open) return;
    setOwnedSet(ownedIdSet(user?.sub));
    setClicked(listClicked(user?.sub));
    setOwnedExtra(listOwned(user?.sub));
    setQ('');
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // List = clicked products (most-recent first), plus any owned product not in
  // that list (e.g. synced from another device) so it stays visible / un-markable.
  const items = useMemo(() => {
    if (!open) return [];
    const seen = new Set();
    const out = [];
    for (const p of clicked) {
      if (p?.id != null && !seen.has(p.id)) { seen.add(p.id); out.push(p); }
    }
    for (const p of ownedExtra) {
      if (p?.id != null && !seen.has(p.id)) { seen.add(p.id); out.push(p); }
    }
    return out;
  }, [open, clicked, ownedExtra]);

  // Auto-select the first item (and keep a valid selection as the list changes).
  useEffect(() => {
    if (!open || !items.length) return;
    if (activeId == null || !items.some((p) => p.id === activeId)) {
      setActiveId(items[0].id);
    }
  }, [open, items, activeId]);

  if (!open) return null;

  const active = items.find((p) => p.id === activeId) || null;

  // Filter the left list by brand/model (same logic as SelectionsPanel). The
  // selection stays valid even if the active product is filtered out of view.
  const term = q.trim().toLowerCase();
  const visible = term
    ? items.filter((p) =>
        [p.brand, p.model].filter(Boolean).some((s) => String(s).toLowerCase().includes(term)),
      )
    : items;

  const toggle = (p) => {
    const nowOwned = toggleOwned(user?.sub, p);
    setOwnedSet((prev) => {
      const next = new Set(prev);
      if (nowOwned) next.add(p.id);
      else next.delete(p.id);
      return next;
    });
    setOwnedExtra(listOwned(user?.sub));
  };

  return (
    <div className={'owned-page' + (closing ? ' is-closing' : '')} role="dialog" aria-modal="true" aria-labelledby="owned-title">
      <header className="owned-page-head">
        <div>
          <h2 id="owned-title" className="owned-page-title">{t('owned.title')}</h2>
          <p className="owned-page-sub">{t('owned.sub')}</p>
        </div>
        <button type="button" className="owned-page-close" onClick={close} aria-label={t('auth.close')}>✕</button>
      </header>

      <div className="owned-help-row"><PanelHelpButton /></div>

      {items.length === 0 ? (
        <div className="owned-empty">
          <div className="owned-empty-icon">🛍️</div>
          <div className="owned-empty-text">{t('owned.emptyText')}</div>
          <div className="owned-empty-sub">{t('owned.emptySub')}</div>
        </div>
      ) : (
        <div className="owned-layout">
          <aside className="owned-listcol">
            <div className="friends-search">
              <input
                type="text"
                className="profile-input"
                value={q}
                placeholder={t('owned.searchPlaceholder')}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {visible.length === 0 ? (
              <div className="friends-hint">{t('search.noResults')}</div>
            ) : (
            <ul className="owned-list">
              {visible.map((p) => {
                const isOwned = ownedSet.has(p.id);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={
                        'owned-row' +
                        (p.id === activeId ? ' is-active' : '') +
                        (isOwned ? ' is-owned' : '')
                      }
                      onClick={() => setActiveId(p.id)}
                    >
                      <span className="owned-thumb">
                        <ProductImage product={p} size="small" />
                      </span>
                      <span className="owned-row-info">
                        <span className="owned-row-name">{[p.brand, p.model].filter(Boolean).join(' ')}</span>
                        <span className="owned-row-price">
                          <PriceTag product={p} locale={locale} t={t} variant="small" />
                        </span>
                      </span>
                      {isOwned && (
                        <span className="owned-row-check" title={t('owned.marked')}>
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M2 8.5 6 12l8-8.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            )}
          </aside>

          <section className="owned-detailcol">
            {active ? (
              <OwnedDetail
                product={active}
                owned={ownedSet.has(active.id)}
                onToggle={() => toggle(active)}
                locale={locale}
                t={t}
              />
            ) : (
              <div className="owned-detail-empty">{t('owned.selectPrompt')}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function OwnedDetail({ product, owned, onToggle, locale, t }) {
  const hasImage = product.amazon_verified && !!product.image_url;
  const amazonUrl =
    product.amazon_url ||
    `https://www.amazon.fr/s?k=${encodeURIComponent(`${product.brand} ${product.model}`)}&tag=oraklia123-21`;
  return (
    <div className={'owned-detail' + (hasImage ? '' : ' no-image')}>
      {hasImage && (
        <div className="owned-detail-img">
          <ProductImage product={product} size="modal" />
        </div>
      )}
      <div className="owned-detail-body">
        <div className="owned-detail-brandrow">
          <span className="owned-detail-brand">{product.brand}</span>
          <VerifiedBadge product={product} />
        </div>
        <h3 className="owned-detail-model">{product.model}</h3>
        {product.amazon_verified && product.rating != null && (
          <VerifiedRating product={product} locale={locale} />
        )}
        {product.score != null && (
          <div className="owned-detail-score">
            <ScoreRing score={product.score} size={52} />
            <span>{t('product.matchPct', { score: product.score })}</span>
          </div>
        )}
        {product.why && (
          <>
            <div className="owned-detail-h">{t('product.why')}</div>
            <p className="owned-detail-why">{product.why}</p>
          </>
        )}
        {Array.isArray(product.specs) && product.specs.length > 0 && (
          <>
            <div className="owned-detail-h">{t('product.features')}</div>
            <ul className="owned-detail-specs">
              {product.specs.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </>
        )}
        <div className="owned-detail-price">
          <span className="owned-detail-price-label">
            {product.amazon_verified ? t('product.price') : t('product.priceEstimate')}
          </span>
          <PriceTag product={product} locale={locale} t={t} variant="hero" />
        </div>
        <div className="owned-detail-actions">
          <button
            type="button"
            className={'owned-toggle big' + (owned ? ' on' : '')}
            onClick={onToggle}
            aria-pressed={owned}
          >
            {owned ? (
              <>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 8.5 6 12l8-8.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t('owned.marked')}
              </>
            ) : (
              t('owned.mark')
            )}
          </button>
          <a
            className="owned-detail-amazon"
            href={amazonUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => logLinkClick(product).catch(() => {})}
          >
            {t('product.viewAmazon')}
          </a>
        </div>
      </div>
    </div>
  );
}
