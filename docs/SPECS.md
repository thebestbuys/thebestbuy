# Oraklia — Spécifications fonctionnelles détaillées

> **Produit** : Oraklia — conseiller d'achat IA, bilingue (FR/EN), qui interroge
> l'utilisateur de façon adaptative puis recommande des produits réels d'Amazon.fr
> via des liens affiliés.
> **Stack** : React + Vite (SPA), fonctions serverless Vercel (`api/`), Google
> Gemini (`gemini-3.1-flash-lite`), Amazon Creators API, Supabase (cloud),
> Capacitor (build Android).
>
> _Note de marque : l'UI affiche « Oraklia » ; `package.json`, `capacitor.config.json`
> et certaines clés localStorage (`bb_*`) gardent l'ancien nom « bestbuys » — voir
> [CLAUDE.md](../CLAUDE.md)._

Ce document décrit **ce que fait le produit** (specs fonctionnelles) et **comment
on l'utilise** (cas d'usage). Chaque section ci-dessous est **repliable** (clic sur
le titre). Il ne remplace pas la doc d'architecture (voir `CLAUDE.md`).

---

<details open>
<summary><b>1. Vision &amp; principes</b></summary>

<br>

| Principe | Implication concrète |
|---|---|
| **Conseiller, pas moteur de recherche** | On guide l'utilisateur par des questions adaptatives, on ne liste pas des centaines de résultats. On présente **3 produits** maximum, justifiés. |
| **Confiance avant tout** | On ne montre un prix/une note/une image « exacts » que si la donnée a été **vérifiée** chez Amazon (`amazon_verified`). Sinon : fourchette **estimée** clairement labellisée, pas d'étoiles, pas d'image Amazon. |
| **Conformité Amazon Affiliés** | Mention d'affiliation visible, liens sortants `rel="noopener noreferrer sponsored"`, jamais de fausse donnée Amazon, contenu éditorial (guides) de valeur. |
| **Dégradation gracieuse** | Si l'IA ou l'API Amazon échoue (quota, réseau, compte non éligible), l'app ne casse jamais : fallback en estimations, message d'erreur + **bouton Réessayer**. |
| **Une seule UI responsive** | Même `App.jsx` pour desktop / tablette / mobile / APK. Adaptation par media queries + hook `useIsNarrow()` (< 980 px). |

</details>

---

<details>
<summary><b>2. Acteurs (personas)</b></summary>

<br>

| Acteur | Description | Accès |
|---|---|---|
| **Visiteur anonyme** | Utilise l'app sans compte. Données en `localStorage` uniquement. | Recherche, conseiller, guides, favoris locaux. |
| **Utilisateur connecté** | Authentifié (social login). Données mirrorées dans Supabase. | + synchro multi-appareils, amis, tendances du cercle, rappels d'occasions, demande d'avis. |
| **Ami (cercle)** | Utilisateur connecté lié par une amitié acceptée. | Source des « tendances de mon cercle » ; destinataire de demandes d'avis / cadeaux. |
| **Système (IA + backend)** | Gemini (questions/reco) + Amazon Creators API (vérification) + Supabase (RPC). | — |

</details>

---

<details>
<summary><b>3. Cartographie fonctionnelle</b></summary>

<br>

```
Accueil (recherche + suggestions + tendances cercle + historique + guides)
 ├─ Conseiller (boucle Q/R adaptative → 3 recommandations)
 │   ├─ Mode "self"  : recherche d'un produit pour soi
 │   └─ Mode "gift"  : idée cadeau pour un proche (occasion + budget connus)
 ├─ Fiche produit (modale détaillée → lien Amazon)
 ├─ Favoris / Listes (privées ou publiques)
 ├─ Amis & cercle (demandes, tendances, demande d'avis)
 ├─ Rappels d'occasions (anniversaires, fêtes)
 ├─ Guides d'achat (pages SEO prérendues, URL réelles)
 ├─ Partage (liste cadeaux via lien, lecture seule)
 └─ Profil / Langue / Mentions légales
```

