# Handoff: Bestbuys — Conseiller produit conversationnel

## Overview
Bestbuys est un site web qui aide un utilisateur à choisir un produit (téléphone, ordinateur portable, casque audio) sans savoir lequel acheter. L'utilisateur tape sa recherche, puis un chat conversationnel à gauche pose 3 questions ciblées (usage, priorité, budget) pendant qu'un panneau de droite affiche en temps réel le top 5 des produits qui correspondent — avec une carte "hero" mettant en avant le meilleur match (score % de correspondance, badge, prix, specs, bouton acheter) et 4 cartes plus petites en dessous.

## About the Design Files
Les fichiers livrés dans ce bundle sont des **références de design en HTML/CSS/JSX** — des prototypes haute-fidélité montrant l'apparence et le comportement souhaités, **pas du code de production à copier-coller**.

La tâche du développeur est de **recréer ces designs dans l'environnement cible du projet** (React + Vite/Next, Vue, etc.) en utilisant les patterns et bibliothèques de l'équipe. Si aucun environnement n'existe encore, choisir un stack moderne (React + Vite + TypeScript recommandé) et l'implémenter là-bas.

Le JSX in-browser via Babel utilisé dans le prototype n'est pas adapté à la production : il faut migrer vers un vrai bundler, typer en TypeScript, et brancher des APIs réelles.

## Fidelity
**High-fidelity (hifi)**. Couleurs finales, typographie finale, spacing, interactions et animations à reproduire au pixel près.

## Screens / Views

### 1. Page d'accueil (style Google)
- **Layout**: flex vertical pleine hauteur, contenu centré verticalement, footer collé en bas
- **Logo "Bestbuys"**: police Outfit 700, taille 92px, letter-spacing -0.045em, couleur terracotta (`oklch(0.62 0.14 38)`), centré
- **Barre de recherche**:
  - max-width 580px, fond blanc, bordure 0.5px rgba(26,24,20,0.09), radius 999px, padding 6px 6px 6px 22px
  - Icône loupe 20px à gauche (couleur `#9B9583`)
  - Input height 44px, font-size 16px, placeholder "Que cherchez-vous aujourd'hui ?"
  - Bouton submit circulaire 40×40px, fond noir `#1A1814`, icône flèche, hover devient terracotta + scale(1.05)
  - Focus-within: ring 4px `oklch(0.94 0.04 50 / 0.55)` + bordure terracotta
- **Suggestions chips**: 4 chips avec icône SVG par catégorie (téléphone / ordinateur / casque), bordure 0.5px, padding 7px 14px 7px 11px, gap 7px, radius 999px, icône en couleur accent
- **Footer**: bordure top, fond `#F4F1EA`, font-size 13px, liens à gauche (À propos / Comment ça marche / Marchands partenaires) et à droite (Aide / Confidentialité / Conditions)

### 2. Application principale (deux panneaux)
Layout: `grid-template-columns: minmax(380px, 38%) 1fr`, hauteur 100vh.

#### Panneau chat (gauche)
- Fond `#F4F1EA`, border-right 0.5px
- Header: avatar carré 38px noir avec lettre "B" en Instrument Serif italic, titre "Bestbuys", sous-titre "Conseiller en ligne" avec point vert clignotant
- Barre de progression 2px sous le header
- Stream de messages: bulles bot alignées à gauche (fond blanc, bordure, radius 16px avec corner inférieur gauche réduit à 6px), bulles user alignées à droite (fond noir, texte crème)
- Animation bubbleIn: opacity 0→1, translateY 6px→0, 0.35s
- Indicateur typing: 3 dots qui sautent en séquence (1.2s)
- Choices chips: arrondis 999px, hover devient terracotta + accent-soft
- Input bas: input arrondi + bouton submit circulaire noir 40×40

#### Panneau résultats (droite)
- Header: eyebrow "TOP 5 SÉLECTION" en terracotta, titre en Instrument Serif 38px, compteur "X/3 critères"
- **Hero card** (premier produit):
  - Padding 28px, radius 20px, fond blanc, shadow-md, gradient radial subtil dans le coin haut-droit
  - Badge "Meilleur match" noir avec dot vert, top-left
  - Grid: image 240px | meta flex | score-ring auto
  - Titre Instrument Serif 34px, étoiles + note + nb avis
  - Specs en grille 2 col avec puces terracotta
  - Bottom: prix Instrument Serif 42px + bouton "Voir détails" noir → terracotta au hover
  - Score-ring 92px à droite (SVG cercle progress, stroke vert si ≥85, terracotta si ≥70)
