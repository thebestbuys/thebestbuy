import { affiliateSearch } from '../data/guides.js';
import { useI18n } from '../lib/i18n.jsx';
import LangToggle from './LangToggle.jsx';

export default function GuideArticle({ guide, onBack, onStartAdvisor }) {
  const { t } = useI18n();
  if (!guide) return null;
  const isGift = guide.type === 'gift';

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
          <div className="guide-eyebrow">{t('guide.meta', { updated: guide.updated, time: guide.readTime })}</div>
          <h1 className="guide-title">{guide.title}</h1>
          <p className="guide-subtitle">{guide.subtitle}</p>
        </header>

        <p className="guide-intro">{guide.intro}</p>

        {guide.sections.map((s, i) => (
          <section key={i} className="guide-section">
            <h2>{s.heading}</h2>
            {s.body.map((p, j) => <p key={j}>{p}</p>)}
          </section>
        ))}

        <section className="guide-checklist">
          <h2>{isGift ? t('guide.giftChecklist') : t('guide.checklist')}</h2>
          <ul>
            {guide.checklist.map((item, i) => (
              <li key={i}><span className="guide-check" aria-hidden="true">✓</span>{item}</li>
            ))}
          </ul>
        </section>

        <section className="guide-picks">
          <h2>{isGift ? t('guide.giftPicks') : t('guide.picks')}</h2>
          <p className="guide-picks-intro">{isGift ? t('guide.giftPicksIntro') : t('guide.picksIntro')}</p>
          <div className="guide-picks-grid">
            {guide.picks.map((p, i) => (
              <a
                key={i}
                className="guide-pick"
                href={p.url || affiliateSearch(p.query)}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                <div className="guide-pick-budget">{p.budget}</div>
                {p.name && <div className="guide-pick-name">{p.name}</div>}
                <div className="guide-pick-note">{p.note}</div>
                <div className="guide-pick-cta">{t('guide.pickCta')}</div>
              </a>
            ))}
          </div>
        </section>

        <section className="guide-advisor-cta">
          <h2>{t('guide.advisorTitle')}</h2>
          <p>{t('guide.advisorText')}</p>
          <button type="button" className="btn-primary big" onClick={() => onStartAdvisor(guide.category)}>
            {t('guide.advisorCta')}
            <span className="btn-arrow">→</span>
          </button>
        </section>

        <p className="guide-disclosure">{t('footer.affiliate')}</p>
      </article>
    </div>
  );
}
