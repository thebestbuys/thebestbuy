import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "oraklia_lang";
export const LANGS = ["fr", "en"];

const TRANSLATIONS = {
  fr: {
    // Home
    "home.searchPlaceholder": "Que cherchez-vous aujourd'hui ?",
    "home.search": "Rechercher",
    "home.history": "Historique",
    "home.historyTitle": "Historique des conversations",
    "home.selections": "Sélections",
    "home.selectionsTitle": "Mes sélections",
    "home.gift": "Trouver un cadeau",
    "suggestion.phone": "Smartphone",
    "suggestion.laptop": "Ordinateur portable",
    "suggestion.tv": "Téléviseur",
    "suggestion.earbuds": "Écouteurs sans fil",
    "suggestion.watch": "Montre connectée",
    "suggestion.vacuum": "Aspirateur robot",
    "suggestion.coffee": "Machine à café",
    "suggestion.speaker": "Enceinte Bluetooth",
    "guides.sectionTitle": "Nos guides d'achat",
    "guides.sectionSub":
      "Des conseils clairs et indépendants pour choisir le bon produit, sans jargon.",
    "guides.cardEyebrow": "Guide · {time}",
    "guides.read": "Lire le guide →",

    // Footer / legal
    "footer.affiliate":
      "En tant que Partenaire Amazon, Oraklia réalise un bénéfice sur les achats remplissant les conditions requises.",
    "footer.rights": "© {year} Oraklia. Tous droits réservés.",
    "footer.legal": "Mentions légales",
    "footer.copyrightShort": "© {year} Oraklia",

    // Results
    "results.placeholderTitle": "Vos suggestions<br/>apparaîtront ici",
    "results.placeholderSub":
      "Répondez aux questions dans le chat pour qu'Oraklia sélectionne les meilleurs produits pour vous.",
    "results.eyebrow": "Top 3 sélection",
    "results.finalized": "Sélection finalisée",
    "results.refining": "Affinage en cours…",

    // Chat
    "chat.subtitle": "Conseiller en ligne",
    "chat.assistant": "Assistant",
    "chat.you": "Vous",
    "chat.history": "Historique",
    "chat.home": "Retour à l'accueil",
    "chat.restart": "Recommencer la conversation",
    "chat.inputAnswer": "Ou écrivez votre réponse…",
    "chat.inputCriteria": "Précisez vos critères…",
    "chat.send": "Envoyer",
    "chat.error":
      "Désolé, le service de recommandation n'a pas répondu ({msg}). Réessayez ou rafraîchissez la page.",

    // Budget slider
    "budget.confirm": "Confirmer",
    "budget.none": "Pas de contrainte de budget",
    "budget.maxOnly": "Mon budget maximum est de {max}€",
    "budget.minOnly": "Mon budget est d'au moins {min}€",
    "budget.range": "Mon budget est entre {min}€ et {max}€",
    "budget.bracket1": "Moins de 300 €",
    "budget.bracket2": "300 – 600 €",
    "budget.bracket3": "600 – 1000 €",
    "budget.bracket4": "Plus de 1000 €",

    // Product card / detail
    "product.bestMatch": "Meilleur match",
    "product.match": "match",
    "product.viewDetails": "Voir détails",
    "product.reviews": "{n} avis",
    "product.matchPct": "{score}% de correspondance",
    "product.matchSub": "avec vos critères",
    "product.why": "Pourquoi ce produit ?",
    "product.features": "Caractéristiques principales",
    "product.price": "Prix",
    "product.shipping": "Livraison gratuite · 30 jours d'essai",
    "product.viewAmazon": "Voir sur Amazon",
    "product.matchLabel": "match",

    // Auth
    "auth.signIn": "Se connecter",
    "auth.welcome": "Bienvenue sur Oraklia",
    "auth.sub":
      "Connectez-vous ou créez un compte pour sauvegarder vos sélections.",
    "auth.notConfigured": "La connexion Google n'est pas configurée.",
    "auth.missing": "manquant dans",
    "auth.loading": "Chargement…",
    "auth.terms": "En continuant vous acceptez nos {terms} et notre {privacy}.",
    "auth.termsLink": "conditions",
    "auth.privacyLink": "politique de confidentialité",
    "auth.mySelections": "Mes sélections",
    "auth.myProfile": "Mon profil",
    "auth.soon": "bientôt",
    "auth.signOut": "Se déconnecter",
    "auth.account": "Compte",
    "auth.close": "Fermer",

    // Profile (personalization)
    "profile.title": "Mon profil",
    "profile.sub": "Décrivez-vous pour des suggestions plus adaptées.",
    "profile.sectionInfo": "Informations",
    "profile.sectionAbout": "À propos de vous",
    "profile.gender": "Genre",
    "profile.genderPlaceholder": "Sélectionner…",
    "profile.gender.female": "Femme",
    "profile.gender.male": "Homme",
    "profile.gender.other": "Autre",
    "profile.gender.na": "Préfère ne pas dire",
    "profile.age": "Âge",
    "profile.agePlaceholder": "Ex : 34",
    "profile.profession": "Profession",
    "profile.professionPlaceholder": "Ex : enseignante",
    "profile.nationality": "Nationalité",
    "profile.nationalityPlaceholder": "Ex : française",
    "profile.address": "Adresse",
    "profile.addressPlaceholder": "Ex : Lyon, France",
    "profile.label": "À propos de vous",
    "profile.placeholder":
      "Ex : famille de 4, deux jeunes enfants. J'aime les marques durables, je privilégie la simplicité et le rapport qualité-prix. Plutôt écosystème Apple. Sensible à l'écologie.",
    "profile.hint":
      "Ces informations sont envoyées à l'assistant pour personnaliser ses questions et ses recommandations. Stockées sur cet appareil.",
    "profile.save": "Enregistrer",
    "profile.saved": "Profil enregistré",
    "profile.clear": "Tout effacer",
    "profile.counter": "{n}/600",

    // History
    "history.title": "Historique",
    "history.subUser": "Vos conversations sauvegardées localement.",
    "history.subGuest": "Conversations stockées sur cet appareil.",
    "history.emptyText": "Aucune conversation sauvegardée pour l'instant.",
    "history.emptySub":
      "Vos sélections apparaîtront ici dès qu'une recherche démarre.",
    "history.conversation": "Conversation",
    "history.messages": "· {n} messages",
    "history.done": "✓ finalisée",
    "history.delete": "Supprimer",
    "history.deleteConvo": "Supprimer cette conversation",

    // Selections (saved products)
    "selections.title": "Mes sélections",
    "selections.subUser": "Les produits que vous avez mis de côté.",
    "selections.subGuest": "Produits enregistrés sur cet appareil.",
    "selections.emptyText": "Aucun produit enregistré pour le moment.",
    "selections.emptySub": "Touchez le ♡ sur un produit pour le retrouver ici.",
    "selections.add": "Ajouter à mes sélections",
    "selections.remove": "Retirer de mes sélections",
    "selections.added": "Ajouté {when}",
    "selections.priceNote":
      "Prix indicatif au moment de l'enregistrement — seule la page Amazon fait foi.",

    "cat.phone": "Téléphone",
    "cat.laptop": "Ordinateur",
    "cat.headphones": "Casque",
    "cat.gift": "Idées cadeaux",

    // Gift finder
    "gift.title": "Trouver un cadeau",
    "gift.sub": "Décrivez la personne, on s'occupe des idées.",
    "gift.relationship": "Pour qui ?",
    "gift.relationshipPlaceholder": "Sélectionner…",
    "gift.rel.partner": "Conjoint·e",
    "gift.rel.parent": "Parent",
    "gift.rel.child": "Enfant",
    "gift.rel.sibling": "Frère / sœur",
    "gift.rel.friend": "Ami·e",
    "gift.rel.colleague": "Collègue",
    "gift.rel.other": "Autre",
    "gift.gender": "Genre",
    "gift.age": "Âge",
    "gift.agePlaceholder": "Ex : 30",
    "gift.interests": "Centres d'intérêt & goûts",
    "gift.interestsPlaceholder":
      "Ex : cuisine, randonnée, jeux vidéo, lecture, café de spécialité, déco, sport… Plus c'est précis, mieux c'est.",
    "gift.occasion": "Occasion",
    "gift.occasionPlaceholder": "Sélectionner…",
    "gift.occ.birthday": "Anniversaire",
    "gift.occ.christmas": "Noël",
    "gift.occ.valentine": "Saint-Valentin",
    "gift.occ.wedding": "Mariage",
    "gift.occ.newBaby": "Naissance",
    "gift.occ.housewarming": "Crémaillère",
    "gift.occ.thankYou": "Remerciement",
    "gift.occ.justBecause": "Sans occasion",
    "gift.occ.other": "Autre",
    "gift.budget": "Budget (€)",
    "gift.budgetMin": "Min",
    "gift.budgetMax": "Max",
    "gift.submit": "Trouver des idées",
    "gift.surprise": "Surprends-moi",
    "gift.budgetPreset": "Tranches de budget",
    "gift.share": "Partager ces idées",
    "gift.shareCopied": "Lien copié !",
    "share.eyebrow": "Idées cadeaux partagées",
    "share.title": "Une sélection d'idées cadeaux",
    "share.forOccasion": "Pour : {what}",
    "share.cta": "Créer ma propre liste",
    "share.empty": "Cette liste est vide ou le lien est invalide.",
    "gift.saved": "Mes proches",
    "gift.personName": "Nom du proche",
    "gift.personNamePlaceholder": "Ex : Maman",
    "gift.savePerson": "Enregistrer ce proche",
    "gift.updatePerson": "Mettre à jour",
    "gift.deletePerson": "Supprimer",
    "gift.hint":
      "Ces informations servent uniquement à générer des idées. Stockées sur cet appareil.",
    "gift.introReply":
      "Voici quelques idées de cadeaux adaptées. Répondez aux questions pour les affiner.",

    // Guide article
    "guide.back": "Retour",
    "guide.meta": "Guide d'achat · {updated} · {time} de lecture",
    "guide.checklist": "La checklist à retenir",
    "guide.picks": "Notre sélection par budget",
    "guide.picksIntro":
      "Des pistes pour démarrer vos recherches sur Amazon.fr selon votre budget. Les prix et la disponibilité évoluent ; seule la page Amazon fait foi.",
    "guide.pickCta": "Voir sur Amazon →",
    "guide.advisorTitle": "Besoin d'un conseil personnalisé ?",
    "guide.advisorText":
      "Répondez à quelques questions et notre conseiller intelligent sélectionne les produits les plus adaptés à vos besoins.",
    "guide.advisorCta": "Lancer le conseiller",

    // Mobile
    "m.suggestions": "Suggestions",
    "m.searchHint":
      "Demandez en langage naturel — « un clavier silencieux à moins de 80 € »",
    "m.greetingLead": "Salut {name},",
    "m.greetingLeadAnon": "Salut,",
    "m.greetingHighlight": "on cherche quoi aujourd'hui ?",
    "m.seeAll": "voir tout →",
    "m.resume": "Reprendre",
    "m.noRecents":
      "Aucune recherche pour l'instant. Lance une recherche, on la retrouvera ici.",
    "m.assistantStatus": "● En ligne · répond tout de suite",
    "m.typeMessage": "Écrivez un message…",
    "m.thinking": "Réflexion…",
    "m.poweredBy": "Propulsé par un assistant shopping IA",

    // Lang toggle
    "lang.label": "Langue",
  },

  en: {
    // Home
    "home.searchPlaceholder": "What are you looking for today?",
    "home.search": "Search",
    "home.history": "History",
    "home.historyTitle": "Conversation history",
    "home.selections": "Selections",
    "home.selectionsTitle": "My selections",
    "home.gift": "Find a gift",
    "suggestion.phone": "Smartphone",
    "suggestion.laptop": "Laptop",
    "suggestion.tv": "TV",
    "suggestion.earbuds": "Wireless earbuds",
    "suggestion.watch": "Smartwatch",
    "suggestion.vacuum": "Robot vacuum",
    "suggestion.coffee": "Coffee machine",
    "suggestion.speaker": "Bluetooth speaker",
    "guides.sectionTitle": "Our buying guides",
    "guides.sectionSub":
      "Clear, independent advice to choose the right product — no jargon.",
    "guides.cardEyebrow": "Guide · {time}",
    "guides.read": "Read the guide →",

    // Footer / legal
    "footer.affiliate":
      "As an Amazon Associate, Oraklia earns from qualifying purchases.",
    "footer.rights": "© {year} Oraklia. All rights reserved.",
    "footer.legal": "Legal notices",
    "footer.copyrightShort": "© {year} Oraklia",

    // Results
    "results.placeholderTitle": "Your suggestions<br/>will appear here",
    "results.placeholderSub":
      "Answer the questions in the chat so Oraklia can select the best products for you.",
    "results.eyebrow": "Top 3 selection",
    "results.finalized": "Selection finalized",
    "results.refining": "Refining…",

    // Chat
    "chat.subtitle": "Advisor online",
    "chat.assistant": "Assistant",
    "chat.you": "You",
    "chat.history": "History",
    "chat.home": "Back to home",
    "chat.restart": "Restart the conversation",
    "chat.inputAnswer": "Or type your answer…",
    "chat.inputCriteria": "Refine your criteria…",
    "chat.send": "Send",
    "chat.error":
      "Sorry, the recommendation service didn't respond ({msg}). Try again or refresh the page.",

    // Budget slider
    "budget.confirm": "Confirm",
    "budget.none": "No budget limit",
    "budget.maxOnly": "My maximum budget is {max}€",
    "budget.minOnly": "My budget is at least {min}€",
    "budget.range": "My budget is between {min}€ and {max}€",
    "budget.bracket1": "Under €300",
    "budget.bracket2": "€300 – €600",
    "budget.bracket3": "€600 – €1000",
    "budget.bracket4": "Over €1000",

    // Product card / detail
    "product.bestMatch": "Best match",
    "product.match": "match",
    "product.viewDetails": "View details",
    "product.reviews": "{n} reviews",
    "product.matchPct": "{score}% match",
    "product.matchSub": "with your criteria",
    "product.why": "Why this product?",
    "product.features": "Key features",
    "product.price": "Price",
    "product.shipping": "Free delivery · 30-day trial",
    "product.viewAmazon": "View on Amazon",
    "product.matchLabel": "match",

    // Auth
    "auth.signIn": "Sign in",
    "auth.welcome": "Welcome to Oraklia",
    "auth.sub": "Sign in or create an account to save your selections.",
    "auth.notConfigured": "Google sign-in is not configured.",
    "auth.missing": "missing in",
    "auth.loading": "Loading…",
    "auth.terms": "By continuing you agree to our {terms} and our {privacy}.",
    "auth.termsLink": "terms",
    "auth.privacyLink": "privacy policy",
    "auth.mySelections": "My selections",
    "auth.myProfile": "My profile",
    "auth.soon": "soon",
    "auth.signOut": "Sign out",
    "auth.account": "Account",
    "auth.close": "Close",

    // Profile (personalization)
    "profile.title": "My profile",
    "profile.sub": "Describe yourself for better-tailored suggestions.",
    "profile.sectionInfo": "Information",
    "profile.sectionAbout": "About you",
    "profile.gender": "Gender",
    "profile.genderPlaceholder": "Select…",
    "profile.gender.female": "Female",
    "profile.gender.male": "Male",
    "profile.gender.other": "Other",
    "profile.gender.na": "Prefer not to say",
    "profile.age": "Age",
    "profile.agePlaceholder": "e.g. 34",
    "profile.profession": "Profession",
    "profile.professionPlaceholder": "e.g. teacher",
    "profile.nationality": "Nationality",
    "profile.nationalityPlaceholder": "e.g. French",
    "profile.address": "Address",
    "profile.addressPlaceholder": "e.g. Lyon, France",
    "profile.label": "About you",
    "profile.placeholder":
      "E.g. family of 4 with two young kids. I like durable brands, prefer simplicity and value for money. Mostly Apple ecosystem. I care about sustainability.",
    "profile.hint":
      "This is sent to the assistant to personalize its questions and recommendations. Stored on this device.",
    "profile.save": "Save",
    "profile.saved": "Profile saved",
    "profile.clear": "Clear all",
    "profile.counter": "{n}/600",

    // History
    "history.title": "History",
    "history.subUser": "Your conversations saved locally.",
    "history.subGuest": "Conversations stored on this device.",
    "history.emptyText": "No saved conversation yet.",
    "history.emptySub":
      "Your selections will appear here as soon as a search starts.",
    "history.conversation": "Conversation",
    "history.messages": "· {n} messages",
    "history.done": "✓ finalized",
    "history.delete": "Delete",
    "history.deleteConvo": "Delete this conversation",

    // Selections (saved products)
    "selections.title": "My selections",
    "selections.subUser": "The products you’ve saved for later.",
    "selections.subGuest": "Products saved on this device.",
    "selections.emptyText": "No saved product yet.",
    "selections.emptySub": "Tap the ♡ on a product to find it here.",
    "selections.add": "Add to my selections",
    "selections.remove": "Remove from my selections",
    "selections.added": "Added {when}",
    "selections.priceNote":
      "Indicative price at time of saving — only the Amazon page is authoritative.",

    "cat.phone": "Phone",
    "cat.laptop": "Laptop",
    "cat.headphones": "Headphones",
    "cat.gift": "Gift ideas",

    // Gift finder
    "gift.title": "Find a gift",
    "gift.sub": "Describe the person, we'll handle the ideas.",
    "gift.relationship": "For whom?",
    "gift.relationshipPlaceholder": "Select…",
    "gift.rel.partner": "Partner",
    "gift.rel.parent": "Parent",
    "gift.rel.child": "Child",
    "gift.rel.sibling": "Sibling",
    "gift.rel.friend": "Friend",
    "gift.rel.colleague": "Colleague",
    "gift.rel.other": "Other",
    "gift.gender": "Gender",
    "gift.age": "Age",
    "gift.agePlaceholder": "e.g. 30",
    "gift.interests": "Interests & tastes",
    "gift.interestsPlaceholder":
      "E.g. cooking, hiking, video games, reading, specialty coffee, home decor, sport… The more specific, the better.",
    "gift.occasion": "Occasion",
    "gift.occasionPlaceholder": "Select…",
    "gift.occ.birthday": "Birthday",
    "gift.occ.christmas": "Christmas",
    "gift.occ.valentine": "Valentine's Day",
    "gift.occ.wedding": "Wedding",
    "gift.occ.newBaby": "New baby",
    "gift.occ.housewarming": "Housewarming",
    "gift.occ.thankYou": "Thank you",
    "gift.occ.justBecause": "Just because",
    "gift.occ.other": "Other",
    "gift.budget": "Budget (€)",
    "gift.budgetMin": "Min",
    "gift.budgetMax": "Max",
    "gift.submit": "Find ideas",
    "gift.surprise": "Surprise me",
    "gift.budgetPreset": "Budget brackets",
    "gift.share": "Share these ideas",
    "gift.shareCopied": "Link copied!",
    "share.eyebrow": "Shared gift ideas",
    "share.title": "A selection of gift ideas",
    "share.forOccasion": "For: {what}",
    "share.cta": "Create my own list",
    "share.empty": "This list is empty or the link is invalid.",
    "gift.saved": "My people",
    "gift.personName": "Person's name",
    "gift.personNamePlaceholder": "e.g. Mom",
    "gift.savePerson": "Save this person",
    "gift.updatePerson": "Update",
    "gift.deletePerson": "Delete",
    "gift.hint":
      "This is only used to generate ideas. Stored on this device.",
    "gift.introReply":
      "Here are some gift ideas that fit. Answer the questions to refine them.",

    // Guide article
    "guide.back": "Back",
    "guide.meta": "Buying guide · {updated} · {time} read",
    "guide.checklist": "Key takeaways",
    "guide.picks": "Our picks by budget",
    "guide.picksIntro":
      "Starting points for your search on Amazon by budget. Prices and availability change; only the Amazon page is authoritative.",
    "guide.pickCta": "View on Amazon →",
    "guide.advisorTitle": "Need personalized advice?",
    "guide.advisorText":
      "Answer a few questions and our smart advisor selects the products best suited to your needs.",
    "guide.advisorCta": "Launch the advisor",

    // Mobile
    "m.suggestions": "Suggestions",
    "m.searchHint": 'Ask in plain words — "a quiet keyboard under €80"',
    "m.greetingLead": "Hey {name},",
    "m.greetingLeadAnon": "Hey there,",
    "m.greetingHighlight": "what shall we find today?",
    "m.seeAll": "see all →",
    "m.resume": "Resume",
    "m.noRecents": "No search yet. Start one and you'll find it here.",
    "m.assistantStatus": "● Online · usually replies instantly",
    "m.typeMessage": "Type a message…",
    "m.thinking": "Thinking…",
    "m.poweredBy": "Powered by AI shopping assistant",

    // Lang toggle
    "lang.label": "Language",
  },
};

function interpolate(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] != null ? vars[k] : `{${k}}`,
  );
}

const LangContext = createContext(null);

function detectInitial() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGS.includes(saved)) return saved;
  } catch {
    /* ignore */
  }
  const nav = (typeof navigator !== "undefined" && navigator.language) || "fr";
  return nav.toLowerCase().startsWith("en") ? "en" : "fr";
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
    if (typeof document !== "undefined") document.documentElement.lang = lang;
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
    return {
      lang: "fr",
      setLang: () => {},
      t: (k, v) => interpolate(TRANSLATIONS.fr[k] ?? k, v),
    };
  }
  return ctx;
}
