import { useEffect } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { GUIDES, localizeGuide } from '../data/guides.js';

// Overlay listing the buying guides — moved off the home so the home stays
// uncluttered (reachable from the left rail). Reuses the existing guide-card
// styles. Selecting a card opens the full article through the parent
// (onOpenGuide), mirroring HistoryPanel's "action then onClose()" pattern so the
// browser Back button stays consistent.
export default function GuidesPanel({ open, onClose, onOpenGuide }) {
  const { t, lang } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="auth-modal-bg" onClick={onClose}>
      <div
        className="side-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guides-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="history-head">
          <div>
            <h2 id="guides-panel-title" className="history-title">
              {t('guides.sectionTitle')}
            </h2>
            <p className="history-sub">{t('guides.sectionSub')}</p>
          </div>
          <button className="auth-modal-close" onClick={onClose} aria-label={t('auth.close')}>
            ✕
          </button>
        </header>

        <div className="home-guides-grid">
          {GUIDES.map((g) => {
            const lg = localizeGuide(g, lang);
            return (
              <button
                key={g.slug}
                type="button"
                className="guide-card"
                onClick={() => {
                  onOpenGuide(g.slug);
                  onClose();
                }}
              >
                <div className="guide-card-eyebrow">{t('guides.cardEyebrow', { time: lg.readTime })}</div>
                <h3 className="guide-card-title">{lg.title}</h3>
                <p className="guide-card-sub">{lg.subtitle}</p>
                <span className="guide-card-link">{t('guides.read')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