- **Grid 2×2 des 4 autres produits**: cartes plus petites avec image 96px, rank #2-#5, mini score chip en accent-soft

### 3. Modal détail produit
- Backdrop blur 8px, bg rgba(26,24,20,0.4)
- Carte 880px max, radius 20px
- Grid 2 colonnes: image (fond `#F4F1EA`) | détails
- Score row mis en avant avec ring 56px
- Bouton "Acheter maintenant" big, terracotta au hover

## Interactions & Behavior
- Click sur chip de suggestion ou submit recherche → détecte la catégorie via mots-clés (`detectCategory`) → entre en mode chat avec la requête comme premier message
- Chat: à chaque réponse, ajoute message user + délai 800ms + nouvelle question bot
- Panneau résultats: ré-classe les produits via `scoreProduct` à chaque réponse, refresh avec animation contentFade (0.55s)
- Click sur carte produit → ouvre modal détail
- Bouton "Acheter" → message confirmation dans chat (à brancher sur vrai marchand en prod)
- Bouton ↻ dans le chat → revient à la page d'accueil

## State Management
```ts
{
  category: 'phone' | 'laptop' | 'headphones' | null,
  initialQuery: string,
  answers: Record<questionId, choiceId>,
  messages: Array<{ role: 'bot' | 'user', text: string }>,
  questionIdx: number,
  isTyping: boolean,
  selected: Product | null, // pour modal
}
```

## Design Tokens

### Couleurs
- `--bg`: `#FAF8F4` (crème chaud)
- `--bg-elev`: `#FFFFFF`
- `--bg-soft`: `#F4F1EA`
- `--text`: `#1A1814`
- `--text-muted`: `#6B6555`
- `--text-faint`: `#9B9583`
- `--border`: `rgba(26, 24, 20, 0.09)`
- `--accent` (terracotta): `oklch(0.62 0.14 38)`
- `--accent-soft`: `oklch(0.94 0.04 50)`
- `--accent-good` (vert score haut): `oklch(0.62 0.13 155)`
- `--accent-warn` (étoiles): `oklch(0.7 0.14 70)`

### Typographie
- Sans (UI): **Inter** 400/500/600/700
- Display (titres serif): **Instrument Serif** regular + italic
- Logo: **Outfit** 700 (style Vinted-like)

### Radius
- 14px (cartes standard)
- 20px (hero, modal)
- 999px (boutons, chips, barre de recherche)

### Shadows
- sm: `0 1px 2px rgba(26,24,20,0.04), 0 1px 3px rgba(26,24,20,0.04)`
- md: `0 6px 24px -8px rgba(26,24,20,0.12), 0 2px 6px rgba(26,24,20,0.04)`
- lg: `0 24px 60px -20px rgba(26,24,20,0.18), 0 4px 12px rgba(26,24,20,0.06)`

## Backend à construire (PAS dans le prototype)
- API catalogue produits (id, brand, model, price, rating, reviews, tags, specs, images réelles)
- API de scoring/recommandation (le `scoreProduct` actuel est un stub à base de tags)
- Idéalement remplacer le chat scripté par un vrai LLM avec tools (`get_products`, `refine_search`)
- Intégration marchands (liens d'achat affiliés)
- Sessions / historique utilisateur

## Assets
Les images produits du prototype sont des **mockups CSS** (formes abstraites colorées). En production, utiliser de vraies photos produit.

Polices: chargées depuis Google Fonts (Inter, Instrument Serif, Outfit).

## Files inclus dans ce dossier
- `Bestbuys.html` — entry point
- `app.jsx` — orchestrateur principal + page d'accueil
- `chat-panel.jsx` — panneau chat gauche
- `product-card.jsx` — Hero card, Small card, ScoreRing, ProductImage
- `scoring.jsx` — moteur de scoring (à remplacer par vrai backend)
- `data.jsx` — données produits factices + questions
- `tweaks-panel.jsx` — panneau de tweaks design (peut être supprimé en prod)
- `styles.css` — toutes les styles
