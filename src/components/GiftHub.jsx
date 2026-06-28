import { giftGuides, localizeGuide } from '../data/guides.js';
import { useI18n } from '../lib/i18n.jsx';
import LangToggle from './LangToggle.jsx';

// Full-page "Idées cadeaux" hub at /idees-cadeaux. Lists the gift-type guides
// as cards (reusing the guide-card styles) with an SEO-oriented intro, so the
// broad "idées cadeaux" query has a real landing page that links to each
// specific gift guide. Mirrored as static HTML by scripts/prerender.mjs.
export default function GiftHub({ onBack, onOpenGuide, onStartAdvisor }) {
  const { t, lang } = useI18n();
  const guides = giftGuides();

  return (
    <div className="guide-page">
      <div className="guide-topbar">
        <button type="button" className="guide-back" onClick={onBack}>
          <span aria-hidden="true">←</span> {t('guide.back')}
        </button>
        <div className="guide-topbar-right">
          <LangToggle />
          <span className="guide-brand">Oraklia</span>
        </div>
      </div>

      <article className="guide-article">
        <header className="guide-header">
          <div className="guide-eyebrow">{t('giftHub.eyebrow')}</div>
          <h1 className="guide-title">{t('giftHub.title')}</h1>
          <p className="guide-subtitle">{t('giftHub.subtitle')}</p>
        </header>

        <p className="guide-intro">{t('giftHub.intro')}</p>

        <div className="home-guides-grid">
          {guides.map((g) => {
            const lg = localizeGuide(g, lang);
            return (
              <button
                key={g.slug}
                type="button"
                className="guide-card"
                onClick={() => onOpenGuide(g.slug)}
              >
                <div className="guide-card-eyebrow">{t('giftHub.cardEyebrow', { time: lg.readTime })}</div>
                <h2 className="guide-card-title">{lg.title}</h2>
                <p className="guide-card-sub">{lg.subtitle}</p>
                <span className="guide-card-link">{t('guides.read')}</span>
              </button>
            );
          })}
        </div>

        {onStartAdvisor && (
          <section className="guide-advisor-cta">
            <h2>{t('guide.advisorTitle')}</h2>
            <p>{t('guide.advisorText')}</p>
            <button type="button" className="btn-primary big" onClick={onStartAdvisor}>
              {t('giftHub.advisorCta')}
              <span className="btn-arrow">→</span>
            </button>
          </section>
        )}

        <p className="guide-disclosure">{t('footer.affiliate')}</p>
      </article>
    </div>
  );
}
