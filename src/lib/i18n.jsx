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
    "product.priceEstimate": "Prix estimé",
    "product.priceEstimateNote": "Estimation indicative · prix réel sur Amazon",
    "product.shipping": "Livraison gratuite · 30 jours d'essai",
    "product.viewAmazon": "Voir sur Amazon",
    "product.viewPriceAmazon": "Voir le prix sur Amazon",
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
    "appearance.label": "Apparence",
    "appearance.system": "Système",
    "appearance.light": "Clair",
    "appearance.dark": "Sombre",
    "auth.myFriends": "Mes amis",

    // Friends (social graph)
    "friends.title": "Mes amis",
    "friends.sub": "Trouve tes amis et ajoute-les pour leur offrir des cadeaux.",
    "friends.signedOut": "Connecte-toi pour trouver tes amis.",
    "friends.searchPlaceholder": "Rechercher par nom…",
    "friends.searchHint": "Tape au moins 2 lettres.",
    "friends.noResults": "Aucun utilisateur trouvé.",
    "friends.add": "Ajouter",
    "friends.pending": "En attente",
    "friends.friend": "Ami·e",
    "friends.requestSent": "Demande envoyée",
    "friends.requests": "Demandes reçues",
    "friends.accept": "Accepter",
    "friends.decline": "Refuser",
    "friends.myFriends": "Mes amis",
    "friends.empty": "Pas encore d'amis. Utilise la recherche ci-dessus.",
    "friends.remove": "Retirer",
    "friends.removeConfirm": "Retirer {name} de tes amis ?",
    "friends.wishCount": "{n} idées",
    "friends.viewLists": "Voir ses listes",
    "friends.theirLists": "Listes de {name}",
    "friends.noPublicLists": "Aucune liste publique.",
    "friends.back": "← Retour",

    // Notifications / occasions
    "notif.title": "Notifications",
    "notif.requests": "Demandes d'amis",
    "notif.occasions": "Occasions à venir",
    "notif.empty": "Rien de neuf pour l'instant.",
    "occ.birthdayOf": "Anniversaire de {name}",
    "occ.today": "aujourd'hui",
    "occ.tomorrow": "demain",
    "occ.inDays": "dans {n} j",
    "occ.turns": "{age} ans",
    "occ.addTitle": "Ajouter une occasion",
    "occ.labelPlaceholder": "Pour qui / quoi ? (ex : Maman)",
    "occ.add": "Ajouter",
    "occ.recurring": "Chaque année",
    "occ.delete": "Supprimer",
    "holiday.newYear": "Nouvel An",
    "holiday.valentine": "Saint-Valentin",
    "holiday.grandmothersDay": "Fête des grands-mères",
    "holiday.mothersDay": "Fête des mères",
    "holiday.fathersDay": "Fête des pères",
    "holiday.halloween": "Halloween",
    "holiday.christmas": "Noël",

    // Ask a friend's opinion (polls)
    "poll.ask": "Demander l'avis d'un ami",
    "poll.title": "Demander un avis",
    "poll.pickProducts": "Choisis 2 à 4 produits",
    "poll.pickFriends": "À qui demander ?",
    "poll.noProducts": "Ajoute d'abord des produits à tes sélections.",
    "poll.noFriends": "Ajoute d'abord des amis.",
    "poll.send": "Envoyer le sondage",
    "poll.sent": "Sondage envoyé !",
    "poll.incoming": "On te demande ton avis",
    "poll.from": "{name} hésite — ton avis ?",
    "poll.vote": "Je choisis celui-ci",
    "poll.voted": "Ton choix ✓",
    "poll.outgoing": "Tes sondages",
    "poll.noVotes": "En attente de votes…",
    "poll.votes": "Votes",

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
    "profile.birthday": "Date de naissance",
    "profile.birthdayHint": "Partagée avec tes amis pour les rappels d'anniversaire.",
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
    "selections.share": "Partager ma liste",
    "selections.shareCopied": "Lien copié !",
    "selections.priceNote":
      "Prix indicatif au moment de l'enregistrement — seule la page Amazon fait foi.",
    "share.wishEyebrow": "Liste d'envies partagée",
    "share.wishTitle": "La liste d'envies de {name}",
    "share.wishTitleAnon": "Une liste d'envies",

    // Lists (collections)
    "lists.addTo": "Ajouter à une liste",
    "lists.public": "Publique",
    "lists.private": "Privée",
    "lists.emptyShort": "Aucune liste — créez-en une",
    "lists.newPlaceholder": "Nom de la liste",
    "lists.createBtn": "Créer",
    "lists.title": "Mes listes",
    "lists.all": "Tout",
    "lists.unfiled": "Sans liste",
    "lists.makePublic": "Rendre publique",
    "lists.makePrivate": "Rendre privée",
    "lists.rename": "Renommer",
    "lists.delete": "Supprimer la liste",
    "lists.deleteConfirm": "Supprimer la liste « {name} » ? Les produits restent dans tes autres listes.",
    "lists.count": "{n} produit(s)",
    "lists.visibilityPublicNote": "Visible par tes amis",
    "lists.visibilityPrivateNote": "Visible par toi seul",

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
    "gift.friendsSection": "Offrir à un ami",
    "gift.friendPrivate": "Le profil de {name} reste privé — il sert à générer les idées.",
    "gift.changeRecipient": "Changer",
    "gift.orManual": "Ou décris la personne",
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
    "product.priceEstimate": "Estimated price",
    "product.priceEstimateNote": "Indicative estimate · real price on Amazon",
    "product.shipping": "Free delivery · 30-day trial",
    "product.viewAmazon": "View on Amazon",
    "product.viewPriceAmazon": "See price on Amazon",
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
    "appearance.label": "Appearance",
    "appearance.system": "System",
    "appearance.light": "Light",
    "appearance.dark": "Dark",
    "auth.myFriends": "My friends",

    // Friends (social graph)
    "friends.title": "My friends",
    "friends.sub": "Find your friends and add them to gift them.",
    "friends.signedOut": "Sign in to find your friends.",
    "friends.searchPlaceholder": "Search by name…",
    "friends.searchHint": "Type at least 2 letters.",
    "friends.noResults": "No user found.",
    "friends.add": "Add",
    "friends.pending": "Pending",
    "friends.friend": "Friend",
    "friends.requestSent": "Request sent",
    "friends.requests": "Friend requests",
    "friends.accept": "Accept",
    "friends.decline": "Decline",
    "friends.myFriends": "My friends",
    "friends.empty": "No friends yet. Use the search above.",
    "friends.remove": "Remove",
    "friends.removeConfirm": "Remove {name} from your friends?",
    "friends.wishCount": "{n} ideas",
    "friends.viewLists": "View lists",
    "friends.theirLists": "{name}'s lists",
    "friends.noPublicLists": "No public list.",
    "friends.back": "← Back",

    // Notifications / occasions
    "notif.title": "Notifications",
    "notif.requests": "Friend requests",
    "notif.occasions": "Upcoming occasions",
    "notif.empty": "Nothing new yet.",
    "occ.birthdayOf": "{name}'s birthday",
    "occ.today": "today",
    "occ.tomorrow": "tomorrow",
    "occ.inDays": "in {n}d",
    "occ.turns": "turns {age}",
    "occ.addTitle": "Add an occasion",
    "occ.labelPlaceholder": "For whom / what? (e.g. Mom)",
    "occ.add": "Add",
    "occ.recurring": "Every year",
    "occ.delete": "Delete",
    "holiday.newYear": "New Year",
    "holiday.valentine": "Valentine's Day",
    "holiday.grandmothersDay": "Grandmothers' Day",
    "holiday.mothersDay": "Mother's Day",
    "holiday.fathersDay": "Father's Day",
    "holiday.halloween": "Halloween",
    "holiday.christmas": "Christmas",

    // Ask a friend's opinion (polls)
    "poll.ask": "Ask a friend's opinion",
    "poll.title": "Ask for advice",
    "poll.pickProducts": "Pick 2 to 4 products",
    "poll.pickFriends": "Who to ask?",
    "poll.noProducts": "Add some products to your selections first.",
    "poll.noFriends": "Add some friends first.",
    "poll.send": "Send the poll",
    "poll.sent": "Poll sent!",
    "poll.incoming": "Your opinion is asked",
    "poll.from": "{name} is unsure — your pick?",
    "poll.vote": "I pick this one",
    "poll.voted": "Your pick ✓",
    "poll.outgoing": "Your polls",
    "poll.noVotes": "Waiting for votes…",
    "poll.votes": "Votes",

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
    "profile.birthday": "Birthday",
    "profile.birthdayHint": "Shared with your friends for birthday reminders.",
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
    "selections.share": "Share my list",
    "selections.shareCopied": "Link copied!",
    "selections.priceNote":
      "Indicative price at time of saving — only the Amazon page is authoritative.",
    "share.wishEyebrow": "Shared wishlist",
    "share.wishTitle": "{name}'s wishlist",
    "share.wishTitleAnon": "A wishlist",

    // Lists (collections)
    "lists.addTo": "Add to a list",
    "lists.public": "Public",
    "lists.private": "Private",
    "lists.emptyShort": "No list yet — create one",
    "lists.newPlaceholder": "List name",
    "lists.createBtn": "Create",
    "lists.title": "My lists",
    "lists.all": "All",
    "lists.unfiled": "Unfiled",
    "lists.makePublic": "Make public",
    "lists.makePrivate": "Make private",
    "lists.rename": "Rename",
    "lists.delete": "Delete list",
    "lists.deleteConfirm": "Delete the list “{name}”? Products stay in your other lists.",
    "lists.count": "{n} item(s)",
    "lists.visibilityPublicNote": "Visible to your friends",
    "lists.visibilityPrivateNote": "Visible to you only",

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
    "gift.friendsSection": "Gift a friend",
    "gift.friendPrivate": "{name}'s profile stays private — it's used to generate the ideas.",
    "gift.changeRecipient": "Change",
    "gift.orManual": "Or describe the person",
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