</details>

---

<details>
<summary><b>4. Spécifications par domaine</b></summary>

<br>

<details>
<summary>4.1 — Accueil (<code>CategoryPicker</code>)</summary>

<br>

**But** : point d'entrée ; lancer une recherche ou rebondir sur du contenu.

- **Barre de recherche libre** : l'utilisateur décrit ce qu'il cherche (texte
  libre). À la soumission, `detectCategory()` tente de mapper vers une catégorie
  connue (`phone`/`laptop`/`headphones`) ; sinon la requête brute sert d'`objet`.
- **Puces de suggestion** : 8 raccourcis (téléphone, PC portable, TV, écouteurs,
  montre, aspirateur, café, enceinte).
- **CTA secondaires** : « Trouver un cadeau 🎁 » (mode gift) et « Occasions 📅 »
  (rappels).
- **Tendances dans mon cercle** (connecté only) : produits les plus
  sauvegardés/cliqués par les amis consentants (RPC `circle_trending`).
- **Historique récent** : 6 dernières conversations (reprise en 1 clic).
- **Guides** : cartes vers les guides d'achat éditoriaux.
- **Pied de page** : mention d'affiliation + mentions légales.

</details>

<details>
<summary>4.2 — La boucle du conseiller (cœur du produit)</summary>

<br>

Le client construit un **objet de critères compact** — pas une transcription :
`objet` + `answers = [{id, q, a, tags, min, max}]`.

- **Première question = budget**, avec 4 tranches dont les bornes €
  (`min`/`max`) sont adaptées par l'IA au prix réel typique de l'objet.
- Ensuite, **une question à la fois** (2–4 choix), sur une dimension non encore
  couverte. Les choix peuvent porter des `tags` (`ios`, `anc`, `gaming`…).
- **Déclenchement des recommandations** (`shouldRecommendAt`) :
  - mode **self** : à la **5ᵉ** réponse, puis toutes les **+3** (8, 11, …) ;
  - mode **gift** : **immédiatement** (budget + occasion déjà connus), puis +3.
- **Barre de progression honnête** : « Question 3 sur 5 · bientôt tes
  recommandations » → « Affine pour de meilleures suggestions » → « Sélection
  prête ✓ ».

**Capacités utilisateur dans la boucle :**

| Capacité | Comportement |
|---|---|
| Répondre par puce | Enregistre la réponse + relance `advance()`. |
| Répondre en texte libre | Champ toujours disponible. |
| **« Peu importe »** | Chip d'échappement : réponse neutre, sans borne (budget → pas de filtre prix). |
| **Choix multiple** | Si la question est `multi`, toggles + bouton « Valider » → une réponse fusionnée (labels joints, tags unionnés). |
| **Modifier une réponse** | Clic sur une bulle utilisateur → éditeur **en place** sous la bulle ; le nouveau choix remplace **uniquement** cette réponse, les suivantes sont conservées, et les recommandations se rafraîchissent. |
| **« Voir mes recommandations maintenant »** | Force une reco avant le palier des 5 réponses. |
| **« Voir d'autres produits »** | Régénère 3 picks différents (mécanisme `exclude`), mêmes critères. |
| **Réessayer** | Sur erreur IA/réseau, re-déclenche la dernière action. |
| Recommencer / Accueil / Historique | Boutons d'en-tête du chat. |

</details>

<details>
<summary>4.3 — Recommandations &amp; vérification</summary>

<br>

- L'IA propose ~10 produits ; le backend les **vérifie** chez Amazon et renvoie
  les **3 meilleurs** (`api/chat.js`).
- Vérification via **Amazon Creators API** (`searchItems` + `pickBestItem`) :
  prix réel, image, lien affilié direct (`detailPageURL`). Les bornes de budget
  choisies sont passées en `minPrice`/`maxPrice` (±10 %).
