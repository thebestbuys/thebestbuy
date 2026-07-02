import { useI18n } from '../lib/i18n.jsx';

// ─────────────────────────────────────────────────────────────────────────
// Politique de confidentialité (RGPD). Dédiée et accessible via une URL réelle
// (/confidentialite, /privacy) — requise par Google Play Console et par le
// programme Partenaires d'Amazon. Réutilise le style .legal-* / .modal.
// ─────────────────────────────────────────────────────────────────────────
const CONTACT = {
  controller: 'NCLS CREATION (Oraklia) — SARL au capital de 1 000 €',
  address: '42 Bd du chemin de fer, 68290 Masevaux, France',
  email: 'darknortar@gmail.com',
};

const TXT = {
  fr: {
    title: 'Politique de confidentialité',
    intro:
      "La présente politique explique quelles données personnelles Oraklia collecte, pourquoi, et quels sont vos droits. Elle s'applique au site et à l'application mobile Oraklia. Le responsable du traitement est " +
      CONTACT.controller + ', ' + CONTACT.address + '. Pour toute question, écrivez-nous à ' + CONTACT.email + '.',
    sections: [
      {
        h: 'Données que nous collectons',
        p: [
          "Compte : si vous vous connectez via un fournisseur externe (Google, Apple, Facebook ou X/Twitter), nous recevons votre adresse e-mail, votre nom d'affichage et, le cas échéant, votre photo de profil. Nous ne recevons jamais votre mot de passe.",
          "Contenu que vous créez : vos recherches, les réponses données au conseiller, vos conversations, vos favoris et sélections, ainsi que vos relations d'amis lorsque vous utilisez ces fonctionnalités.",
          "Données techniques : identifiants de session, préférences (langue), et données de journalisation nécessaires au fonctionnement et à la sécurité du service.",
        ],
      },
      {
        h: 'Finalités et bases légales',
        p: [
          "Fournir le service de conseil d'achat et gérer votre compte (exécution du contrat).",
          "Mémoriser vos favoris, votre historique et vos préférences (exécution du contrat).",
          "Améliorer et sécuriser le service, prévenir les abus (intérêt légitime).",
          "Fonctions sociales (amis, tendances de votre cercle) : uniquement avec votre participation, désactivable à tout moment dans votre profil (consentement / intérêt légitime).",
        ],
      },
      {
        h: 'Vos recherches et l’intelligence artificielle',
        p: [
          "Pour générer des questions et des recommandations, le descriptif de votre recherche et vos réponses sont transmis à notre prestataire d'IA, Google (API Gemini), qui les traite pour produire une réponse. N'y saisissez pas d'informations sensibles dont vous ne souhaitez pas qu'elles soient traitées.",
        ],
      },
      {
        h: 'Liens d’affiliation Amazon',
        p: [
          "Oraklia est participant au Programme Partenaires d'Amazon. Lorsque vous cliquez sur un lien vers Amazon.fr, Amazon peut déposer des cookies permettant d'attribuer la source du trafic et, le cas échéant, de nous rémunérer sur les achats éligibles. Le traitement de vos données sur Amazon.fr relève de la politique de confidentialité d'Amazon.",
        ],
      },
      {
        h: 'Destinataires et sous-traitants',
        p: [
          "Supabase (base de données et authentification) : stockage de votre compte et de votre contenu.",
          "Google : authentification (connexion Google) et traitement par l'IA (API Gemini).",
          "Vercel : hébergement de l'application et des fonctions serveur.",
          "Fournisseurs de connexion sociale que vous choisissez (Apple, Facebook, X/Twitter).",
          "Amazon : via les liens d'affiliation. Nous ne vendons pas vos données personnelles.",
        ],
      },
      {
        h: 'Transferts hors Union européenne',
        p: [
          "Certains de nos prestataires (notamment Google, Supabase, Vercel) peuvent traiter des données en dehors de l'Union européenne. Ces transferts sont encadrés par des garanties appropriées, telles que les clauses contractuelles types de la Commission européenne.",
        ],
      },
      {
        h: 'Durée de conservation',
        p: [
          "Vos données de compte et votre contenu sont conservés tant que votre compte est actif. Vous pouvez supprimer votre compte à tout moment ; vos données associées sont alors effacées ou anonymisées, sous réserve des obligations légales de conservation.",
        ],
      },
      {
        h: 'Cookies et stockage local',
        p: [
          "Le service utilise le stockage local de votre appareil pour mémoriser vos préférences, votre session et votre contenu hors ligne. Des cookies techniques peuvent être nécessaires à son fonctionnement, et les liens vers Amazon peuvent déposer des cookies d'affiliation. Vous pouvez configurer votre navigateur pour les refuser.",
        ],
      },
      {
        h: 'Vos droits',
        p: [
          "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition sur vos données. Vous pouvez exercer ces droits, ou demander la suppression de votre compte, en nous écrivant à " + CONTACT.email + ". Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).",
        ],
      },
      {
        h: 'Sécurité',
        p: [
          "Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger vos données contre l'accès, la modification ou la divulgation non autorisés.",
        ],
      },
      {
        h: 'Mineurs',
        p: [
          "Le service n'est pas destiné aux enfants de moins de 15 ans. Nous ne collectons pas sciemment de données concernant des mineurs de cet âge.",
        ],
      },
      {
        h: 'Modifications',
        p: [
          "Nous pouvons mettre à jour cette politique. En cas de changement important, nous en informerons les utilisateurs par un moyen approprié.",
        ],
      },
    ],
    updated: 'Dernière mise à jour',
  },
  en: {
    title: 'Privacy policy',
    intro:
      'This policy explains what personal data Oraklia collects, why, and what your rights are. It applies to the Oraklia website and mobile app. The data controller is ' +
      CONTACT.controller + ', ' + CONTACT.address + '. For any question, write to us at ' + CONTACT.email + '.',
    sections: [
      {
        h: 'Data we collect',
        p: [
          'Account: if you sign in through an external provider (Google, Apple, Facebook or X/Twitter), we receive your email address, display name and, where applicable, your profile picture. We never receive your password.',
          'Content you create: your searches, the answers you give the advisor, your conversations, your favorites and selections, and your friend relationships when you use those features.',
          'Technical data: session identifiers, preferences (language), and logging data necessary for the operation and security of the service.',
        ],
      },
      {
        h: 'Purposes and legal bases',
        p: [
          'Provide the shopping-advice service and manage your account (performance of the contract).',
          'Remember your favorites, history and preferences (performance of the contract).',
          'Improve and secure the service, prevent abuse (legitimate interest).',
          'Social features (friends, trends in your circle): only with your participation, which can be turned off at any time in your profile (consent / legitimate interest).',
        ],
      },
      {
        h: 'Your searches and artificial intelligence',
        p: [
          'To generate questions and recommendations, your search description and answers are sent to our AI provider, Google (Gemini API), which processes them to produce a response. Do not enter sensitive information you would not want processed.',
        ],
      },
      {
        h: 'Amazon affiliate links',
        p: [
          'Oraklia is a participant in the Amazon Associates Programme. When you click a link to Amazon.fr, Amazon may set cookies to attribute the source of traffic and, where applicable, to pay us a commission on qualifying purchases. The processing of your data on Amazon.fr is governed by Amazon’s own privacy policy.',
        ],
      },
      {
        h: 'Recipients and processors',
        p: [
          'Supabase (database and authentication): storage of your account and content.',
          'Google: authentication (Google sign-in) and AI processing (Gemini API).',
          'Vercel: hosting of the application and server functions.',
          'Social sign-in providers you choose (Apple, Facebook, X/Twitter).',
          'Amazon: via affiliate links. We do not sell your personal data.',
        ],
      },
      {
        h: 'Transfers outside the European Union',
        p: [
          'Some of our providers (notably Google, Supabase, Vercel) may process data outside the European Union. Such transfers are governed by appropriate safeguards, such as the European Commission’s Standard Contractual Clauses.',
        ],
      },
      {
        h: 'Data retention',
        p: [
          'Your account data and content are kept for as long as your account is active. You can delete your account at any time; your associated data is then erased or anonymized, subject to legal retention obligations.',
        ],
      },
      {
        h: 'Cookies and local storage',
        p: [
          'The service uses your device’s local storage to remember your preferences, session and offline content. Technical cookies may be necessary for it to work, and links to Amazon may set affiliate cookies. You can configure your browser to refuse them.',
        ],
      },
      {
        h: 'Your rights',
        p: [
          'Under the GDPR, you have the right to access, rectify, erase, restrict, port and object to the processing of your data. You can exercise these rights, or request deletion of your account, by writing to us at ' + CONTACT.email + '. You may also lodge a complaint with the French data protection authority (CNIL, www.cnil.fr).',
        ],
      },
      {
        h: 'Security',
        p: [
          'We implement reasonable technical and organizational measures to protect your data against unauthorized access, alteration or disclosure.',
        ],
      },
      {
        h: 'Minors',
        p: [
          'The service is not intended for children under 15. We do not knowingly collect data about minors of that age.',
        ],
      },
      {
        h: 'Changes',
        p: [
          'We may update this policy. In the event of a significant change, we will inform users by an appropriate means.',
        ],
      },
    ],
    updated: 'Last updated',
  },
};

export default function PrivacyPolicy({ open, onClose }) {
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

          {x.sections.map((s, i) => (
            <section className="legal-section" key={i}>
              <h2>{s.h}</h2>
              {s.p.map((para, j) => (
                <p key={j}>{para}</p>
              ))}
            </section>
          ))}

          <p className="legal-footer-note">
            {x.updated} : {new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
    </div>
  );
}
