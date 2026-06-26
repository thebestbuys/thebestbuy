import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { PriceTag, ProductImage, VerifiedBadge } from './ProductCard.jsx';
import { listConversations } from '../lib/history.js';
import { listOwned, ownedIdSet, toggleOwned } from '../lib/owned.js';

// "Déjà acheté" — among the products the advisor has proposed (gathered from the
// user's conversation history), let them mark the ones they already own. Marked
// products are added to the `exclude` sent on every recommendation (see App's
// ownedExclude) so the advisor stops proposing them, and are filtered from
// on-screen results. Cloud-synced via owned.js.
export default function OwnedPanel({ open, onClose }) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';
  const [ownedSet, setOwnedSet] = useState(() => new Set());
  // Snapshots of owned products that are NOT in the proposal history (e.g.
  // synced from another device), so the user can still see & un-mark them.
  const [ownedExtra, setOwnedExtra] = useState([]);

  useEffect(() => {
    if (!open) return;
    setOwnedSet(ownedIdSet(user?.sub));
    setOwnedExtra(listOwned(user?.sub));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.sub]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // All products the user has been proposed, most-recent first, deduped by id
  // (conversations are stored newest-first, so the first sighting wins). Owned
  // products with no matching proposal are appended so they remain manageable.
  const proposals = useMemo(() => {
    if (!open) return [];
    const seen = new Set();
    const out = [];
    for (const c of listConversations(user?.sub)) {
      for (const p of c.recommendedProducts || []) {
        if (!p || p.id == null || seen.has(p.id)) continue;
        seen.add(p.id);
        out.push(p);
      }
    }
    for (const p of ownedExtra) {
      if (p?.id != null && !seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    return out;
  }, [open, user?.sub, ownedExtra]);

  if (!open) return null;

  const toggle = (p) => {
    const nowOwned = toggleOwned(user?.sub, p);
    setOwnedSet((prev) => {
      const next = new Set(prev);
      if (nowOwned) next.add(p.id);
      else next.delete(p.id);
      return next;
    });
  };

  const ownedCount = proposals.filter((p) => ownedSet.has(p.id)).length;

  return (
    <div className="auth-modal-bg" onClick={onClose}>
      <div
        className="history-panel owned-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="owned-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="history-head">
          <div>
            <h2 id="owned-title" className="history-title">{t('owned.title')}</h2>
            <p className="history-sub">{t('owned.sub')}</p>
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>
        </header>

        {proposals.length === 0 ? (
          <div className="history-empty">
            <div className="history-empty-icon">🛍️</div>
            <div className="history-empty-text">{t('owned.emptyText')}</div>
            <div className="history-empty-sub">{t('owned.emptySub')}</div>
          </div>
        ) : (
          <>
            {ownedCount > 0 && (
              <p className="owned-count">{t('owned.count', { n: ownedCount })}</p>
            )}
            <ul className="owned-list">
              {proposals.map((p) => {
                const owned = ownedSet.has(p.id);
                return (
                  <li key={p.id} className={'owned-row' + (owned ? ' is-owned' : '')}>
                    <span className="owned-thumb">
                      <ProductImage product={p} size="small" />
                    </span>
                    <span className="owned-info">
                      <span className="owned-name">
                        {[p.brand, p.model].filter(Boolean).join(' ')}
                        <VerifiedBadge product={p} compact />
                      </span>
                      <span className="owned-price">
                        <PriceTag product={p} locale={locale} t={t} variant="small" />
                      </span>
                    </span>
                    <button
                      type="button"
                      className={'owned-toggle' + (owned ? ' on' : '')}
                      onClick={() => toggle(p)}
                      aria-pressed={owned}
                    >
                      {owned ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M2 8.5 6 12l8-8.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {t('owned.marked')}
                        </>
                      ) : (
                        t('owned.mark')
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
