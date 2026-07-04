import { useState } from 'react';
import { useI18n } from '../lib/i18n.jsx';
import { giftGuides, localizeGuide } from '../data/guides.js';

// Gift-first landing at /cadeau. The default action is a chat-driven gift finder:
// the central "Trouver un cadeau" CTA starts the advisor in DISCOVERY mode, where
// the chat itself asks who the gift is for, their age, gender, interests… Below
// the CTA a short "how it works" guide sets expectations, then an inspiration
// section reuses the gift guides. Prerendered for SEO by scripts/prerender.mjs
// (mirrored markup — keep the two in sync).

// Three-step explainer shown under the CTA (reuse cadeau.step* i18n keys).
const STEPS = [
  { k: '1', e: '💬' },
  { k: '2', e: '🧠' },
  { k: '3', e: '🎁' },
];

export default function GiftLanding({ onStartDiscover, onHome, onOpenGuide, onOpenGiftHub }) {
  const { t, lang } = useI18n();
  const guides = giftGuides().map((g) => localizeGuide(g, lang));
  // Inspiration is collapsed by default to keep the page compact — the CTA is
  // the focus; guides are a "peek if you want" secondary path.
  const [inspOpen, setInspOpen] = useState(false);

  return (
    <div className="guide-page gift-landing">
      <div className="guide-topbar">
        <button type="button" className="guide-back guide-home" onClick={onHome} aria-label={t('cadeau.home')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 11.5 12 4l9 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.5 10v9.5h13V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t('cadeau.home')}
        </button>
        <div className="guide-topbar-right">
          <span className="guide-brand">Oraklia</span>
        </div>
      </div>

      <div className="gl-hero">
        <div className="gl-eyebrow">🎁 {t('cadeau.eyebrow')}</div>
        <h1 className="gl-title">{t('cadeau.title')}</h1>
        <p className="gl-sub">{t('cadeau.sub')}</p>
        <button type="button" className="btn-primary big gl-cta" onClick={onStartDiscover}>
          {t('gift.title')}
          <span className="btn-arrow">→</span>
        </button>
      </div>

      <section className="gl-how">
        <h2 className="gl-section-title">{t('cadeau.how')}</h2>
        <div className="gl-steps">
          {STEPS.map((s) => (
            <div key={s.k} className="gl-step">
              <span className="gl-step-emoji" aria-hidden="true">{s.e}</span>
              <div className="gl-step-body">
                <h3 className="gl-step-title">{t('cadeau.step' + s.k)}</h3>
                <p className="gl-step-sub">{t('cadeau.step' + s.k + 'sub')}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="gl-inspiration">
        <button
          type="button"
          className={'gl-insp-link' + (inspOpen ? ' is-open' : '')}
          aria-expanded={inspOpen}
          onClick={() => setInspOpen((v) => !v)}
        >
          {t('cadeau.inspiration')}
          <span className="gl-insp-caret" aria-hidden="true">⌄</span>
        </button>
        {inspOpen && (
          <div className="gl-insp-panel">
            <ul className="gl-insp-list">
              {guides.map((g) => (
                <li key={g.slug}>
                  <a
                    className="gl-insp-item"
                    href={'/guide/' + g.slug}
                    onClick={(e) => { e.preventDefault(); onOpenGuide(g.slug); }}
                  >
                    <span className="gl-insp-item-label">{g.title}</span>
                    <span className="gl-insp-item-arrow" aria-hidden="true">→</span>
                  </a>
                </li>
              ))}
            </ul>
            <a
              className="gl-hub-link"
              href="/idees-cadeaux"
              onClick={(e) => { e.preventDefault(); onOpenGiftHub(); }}
            >
              {t('cadeau.browseGuides')}
            </a>
          </div>
        )}
      </section>
    </div>
  );
}