- **Drapeau `amazon_verified`** par produit :
  - `true` → prix exact, note/étoiles (si dispo), image Amazon, badge **« Vérifié »**.
  - `false` → fourchette **estimée** labellisée, pas d'étoiles, image placeholder CSS.
- **Note & avis** : non fournis par l'API → restent masqués (jamais inventés).
- **Badge budget** : chaque carte indique « Dans ton budget » / « Au-dessus »
  selon la tranche choisie (tolérance 5 %).
- **Affichage** :
  - **Desktop** : panneau résultats à droite (HeroCard + 2 SmallCard) ;
  - **Mobile** : cartes « lien partagé » (`ProductLinkCard`) **dans le fil de chat**.
- **Skeletons** pendant qu'une reco est en vol (anti-flicker).
- **Passerelle guide** : encart « Pour aller plus loin : *{guide}* ».

</details>

<details>
<summary>4.4 — Fiche produit (<code>ProductDetail</code>)</summary>

<br>

Modale : image, marque/modèle, note (si vérifiée), score de correspondance
(`ScoreRing`), « pourquoi ce produit », caractéristiques, prix (exact ou estimé
labellisé), favori, **CTA « Voir sur Amazon »** (`rel="...sponsored"`, log du clic
pour les tendances).

</details>

<details>
<summary>4.5 — Mode cadeau (<code>GiftPanel</code> → boucle gift)</summary>

<br>

- Formulaire destinataire : relation, occasion, budget, (option « surprise »).
- Pour un **ami**, le profil privé de l'ami est résolu **côté serveur** (amitié
  vérifiée) et n'atteint jamais le client.
- Reco immédiate, puis affinage. **Partage** de la liste via lien autoportant
  (`?s=`/`?share=`) ouvrant une vue **lecture seule** (`SharedGiftList`).

</details>

<details>
<summary>4.6 — Favoris &amp; listes (<code>FavoriteButton</code>, <code>SelectionsPanel</code>)</summary>

<br>

- Sauvegarde dans une ou plusieurs **listes nommées** (privées ou publiques).
- Identité produit stable via `productKey` (marque+modèle), pas le rang.
- **Toasts** de confirmation (ajout/retrait/création de liste).

</details>

<details>
<summary>4.7 — Social &amp; cercle (<code>FriendsPanel</code>, <code>AskOpinionPanel</code>)</summary>

<br>

- Demandes d'amis, acceptation.
- **Tendances du cercle** : agrégation serveur (`circle_trending`) des produits
  sauvegardés/cliqués par amis consentants ; partage **opt-out** (`shareTrends`).
- **Demande d'avis** : solliciter l'avis d'amis sur une sélection.
- Lectures inter-utilisateurs via **RPC SECURITY DEFINER** scoping aux amitiés.

</details>

<details>
<summary>4.8 — Rappels d'occasions (<code>NotificationsPanel</code>)</summary>

<br>

- Anniversaires d'amis + fêtes (`holidays.js`, `occasions.js`).
- Depuis un rappel : anniversaire ami → démarre le cadeau ; fête → ouvre le
  formulaire cadeau prérempli avec l'occasion.

</details>

<details>
<summary>4.9 — Guides d'achat (<code>GuideArticle</code>, <code>data/guides.js</code>)</summary>

<br>

- Guides éditoriaux bilingues, **URL réelles** (`/guide/<slug>`) **prérendues**
  au build (`scripts/prerender.mjs`) avec title/description/canonical + JSON-LD,
  + `sitemap.xml`. Satisfait l'exigence Amazon « site de valeur ».
- Un guide peut **lancer le conseiller** sur sa catégorie.

</details>

<details>
<summary>4.10 — Compte, langue, navigation</summary>

<br>

