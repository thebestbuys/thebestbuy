import { useI18n } from '../lib/i18n.jsx';

// ─────────────────────────────────────────────────────────────────────────
// Données légales de l'éditeur (identiques dans les deux langues).
// ─────────────────────────────────────────────────────────────────────────
const LEGAL = {
  siteName: 'Oraklia',
  editorName: 'NCLS CREATION (Oraklia) — SARL au capital de 1 000 €',
  editorAddress: '42 Bd du chemin de fer, 68290 Masevaux, France',
  editorSiret: "903 067 999 00016 — immatriculée à l'INSEE le 13/09/2021",
  editorEmail: 'darknortar@gmail.com',
  editorPhone: '06 17 15 40 80',
  publicationDirector: 'Nicolas BINDLER',
  hostName: 'ONLINE SAS (Scaleway) — SAS au capital de 214 410,50 €, filiale du groupe Iliad',
  hostAddress: 'BP 438, 75366 Paris Cedex 08 — RCS Paris B 433 115 904 — TVA FR35433115904',
  hostPhone: '0 184 130 000',
  hostUrl: 'https://www.scaleway.com/fr/',
  domainName: 'OVH SAS — SAS au capital de 10 059 500 €',
  domainAddress: '2 rue Kellermann, 59100 Roubaix, France — RCS Lille Métropole 424 761 419 00045 — TVA FR22424761419',
  domainPhone: '1007',
  domainUrl: 'https://www.ovh.com/fr/',
};

