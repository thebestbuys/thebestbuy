// ─────────────────────────────────────────────────────────────────────────
// Mentions légales — édite les valeurs ci-dessous avec tes informations réelles.
// Les champs marqués « À COMPLÉTER » sont obligatoires pour la conformité
// légale française et pour la validation du programme Partenaires Amazon.
// ─────────────────────────────────────────────────────────────────────────
const LEGAL = {
  siteName: 'Bestbuys',
  siteUrl: 'https://thebestbuy.vercel.app',

  // Éditeur du site
  editorName: 'Corentin Gaillard',
  editorStatus: 'À COMPLÉTER : entrepreneur individuel / auto-entrepreneur / SARL…',
  editorAddress: 'À COMPLÉTER : adresse postale complète',
  editorSiret: 'À COMPLÉTER : numéro SIRET (si activité déclarée)',
  editorEmail: 'darknortar@gmail.com',
  editorPhone: 'À COMPLÉTER : numéro de téléphone (facultatif)',
  publicationDirector: 'Corentin Gaillard',

  // Hébergeur
  hostName: 'Vercel Inc.',
  hostAddress: '340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis',
  hostUrl: 'https://vercel.com',
};

function Row({ label, value }) {
  return (
    <p className="legal-row">
      <span className="legal-row-label">{label}</span>
      <span className="legal-row-value">{value}</span>
    </p>
  );
}

export default function LegalNotices({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal legal-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>

        <div className="legal-content">
          <h1 className="legal-title">Mentions légales</h1>
          <p className="legal-intro">
            Conformément aux dispositions des articles 6-III et 19 de la loi
            n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie
            numérique (LCEN), il est porté à la connaissance des utilisateurs du
            site {LEGAL.siteName} les présentes mentions légales.
          </p>

          <section className="legal-section">
            <h2>Éditeur du site</h2>
            <Row label="Nom" value={LEGAL.editorName} />
            <Row label="Statut" value={LEGAL.editorStatus} />
            <Row label="Adresse" value={LEGAL.editorAddress} />
            <Row label="SIRET" value={LEGAL.editorSiret} />
            <Row label="E-mail" value={LEGAL.editorEmail} />
            <Row label="Téléphone" value={LEGAL.editorPhone} />
            <Row label="Directeur de la publication" value={LEGAL.publicationDirector} />
          </section>

          <section className="legal-section">
            <h2>Hébergement</h2>
            <Row label="Hébergeur" value={LEGAL.hostName} />
            <Row label="Adresse" value={LEGAL.hostAddress} />
            <Row
              label="Site web"
              value={
                <a href={LEGAL.hostUrl} target="_blank" rel="noopener noreferrer">
                  {LEGAL.hostUrl}
                </a>
              }
            />
          </section>

          <section className="legal-section">
            <h2>Programme Partenaires d'Amazon</h2>
            <p>
              En tant que Partenaire Amazon, {LEGAL.siteName} réalise un bénéfice
              sur les achats remplissant les conditions requises. Le site
              {' '}{LEGAL.siteName} participe au Programme Partenaires d'Amazon EU,
              un programme d'affiliation conçu pour permettre à des sites de
              percevoir une rémunération grâce à la création de liens vers
              Amazon.fr. Les prix et la disponibilité des produits affichés sont
              donnés à titre indicatif et sont susceptibles d'évoluer ; seules
              les informations présentes sur Amazon.fr au moment de l'achat font
              foi.
            </p>
          </section>

          <section className="legal-section">
            <h2>Propriété intellectuelle</h2>
            <p>
              L'ensemble des éléments composant le site {LEGAL.siteName}
              {' '}(textes, mise en page, charte graphique, logo) est la propriété
              exclusive de l'éditeur, sauf mention contraire. Les marques, noms
              de produits et visuels appartiennent à leurs propriétaires
              respectifs. Toute reproduction, représentation ou diffusion, totale
              ou partielle, sans autorisation préalable est interdite et
              constituerait une contrefaçon.
            </p>
          </section>

          <section className="legal-section">
            <h2>Données personnelles</h2>
            <p>
              {LEGAL.siteName} ne collecte que les données strictement
              nécessaires au fonctionnement du service (notamment lors de la
              connexion à un compte). Conformément au Règlement Général sur la
              Protection des Données (RGPD) et à la loi « Informatique et
              Libertés », vous disposez d'un droit d'accès, de rectification et de
              suppression de vos données. Pour exercer ce droit, contactez-nous à
              l'adresse {LEGAL.editorEmail}.
            </p>
          </section>

          <section className="legal-section">
            <h2>Cookies</h2>
            <p>
              Le site peut déposer des cookies techniques nécessaires à son bon
              fonctionnement. Les liens vers Amazon.fr peuvent déposer des cookies
              d'affiliation permettant d'attribuer la source du trafic. Vous
              pouvez configurer votre navigateur pour refuser les cookies.
            </p>
          </section>

          <p className="legal-footer-note">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
              year: 'numeric', month: 'long',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