- Auth sociale (`AuthMenu`, `auth.jsx`) ; à la connexion, synchro Supabase.
- Bascule **FR/EN** (`LangToggle`, dictionnaires dans `i18n.jsx`).
- **Mode sombre auto** : suit `prefers-color-scheme` (mode `system` dans `theme.js`).
- **Routing sans librairie** : `App.jsx` state-driven ; interception du **bouton
  Retour** navigateur (History API). Seuls guides et mentions légales portent une URL.

</details>

</details>

---

<details>
<summary><b>5. Cas d'usage détaillés (UC-01 → UC-12)</b></summary>

<br>

> Format : **Acteur · Préconditions · Scénario nominal · Variantes/erreurs · Résultat.**

<details>
<summary>UC-01 — Trouver un produit pour soi (parcours nominal)</summary>

<br>

- **Acteur** : Visiteur anonyme.
- **Préconditions** : aucune.
- **Scénario nominal** :
  1. Sur l'accueil, l'utilisateur tape « casque sans fil » et valide.
  2. Le conseiller pose le **budget** (4 tranches adaptées).
  3. L'utilisateur répond, puis enchaîne 4 questions (usage, ANC, autonomie…).
  4. À la 5ᵉ réponse, **3 recommandations** vérifiées s'affichent (prix exact,
     badge « Vérifié », badge budget, justification).
  5. Il ouvre une fiche produit, puis clique **« Voir sur Amazon »** → onglet Amazon.
- **Variantes** :
  - 4a. Il clique **« Voir mes recommandations maintenant »** dès la 2ᵉ réponse.
  - 4b. Il clique **« Voir d'autres produits »** → 3 alternatives différentes.
  - 3a. Une question ne l'inspire pas → **« Peu importe »**.
- **Erreurs** :
  - 4e. Quota IA épuisé → message d'erreur + **Réessayer**.
- **Résultat** : conversation sauvegardée dans l'historique ; clic affilié loggé.

</details>

<details>
<summary>UC-02 — Corriger une réponse en cours de route</summary>

<br>

- **Acteur** : Visiteur anonyme.
- **Préconditions** : au moins une réponse donnée.
- **Scénario nominal** :
  1. L'utilisateur clique sur une **bulle de réponse** précédente (crayon ✎).
  2. Un éditeur s'ouvre **sous la bulle** avec la question d'origine.
  3. Il choisit une nouvelle valeur.
  4. Seule cette réponse change ; les réponses suivantes et la question en
     attente sont **conservées** ; les recommandations se rafraîchissent.
- **Variantes** : 3a. Il annule (✕) → rien ne change.
- **Résultat** : critères mis à jour sans perdre la progression.

</details>

<details>
<summary>UC-03 — Question à choix multiples</summary>

<br>

- **Acteur** : Utilisateur (self ou gift).
- **Préconditions** : l'IA renvoie une question `multi: true`.
- **Scénario nominal** :
  1. La question affiche des **toggles** (ex. fonctionnalités souhaitées).
  2. L'utilisateur en sélectionne plusieurs puis clique **« Valider »**.
  3. Une réponse unique est enregistrée (labels joints, tags unionnés).
- **Variantes** : 2a. Valider sans rien cocher = **« Peu importe »**.

</details>

<details>
<summary>UC-04 — Recommandation respectant le budget</summary>

<br>

- **Acteur** : Utilisateur.
- **Préconditions** : une tranche de budget a été choisie.
- **Scénario nominal** :
  1. Les produits proposés sont filtrés par l'API selon la tranche (±10 %).
  2. Chaque carte affiche **« Dans ton budget »** ou **« Au-dessus »** (tol. 5 %).
- **Résultat** : décision facilitée, alignée sur la contrainte de prix.

</details>

<details>
<summary>UC-05 — Donnée non vérifiable (dégradation gracieuse)</summary>

<br>

- **Acteur** : Système / Utilisateur.
- **Préconditions** : Amazon API indisponible (403 non éligible / 429 quota / réseau).
- **Scénario nominal** :
  1. La vérification renvoie `{found:null}` → `amazonBlocked`.
  2. La carte affiche une **fourchette estimée** labellisée, **pas d'étoiles**,
     **pas de badge « Vérifié »**, image placeholder.
