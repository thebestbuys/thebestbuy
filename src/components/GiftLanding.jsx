import { useI18n } from '../lib/i18n.jsx';
import { giftGuides, localizeGuide } from '../data/guides.js';

// Gift-first landing at /cadeau. A focused entry point for gift intent: a hero
// CTA + quick-start chips (by occasion / by recipient) that pre-fill and open the
// existing GiftPanel, plus an inspiration section reusing the gift guides. All
// the heavy lifting (form, advisor, Amazon verification) is the existing gift
// pipeline — this page just shortcuts into it. Prerendered for SEO by
// scripts/prerender.mjs (mirrored markup).

// Curated, gift-relevant occasions (reuse the gift.occ.* i18n keys).
const OCCASIONS = [
  { k: 'birthday', e: '🎂' },
  { k: 'christmas', e: '🎄' },
  { k: 'valentine', e: '❤️' },
  { k: 'wedding', e: '💍' },
  { k: 'newBaby', e: '👶' },
  { k: 'housewarming', e: '🏡' },
  { k: 'thankYou', e: '🙏' },
];

// Recipients (reuse the gift.rel.* i18n keys).
const RECIPIENTS = [
  { k: 'partner', e: '❤️' },
  { k: 'parent', e: '👪' },
  { k: 'child', e: '🧒' },
  { k: 'sibling', e: '🧑‍🤝‍🧑' },
  { k: 'friend', e: '🙌' },
  { k: 'colleague', e: '💼' },
];

export default function GiftLanding({ onBack, onStartGift, onOpenGuide, onOpenGiftHub }) {
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
        <button type="button" className="btn-primary big gl-cta" onClick={() => onStartGift(null)}>
          {t('gift.title')}
          <span className="btn-arrow">→</span>
        </button>
      </div>

      <section className="gl-section">
        <h2 className="gl-section-title">{t('cadeau.byOccasion')}</h2>
        <div className="gl-chips">
          {OCCASIONS.map((o) => (
            <button
              key={o.k}
              type="button"
              className="gl-chip"
              onClick={() => onStartGift({ occasion: t('gift.occ.' + o.k) })}
            >
              <span className="gl-chip-emoji" aria-hidden="true">{o.e}</span>
              {t('gift.occ.' + o.k)}
            </button>
          ))}
        </div>
      </section>

      <section className="gl-section">
        <h2 className="gl-section-title">{t('cadeau.byRecipient')}</h2>
        <div className="gl-chips">
          {RECIPIENTS.map((r) => (
            <button
              key={r.k}
              type="button"
              className="gl-chip"
              onClick={() => onStartGift({ relationship: t('gift.rel.' + r.k) })}
            >
              <span className="gl-chip-emoji" aria-hidden="true">{r.e}</span>
              {t('gift.rel.' + r.k)}
            </button>
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
