import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'oraklia_lang';
export const LANGS = ['fr', 'en'];

const TRANSLATIONS = {
  fr: {
    // Home
    'home.searchPlaceholder': "Que cherchez-vous aujourd'hui ?",
    'home.search': 'Rechercher',
    'home.history': 'Historique',
    'home.historyTitle': 'Historique des conversations',
    'home.selections': 'Sélections',
    'home.selectionsTitle': 'Mes sélections',
    'suggestion.phone': 'Smartphone',
    'suggestion.laptop': 'Ordinateur portable',
    'suggestion.tv': 'Téléviseur',
    'suggestion.earbuds': 'Écouteurs sans fil',
    'suggestion.watch': 'Montre connectée',
    'suggestion.vacuum': 'Aspirateur robot',
    'suggestion.coffee': 'Machine à café',
    'suggestion.speaker': 'Enceinte Bluetooth',
    'guides.sectionTitle': "Nos guides d'achat",
    'guides.sectionSub': 'Des conseils clairs et indépendants pour choisir le bon produit, sans jargon.',
    'guides.cardEyebrow': 'Guide · {time}',
    'guides.read': 'Lire le guide →',

    // Footer / legal
    'footer.affiliate': 'En tant que Partenaire Amazon, Oraklia réalise un bénéfice sur les achats remplissant les conditions requises.',
    'footer.rights': '© {year} Oraklia. Tous droits réservés.',
    'footer.legal': 'Mentions légales',
    'footer.copyrightShort': '© {year} Oraklia',

    // Results
    'results.placeholderTitle': 'Vos suggestions<br/>apparaîtront ici',
    'results.placeholderSub': 'Répondez aux questions dans le chat pour qu\'Oraklia sélectionne les meilleurs produits pour vous.',
    'results.eyebrow': 'Top 3 sélection',
    'results.finalized': 'Sélection finalisée',
    'results.refining': 'Affinage en cours…',

    // Chat
    'chat.subtitle': 'Conseiller en ligne',
    'chat.assistant': 'Assistant',
    'chat.you': 'Vous',
    'chat.history': 'Historique',
    'chat.home': "Retour à l'accueil",
    'chat.restart': 'Recommencer la conversation',
    'chat.inputAnswer': 'Ou écrivez votre réponse…',
    'chat.inputCriteria': 'Précisez vos critères…',
    'chat.send': 'Envoyer',
    'chat.error': "Désolé, le service de recommandation n'a pas répondu ({msg}). Réessayez ou rafraîchissez la page.",

    // Budget slider
    'budget.confirm': 'Confirmer',
    'budget.none': 'Pas de contrainte de budget',
    'budget.maxOnly': 'Mon budget maximum est de {max}€',
    'budget.minOnly': "Mon budget est d'au moins {min}€",
    'budget.range': 'Mon budget est entre {min}€ et {max}€',
    'budget.bracket1': 'Moins de 300 €',
    'budget.bracket2': '300 – 600 €',
    'budget.bracket3': '600 – 1000 €',
    'budget.bracket4': 'Plus de 1000 €',

    // Product card / detail
    'product.bestMatch': 'Meilleur match',
    'product.match': 'match',
    'product.viewDetails': 'Voir détails',
    'product.reviews': '{n} avis',
    'product.matchPct': '{score}% de correspondance',
    'product.matchSub': 'avec vos critères',
    'product.why': 'Pourquoi ce produit ?',
    'product.features': 'Caractéristiques principales',
    'product.price': 'Prix',
    'product.shipping': "Livraison gratuite · 30 jours d'essai",
    'product.viewAmazon': 'Voir sur Amazon',
    'product.matchLabel': 'match',

    // Auth
    'auth.signIn': 'Se connecter',
    'auth.welcome': 'Bienvenue sur Oraklia',
    'auth.sub': 'Connectez-vous ou créez un compte pour sauvegarder vos sélections.',
    'auth.notConfigured': "La connexion Google n'est pas configurée.",
    'auth.missing': 'manquant dans',
    'auth.loading': 'Chargement…',
    'auth.terms': 'En continuant vous acceptez nos {terms} et notre {privacy}.',
    'auth.termsLink': 'conditions',
    'auth.privacyLink': 'politique de confidentialité',
    'auth.mySelections': 'Mes sélections',
    'auth.soon': 'bientôt',
    'auth.signOut': 'Se déconnecter',
    'auth.account': 'Compte',
    'auth.close': 'Fermer',

    // History
    'history.title': 'Historique',
    'history.subUser': 'Vos conversations sauvegardées localement.',
    'history.subGuest': 'Conversations stockées sur cet appareil.',
    'history.emptyText': "Aucune conversation sauvegardée pour l'instant.",
    'history.emptySub': "Vos sélections apparaîtront ici dès qu'une recherche démarre.",
    'history.conversation': 'Conversation',
    'history.messages': '· {n} messages',
    'history.done': '✓ finalisée',
    'history.delete': 'Supprimer',
    'history.deleteConvo': 'Supprimer cette conversation',

    // Selections (saved products)
    'selections.title': 'Mes sélections',
    'selections.subUser': 'Les produits que vous avez mis de côté.',
    'selections.subGuest': 'Produits enregistrés sur cet appareil.',
    'selections.emptyText': 'Aucun produit enregistré pour le moment.',
    'selections.emptySub': 'Touchez le ♡ sur un produit pour le retrouver ici.',
    'selections.add': 'Ajouter à mes sélections',
    'selections.remove': 'Retirer de mes sélections',
    'selections.added': 'Ajouté {when}',
    'selections.priceNote': "Prix indicatif au moment de l'enregistrement — seule la page Amazon fait foi.",

    'cat.phone': 'Téléphone',
    'cat.laptop': 'Ordinateur',
    'cat.headphones': 'Casque',

    // Guide article
    'guide.back': 'Retour',
    'guide.meta': "Guide d'achat · {updated} · {time} de lecture",
    'guide.checklist': 'La checklist à retenir',
    'guide.picks': 'Notre sélection par budget',
    'guide.picksIntro': 'Des pistes pour démarrer vos recherches sur Amazon.fr selon votre budget. Les prix et la disponibilité évoluent ; seule la page Amazon fait foi.',
    'guide.pickCta': 'Voir sur Amazon →',
    'guide.advisorTitle': "Besoin d'un conseil personnalisé ?",
    'guide.advisorText': 'Répondez à quelques questions et notre conseiller intelligent sélectionne les produits les plus adaptés à vos besoins.',
    'guide.advisorCta': 'Lancer le conseiller',

    // Mobile
    'm.suggestions': 'Suggestions',
    'm.searchHint': 'Demandez en langage naturel — « un clavier silencieux à moins de 80 € »',
    'm.greetingLead': 'Coucou {name},',
    'm.greetingLeadAnon': 'Coucou,',
    'm.greetingHighlight': "on cherche quoi aujourd'hui ?",
    'm.seeAll': 'voir tout →',
    'm.resume': 'Reprendre',
    'm.noRecents': "Aucune recherche pour l'instant. Lance une recherche, on la retrouvera ici.",
    'm.assistantStatus': '● En ligne · répond tout de suite',
    'm.typeMessage': 'Écrivez un message…',
    'm.thinking': 'Réflexion…',
    'm.poweredBy': 'Propulsé par un assistant shopping IA',

    // Lang toggle
    'lang.label': 'Langue',
  },

  en: {
    // Home
    'home.searchPlaceholder': 'What are you looking for today?',
    'home.search': 'Search',
    'home.history': 'History',
    'home.historyTitle': 'Conversation history',
    'home.selections': 'Selections',
    'home.selectionsTitle': 'My selections',
    'suggestion.phone': 'Smartphone',
    'suggestion.laptop': 'Laptop',
    'suggestion.tv': 'TV',
    'suggestion.earbuds': 'Wireless earbuds',
    'suggestion.watch': 'Smartwatch',
    'suggestion.vacuum': 'Robot vacuum',
    'suggestion.coffee': 'Coffee machine',
    'suggestion.speaker': 'Bluetooth speaker',
    'guides.sectionTitle': 'Our buying guides',
    'guides.sectionSub': 'Clear, independent advice to choose the right product — no jargon.',
    'guides.cardEyebrow': 'Guide · {time}',
    'guides.read': 'Read the guide →',

    // Footer / legal
    'footer.affiliate': 'As an Amazon Associate, Oraklia earns from qualifying purchases.',
    'footer.rights': '© {year} Oraklia. All rights reserved.',
    'footer.legal': 'Legal notices',
    'footer.copyrightShort': '© {year} Oraklia',

    // Results
    'results.placeholderTitle': 'Your suggestions<br/>will appear here',
    'results.placeholderSub': 'Answer the questions in the chat so Oraklia can select the best products for you.',
    'results.eyebrow': 'Top 3 selection',
    'results.finalized': 'Selection finalized',
    'results.refining': 'Refining…',

    // Chat
    'chat.subtitle': 'Advisor online',
    'chat.assistant': 'Assistant',
    'chat.you': 'You',
    'chat.history': 'History',
    'chat.home': 'Back to home',
    'chat.restart': 'Restart the conversation',
    'chat.inputAnswer': 'Or type your answer…',
    'chat.inputCriteria': 'Refine your criteria…',
    'chat.send': 'Send',
    'chat.error': "Sorry, the recommendation service didn't respond ({msg}). Try again or refresh the page.",

    // Budget slider
    'budget.confirm': 'Confirm',
    'budget.none': 'No budget limit',
    'budget.maxOnly': 'My maximum budget is {max}€',
    'budget.minOnly': 'My budget is at least {min}€',
    'budget.range': 'My budget is between {min}€ and {max}€',
    'budget.bracket1': 'Under €300',
    'budget.bracket2': '€300 – €600',
    'budget.bracket3': '€600 – €1000',
    'budget.bracket4': 'Over €1000',

    // Product card / detail
    'product.bestMatch': 'Best match',
    'product.match': 'match',
    'product.viewDetails': 'View details',
    'product.reviews': '{n} reviews',
    'product.matchPct': '{score}% match',
    'product.matchSub': 'with your criteria',
    'product.why': 'Why this product?',
    'product.features': 'Key features',
    'product.price': 'Price',
    'product.shipping': 'Free delivery · 30-day trial',
    'product.viewAmazon': 'View on Amazon',
    'product.matchLabel': 'match',

    // Auth
    'auth.signIn': 'Sign in',
    'auth.welcome': 'Welcome to Oraklia',
    'auth.sub': 'Sign in or create an account to save your selections.',
    'auth.notConfigured': 'Google sign-in is not configured.',
    'auth.missing': 'missing in',
    'auth.loading': 'Loading…',
    'auth.terms': 'By continuing you agree to our {terms} and our {privacy}.',
    'auth.termsLink': 'terms',
    'auth.privacyLink': 'privacy policy',
    'auth.mySelections': 'My selections',
    'auth.soon': 'soon',
    'auth.signOut': 'Sign out',
    'auth.account': 'Account',
    'auth.close': 'Close',

    // History
    'history.title': 'History',
    'history.subUser': 'Your conversations saved locally.',
    'history.subGuest': 'Conversations stored on this device.',
    'history.emptyText': 'No saved conversation yet.',
    'history.emptySub': 'Your selections will appear here as soon as a search starts.',
    'history.conversation': 'Conversation',
    'history.messages': '· {n} messages',
    'history.done': '✓ finalized',
    'history.delete': 'Delete',
    'history.deleteConvo': 'Delete this conversation',

    // Selections (saved products)
    'selections.title': 'My selections',
    'selections.subUser': 'The products you’ve saved for later.',
    'selections.subGuest': 'Products saved on this device.',
    'selections.emptyText': 'No saved product yet.',
    'selections.emptySub': 'Tap the ♡ on a product to find it here.',
    'selections.add': 'Add to my selections',
    'selections.remove': 'Remove from my selections',
    'selections.added': 'Added {when}',
    'selections.priceNote': 'Indicative price at time of saving — only the Amazon page is authoritative.',

    'cat.phone': 'Phone',
    'cat.laptop': 'Laptop',
    'cat.headphones': 'Headphones',

    // Guide article
    'guide.back': 'Back',
    'guide.meta': 'Buying guide · {updated} · {time} read',
    'guide.checklist': 'Key takeaways',
    'guide.picks': 'Our picks by budget',
    'guide.picksIntro': 'Starting points for your search on Amazon by budget. Prices and availability change; only the Amazon page is authoritative.',
    'guide.pickCta': 'View on Amazon →',
    'guide.advisorTitle': 'Need personalized advice?',
    'guide.advisorText': 'Answer a few questions and our smart advisor selects the products best suited to your needs.',
    'guide.advisorCta': 'Launch the advisor',

    // Mobile
    'm.suggestions': 'Suggestions',
    'm.searchHint': 'Ask in plain words — "a quiet keyboard under €80"',
    'm.greetingLead': 'Hey {name},',
    'm.greetingLeadAnon': 'Hey there,',
    'm.greetingHighlight': 'what shall we find today?',
    'm.seeAll': 'see all →',
    'm.resume': 'Resume',
    'm.noRecents': "No search yet. Start one and you'll find it here.",
    'm.assistantStatus': '● Online · usually replies instantly',
    'm.typeMessage': 'Type a message…',
    'm.thinking': 'Thinking…',
    'm.poweredBy': 'Powered by AI shopping assistant',

    // Lang toggle
    'lang.label': 'Language',
  },
};

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));
}

const LangContext = createContext(null);

function detectInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS.includes(saved)) return saved;
  } catch { /* ignore */ }
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'fr';
  return nav.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitial);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const t = (key, vars) => {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.fr;
      const str = dict[key] ?? TRANSLATIONS.fr[key] ?? key;
      return interpolate(str, vars);
    };
    return { lang, setLang: setLangState, t };
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LangContext);
  if (!ctx) {
    // Fallback when used outside a provider (defensive)
    return { lang: 'fr', setLang: () => {}, t: (k, v) => interpolate(TRANSLATIONS.fr[k] ?? k, v) };
  }
  return ctx;
}