- **Résultat** : l'app reste utilisable ; aucune donnée Amazon inventée.

</details>

<details>
<summary>UC-06 — Offrir un cadeau à un ami</summary>

<br>

- **Acteur** : Utilisateur connecté.
- **Préconditions** : l'ami a une amitié acceptée (pour profil privé).
- **Scénario nominal** :
  1. « Trouver un cadeau » → choix relation, occasion, budget.
  2. Le backend résout le profil privé de l'ami (côté serveur) et propose
     **immédiatement** des idées variées.
  3. L'utilisateur affine, puis **partage** la liste via un lien.
  4. Le destinataire ouvre le lien → vue **lecture seule**.
- **Variantes** : 1a. Démarré depuis un **rappel d'anniversaire**.

</details>

<details>
<summary>UC-07 — Reprendre une conversation</summary>

<br>

- **Acteur** : Utilisateur.
- **Scénario nominal** :
  1. Sur l'accueil, section « Historique » → clic sur une conversation.
  2. L'état complet est restauré (critères, messages, produits, question en attente).
- **Note** : connecté, l'historique est mirroré dans Supabase (multi-appareils).

</details>

<details>
<summary>UC-08 — Sauvegarder dans une liste</summary>

<br>

- **Acteur** : Utilisateur.
- **Scénario nominal** :
  1. Clic sur le ❤ d'une carte → picker de listes.
  2. Coche une liste (ou en crée une) → **toast** de confirmation.
- **Résultat** : produit retrouvable dans « Mes sélections ».

</details>

<details>
<summary>UC-09 — Découvrir via les tendances du cercle</summary>

<br>

- **Acteur** : Utilisateur connecté avec amis consentants.
- **Scénario nominal** :
  1. Sur l'accueil, « Tendances dans mon cercle » liste les produits populaires
     auprès des amis.
  2. Clic → fiche produit.
- **Précondition de confidentialité** : un ami ne contribue que si `shareTrends ≠ false`.

</details>

<details>
<summary>UC-10 — Lire un guide (entrée SEO)</summary>

<br>

- **Acteur** : Visiteur (souvent via moteur de recherche).
- **Scénario nominal** :
  1. Arrivée directe sur `/guide/<slug>` (page prérendue).
  2. Lecture, puis **« Lancer le conseiller »** sur la catégorie du guide.
- **Variante** : depuis les résultats, encart **« Pour aller plus loin »**.

</details>

<details>
<summary>UC-11 — Changer de langue</summary>

<br>

- **Acteur** : Tout utilisateur.
- **Scénario** : bascule FR↔EN ; toute l'UI (questions, choix, libellés) suit.

</details>

<details>
<summary>UC-12 — Récupérer après une erreur réseau</summary>

<br>

- **Acteur** : Utilisateur.
- **Scénario nominal** :
  1. Une réponse échoue (réseau coupé) → bulle d'erreur + **Réessayer**.
  2. Clic sur **Réessayer** → la dernière action est rejouée.

</details>

</details>

---

<details>
<summary><b>6. Exigences non fonctionnelles</b></summary>

<br>