const TXT = {
  fr: {
    title: 'Mentions légales',
    intro:
      "Conformément aux dispositions des articles 6-III et 19 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), il est porté à la connaissance des utilisateurs du site Oraklia les présentes mentions légales.",
    editor: 'Éditeur du site',
    company: 'Société',
    head: 'Siège social',
    siret: 'SIRET',
    director: 'Directeur de la publication',
    email: 'E-mail',
    phone: 'Téléphone',
    hosting: 'Hébergement',
    host: 'Hébergeur',
    address: 'Adresse',
    website: 'Site web',
    domain: 'Nom de domaine',
    registrar: 'Registrar',
    affiliateTitle: "Programme Partenaires d'Amazon",
    affiliate:
      "En tant que Partenaire Amazon, Oraklia réalise un bénéfice sur les achats remplissant les conditions requises. Le site Oraklia participe au Programme Partenaires d'Amazon EU, un programme d'affiliation conçu pour permettre à des sites de percevoir une rémunération grâce à la création de liens vers Amazon.fr. Les prix et la disponibilité des produits affichés sont donnés à titre indicatif et sont susceptibles d'évoluer ; seules les informations présentes sur Amazon.fr au moment de l'achat font foi.",
    ipTitle: 'Propriété intellectuelle',
    ip:
      "L'ensemble des éléments composant le site Oraklia (textes, mise en page, charte graphique, logo) est la propriété exclusive de l'éditeur, sauf mention contraire. Les marques, noms de produits et visuels appartiennent à leurs propriétaires respectifs. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation préalable est interdite et constituerait une contrefaçon.",
    dataTitle: 'Données personnelles',
    data:
      "Oraklia ne collecte que les données strictement nécessaires au fonctionnement du service (notamment lors de la connexion à un compte). Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi « Informatique et Libertés », vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez-nous à l'adresse darknortar@gmail.com.",
    cookiesTitle: 'Cookies',
    cookies:
      "Le site peut déposer des cookies techniques nécessaires à son bon fonctionnement. Les liens vers Amazon.fr peuvent déposer des cookies d'affiliation permettant d'attribuer la source du trafic. Vous pouvez configurer votre navigateur pour refuser les cookies.",
    updated: 'Dernière mise à jour',
  },
  en: {
    title: 'Legal notices',
    intro:
      'In accordance with Articles 6-III and 19 of French Law No. 2004-575 of 21 June 2004 on confidence in the digital economy (LCEN), the following legal notices are provided to the users of the Oraklia website.',
    editor: 'Site publisher',
    company: 'Company',
    head: 'Registered office',
    siret: 'SIRET',
    director: 'Publication director',
    email: 'Email',
    phone: 'Phone',
    hosting: 'Hosting',
    host: 'Host',
    address: 'Address',
    website: 'Website',
    domain: 'Domain name',
    registrar: 'Registrar',
    affiliateTitle: 'Amazon Associates Programme',
    affiliate:
      'As an Amazon Associate, Oraklia earns from qualifying purchases. The Oraklia website participates in the Amazon EU Associates Programme, an affiliate programme designed to allow websites to earn a commission by linking to Amazon.fr. Displayed prices and availability are indicative and subject to change; only the information shown on Amazon.fr at the time of purchase is authoritative.',
    ipTitle: 'Intellectual property',
    ip:
      'All elements making up the Oraklia website (text, layout, graphic design, logo) are the exclusive property of the publisher, unless otherwise stated. Trademarks, product names and images belong to their respective owners. Any reproduction, representation or distribution, in whole or in part, without prior authorization is prohibited and would constitute infringement.',
    dataTitle: 'Personal data',
    data:
      'Oraklia only collects the data strictly necessary for the service to operate (notably when signing in to an account). In accordance with the General Data Protection Regulation (GDPR), you have the right to access, rectify and delete your data. To exercise this right, contact us at darknortar@gmail.com.',
    cookiesTitle: 'Cookies',
    cookies:
      'The site may set technical cookies necessary for it to work properly. Links to Amazon.fr may set affiliate cookies allowing the source of traffic to be attributed. You can configure your browser to refuse cookies.',
    updated: 'Last updated',
  },
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
  const { lang, t } = useI18n();
  if (!open) return null;
  const x = TXT[lang] || TXT.fr;
  const locale = lang === 'en' ? 'en-GB' : 'fr-FR';

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal legal-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={t('auth.close')}>✕</button>

        <div className="legal-content">
          <h1 className="legal-title">{x.title}</h1>
          <p className="legal-intro">{x.intro}</p>

          <section className="legal-section">
            <h2>{x.editor}</h2>
            <Row label={x.company} value={LEGAL.editorName} />
            <Row label={x.head} value={LEGAL.editorAddress} />
            <Row label={x.siret} value={LEGAL.editorSiret} />
            <Row label={x.director} value={LEGAL.publicationDirector} />
            <Row label={x.email} value={LEGAL.editorEmail} />
            <Row label={x.phone} value={LEGAL.editorPhone} />
          </section>

          <section className="legal-section">
            <h2>{x.hosting}</h2>
            <Row label={x.host} value={LEGAL.hostName} />
            <Row label={x.address} value={LEGAL.hostAddress} />
            <Row label={x.phone} value={LEGAL.hostPhone} />
            <Row
              label={x.website}
              value={<a href={LEGAL.hostUrl} target="_blank" rel="noopener noreferrer">{LEGAL.hostUrl}</a>}
            />
          </section>

          <section className="legal-section">
            <h2>{x.domain}</h2>
            <Row label={x.registrar} value={LEGAL.domainName} />
            <Row label={x.address} value={LEGAL.domainAddress} />
            <Row label={x.phone} value={LEGAL.domainPhone} />
            <Row
              label={x.website}
              value={<a href={LEGAL.domainUrl} target="_blank" rel="noopener noreferrer">{LEGAL.domainUrl}</a>}
            />
          </section>

          <section className="legal-section">
            <h2>{x.affiliateTitle}</h2>
            <p>{x.affiliate}</p>
          </section>

          <section className="legal-section">
            <h2>{x.ipTitle}</h2>
            <p>{x.ip}</p>
          </section>

          <section className="legal-section">
            <h2>{x.dataTitle}</h2>
            <p>{x.data}</p>
          </section>

          <section className="legal-section">
            <h2>{x.cookiesTitle}</h2>
            <p>{x.cookies}</p>
          </section>

          <p className="legal-footer-note">
            {x.updated} : {new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
    </div>
  );
}
