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

export default function GiftLanding({ onStartDiscover, onBack, onOpenGuide, onOpenGiftHub }) {
  const { t, lang } = useI18n();
  const guides = giftGuides().map((g) => localizeGuide(g, lang));

  return (
    <div className="guide-page gift-landing">
      <div className="guide-topbar">
        <button type="button" className="guide-back" onClick={onBack}>
          <span aria-hidden="true">←</span> {t('guide.back')}
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
        <div className="gl-insp-head">
          <h2 className="gl-section-title">{t('cadeau.inspiration')}</h2>
          <p className="gl-insp-sub">{t('cadeau.inspirationSub')}</p>
        </div>
        <div className="home-guides-grid">
          {guides.map((g) => (
            <a
              key={g.slug}
              className="guide-card"
              href={'/guide/' + g.slug}
              onClick={(e) => { e.preventDefault(); onOpenGuide(g.slug); }}
            >
              <div className="guide-card-eyebrow">{t('guides.cardEyebrow', { time: g.readTime })}</div>
              <h3 className="guide-card-title">{g.title}</h3>
              <p className="guide-card-sub">{g.subtitle}</p>
              <span className="guide-card-link">{t('guides.read')}</span>
            </a>
          ))}
        </div>
        <a
          className="gl-hub-link"
          href="/idees-cadeaux"
          onClick={(e) => { e.preventDefault(); onOpenGiftHub(); }}
        >
          {t('cadeau.browseGuides')}
        </a>
      </section>
    </div>
  );
}