| Domaine | Exigence |
|---|---|
| **Conformité Amazon** | Mention d'affiliation visible (footers, guides, légal) ; liens `rel="noopener noreferrer sponsored"` ; tag `oraklia123-21` sur **toute** URL Amazon ; jamais de prix/note/image inventés ; contenu éditorial présent. |
| **Performance** | Panneaux **code-splittés** (`React.lazy`) + **prefetch** au repos. Skeletons pour masquer la latence. Caches backend (token + résultats 6 h) pour préserver le quota Amazon. |
| **Résilience** | Aucune panne IA/Amazon ne casse l'app (fallback estimations, Réessayer). Fast-fail des vérifications pour la latence. |
| **Accessibilité** | `aria-live` sur le flux de chat ; `aria-label`/`title` sur les actions ; `prefers-reduced-motion` respecté (skeletons, toasts). _À renforcer : focus-trap modale (#8)._ |
| **i18n** | FR + EN ; **toute** nouvelle clé ajoutée aux deux dictionnaires. |
| **Persistance** | localStorage d'abord ; mirroring Supabase si connecté ; lectures inter-utilisateurs via RPC scoping amitiés. |
| **Multi-plateforme** | Web (`base:'/'`) et Capacitor (`base:'./'`, `--mode capacitor`). |

</details>

---

<details>
<summary><b>7. Modèle de données (résumé fonctionnel)</b></summary>

<br>

| Entité | Champs clés | Stockage |
|---|---|---|
| **Conversation** | `id`, `title`, `category`, `objet`, `answers[]`, `messages[]`, `recommendedProducts[]`, `done`, `gift?` | localStorage (`bb_conversations*`) + Supabase si connecté |
| **Réponse (critère)** | `id`, `q`, `a`, `tags[]`, `min`, `max` (+ `_q`/`_msgIndex` client-only pour l'édition) | dans la conversation |
| **Produit** | `brand`, `model`, `price`, `score`, `specs[]`, `why`, `amazon_url`, `image_url`, `rating?`, `reviews?`, **`amazon_verified`** | mémoire / conversation |
| **Liste / favoris** | listes nommées, `visibility` (privé/public), produits liés par `productKey` | localStorage (`selections.js`) + Supabase |
| **Profil** | self-description libre, `shareTrends` | localStorage + `profiles.data` |
| **Amitié / tendances / clics** | `friendships`, `selections`, `link_clicks` | Supabase (RPC `list_friends`, `circle_trending`) |

</details>

---

<details>
<summary><b>8. Historique des améliorations UX livrées</b></summary>

<br>

> Fonctionnalités ajoutées récemment et présentes en prod.

1. **Édition de réponse en place** (tap-to-edit, sans perdre les suivantes).
2. **« Peu importe »** sur chaque question.
3. **Questions à choix multiples** (`multi`).
4. **Progression réelle** (label + barre ancrés sur le palier de reco).
5. **Skeletons** de chargement des recommandations.
6. **« Pourquoi ce produit »** affiché sur toutes les cartes.
7. **Bouton Réessayer** sur les erreurs.
8. **« Voir d'autres produits »** (mécanisme `exclude`).
9. **Badge « Vérifié »** Amazon.
10. **Lazy-load** des panneaux + **prefetch** au repos.
11. **« Voir mes recommandations maintenant »**.
12. **Badge budget** (« Dans ton budget » / « Au-dessus »).
13. **Passerelle guides** dans les résultats.
14. **Toasts** de confirmation.

</details>

---

<details>
<summary><b>9. Backlog / pistes non encore implémentées</b></summary>

<br>

| # | Idée | Effort | Valeur |
|---|---|---|---|
| #5 | **Vue comparaison** des 3 produits (tableau côte à côte) | Moyen | Décision |
| #8 | **A11y modale** : focus-trap + Échap | Faible | Accessibilité |
| #10 | **Streaming** du texte IA (effet machine à écrire) | Moyen | Perçu |
| — | **Récap des critères** repliable (« ce que je sais ») | Moyen | Contrôle/confiance |
| — | **Partage d'un produit seul** (hors liste cadeau) | Faible | Viralité |
| — | **Autocomplétion** de la recherche d'accueil | Moyen | Découverte |
| — | **Budget : saisie libre** / curseur au-delà des tranches | Moyen | Précision |
| — | **Focus clavier** : focus auto 1er choix, navigation puces | Faible | A11y/power users |
| — | **Bannière hors-ligne** (détection `navigator.onLine`) | Faible | Résilience |

</details>

---

_Dernière mise à jour : 2026-06-20._
