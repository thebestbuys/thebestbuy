import { affiliateSearch } from '../data/guides.js';

export default function GuideArticle({ guide, onBack, onStartAdvisor }) {
  if (!guide) return null;

  return (
    <div className="guide-page">
      <div className="guide-topbar">
        <button type="button" className="guide-back" onClick={onBack}>
          <span aria-hidden="true">←</span> Retour
        </button>
        <span className="guide-brand">Bestbuys</span>
      </div>

      <article className="guide-article">
        <header className="guide-header">
          <div className="guide-eyebrow">Guide d'achat · {guide.updated} · {guide.readTime} de lecture</div>
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
          <h2>La checklist à retenir</h2>
          <ul>
            {guide.checklist.map((item, i) => (
              <li key={i}><span className="guide-check" aria-hidden="true">✓</span>{item}</li>
            ))}
          </ul>
        </section>

        <section className="guide-picks">
          <h2>Notre sélection par budget</h2>
          <p className="guide-picks-intro">
            Des pistes pour démarrer vos recherches sur Amazon.fr selon votre budget.
            Les prix et la disponibilité évoluent ; seule la page Amazon fait foi.
          </p>
          <div className="guide-picks-grid">
            {guide.picks.map((p, i) => (
              <a
                key={i}
                className="guide-pick"
                href={affiliateSearch(p.query)}
                target="_blank"
                rel="noopener noreferrer sponsored"
              >
                <div className="guide-pick-budget">{p.budget}</div>
                <div className="guide-pick-note">{p.note}</div>
                <div className="guide-pick-cta">Voir sur Amazon →</div>
              </a>
            ))}
          </div>
        </section>

        <section className="guide-advisor-cta">
          <h2>Besoin d'un conseil personnalisé ?</h2>
          <p>
            Répondez à quelques questions et notre conseiller intelligent
            sélectionne les produits les plus adaptés à vos besoins.
          </p>
          <button type="button" className="btn-primary big" onClick={() => onStartAdvisor(guide.category)}>
            Lancer le conseiller
            <span className="btn-arrow">→</span>
          </button>
        </section>

        <p className="guide-disclosure">
          En tant que Partenaire Amazon, Bestbuys réalise un bénéfice sur les
          achats remplissant les conditions requises.
        </p>
      </article>
    </div>
  );
}
