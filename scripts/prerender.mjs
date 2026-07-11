// Post-build prerender (plain Node — runs after `vite build`).
//
// The app is a state-driven SPA, so guides/legal have no server HTML. This
// script writes static, crawlable pages for the SEO/shareable views:
//   dist/guide/<slug>/index.html   (the 5 buying guides, FR)
//   dist/mentions-legales/index.html
// each with a per-page <title>/description/canonical + (guides) Article JSON-LD,
// and the content baked into #root. The React app boots on top and takes over.
// It also regenerates dist/sitemap.xml so it always lists the real URLs.
//
// Content comes from src/data/guides.js (pure data, no JSX/browser) — the same
// source GuideArticle.jsx renders, so the markup/classes below mirror it.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { GUIDES, localizeGuide, affiliateSearch, giftGuides } from '../src/data/guides.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ORIGIN = 'https://oraklia.fr';

// French labels (mirror of the i18n FR dict for the static guide chrome).
const L = {
  back: 'Retour',
  close: 'Fermer',
  meta: (updated, time) => `Guide d'achat · ${updated} · ${time} de lecture`,
  checklist: 'La checklist à retenir',
  giftChecklist: 'Nos idées en bref',
  picks: 'Notre sélection par budget',
  giftPicks: 'Notre sélection de cadeaux',
  picksIntro:
    'Des pistes pour démarrer vos recherches sur Amazon.fr selon votre budget. Les prix et la disponibilité évoluent ; seule la page Amazon fait foi.',
  giftPicksIntro:
    'Quelques idées concrètes pour démarrer vos recherches sur Amazon.fr selon le budget. Les prix et la disponibilité évoluent ; seule la page Amazon fait foi.',
  pickCta: 'Voir sur Amazon →',
  // Hub /idees-cadeaux
  giftHubEyebrow: 'Idées cadeaux',
  giftHubTitle: 'Idées cadeaux : nos sélections par profil et par occasion',
  giftHubSubtitle:
    "Plus d'inspiration, moins de doute. Des idées cadeaux triées par personne à gâter, par centre d'intérêt et par budget.",
  giftHubIntro:
    "Trouver le bon cadeau peut vite tourner au casse-tête. On a réuni ici nos idées cadeaux classées par profil (homme, femme, ado…) et par occasion (Noël, anniversaire) pour vous aider à trouver l'idée juste, quel que soit votre budget. Et si vous hésitez encore, notre conseiller d'achat IA peut affiner la sélection en quelques questions.",
  read: 'Lire le guide →',
  cardEyebrow: (time) => `Idées cadeaux · ${time}`,
  // Landing /cadeau
  cadeauEyebrow: 'Idées cadeaux',
  cadeauTitle: 'Trouvez le cadeau parfait',
  cadeauSub:
    'Laissez-vous guider : Oraklia vous pose quelques questions sur la personne, puis trouve des idées vérifiées sur Amazon.fr.',
  cadeauCta: 'Trouver un cadeau',
  cadeauHome: 'Accueil',
  cadeauHow: 'Comment ça marche',
  cadeauSteps: [
    ['💬', 'Décrivez la personne', 'Quelques questions : pour qui, son âge, homme ou femme, ses passions…'],
    ['🧠', "L'IA cerne ses goûts", 'Oraklia analyse le profil pour cibler les idées qui lui correspondent.'],
    ['🎁', 'Recevez vos idées cadeaux', 'Des produits réels, vérifiés sur Amazon.fr et dans votre budget.'],
  ],
  cadeauInspiration: "Besoin d'inspiration ?",
  cadeauInspirationSub: 'Parcourez nos idées cadeaux par profil et par occasion.',
  cadeauBrowse: 'Voir toutes les idées cadeaux →',
  advisorTitle: 'Besoin d’un conseil personnalisé ?',
  advisorText:
    'Répondez à quelques questions et notre conseiller intelligent sélectionne les produits les plus adaptés à vos besoins.',
  affiliate:
    'En tant que Partenaire Amazon, Oraklia réalise un bénéfice sur les achats remplissant les conditions requises.',
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
const escAttr = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const template = readFileSync(join(DIST, 'index.html'), 'utf8');

// Replace the homepage head tags with page-specific ones, inject extra <head>
// markup (JSON-LD) and the prerendered body into #root.
function renderPage({ title, description, canonical, headExtra = '', body }) {
  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(
    /<meta name="description" content="[\s\S]*?"\s*\/>/,
    `<meta name="description" content="${escAttr(description)}" />`,
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${escAttr(canonical)}" />`,
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*"\s*\/>/,
    `<meta property="og:url" content="${escAttr(canonical)}" />`,
  );
  html = html.replace(
    /<meta property="og:title" content="[\s\S]*?"\s*\/>/,
    `<meta property="og:title" content="${escAttr(title)}" />`,
  );
  html = html.replace(
    /<meta property="og:description" content="[\s\S]*?"\s*\/>/,
    `<meta property="og:description" content="${escAttr(description)}" />`,
  );
  if (headExtra) html = html.replace('</head>', `  ${headExtra}\n  </head>`);
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
  return html;
}

function guideBody(g) {
  const sections = g.sections
    .map(
      (s) =>
        `<section class="guide-section"><h2>${esc(s.heading)}</h2>${s.body
          .map((p) => `<p>${esc(p)}</p>`)
          .join('')}</section>`,
    )
    .join('');
  const checklist = g.checklist
    .map((i) => `<li><span class="guide-check" aria-hidden="true">✓</span>${esc(i)}</li>`)
    .join('');
  const picks = g.picks
    .map((p) => {
      const href = escAttr(p.url || affiliateSearch(p.query));
      return `<a class="guide-pick" href="${href}" target="_blank" rel="noopener noreferrer sponsored"><div class="guide-pick-budget">${esc(
        p.budget,
      )}</div>${p.name ? `<div class="guide-pick-name">${esc(p.name)}</div>` : ''}<div class="guide-pick-note">${esc(
        p.note,
      )}</div><div class="guide-pick-cta">${esc(L.pickCta)}</div></a>`;
    })
    .join('');
  const isGift = g.type === 'gift';
  return `<div class="guide-page"><div class="guide-topbar"><button type="button" class="guide-close" aria-label="${escAttr(
    L.close,
  )}">✕</button></div><article class="guide-article"><header class="guide-header"><div class="guide-eyebrow">${esc(
    L.meta(g.updated, g.readTime),
  )}</div><h1 class="guide-title">${esc(g.title)}</h1><p class="guide-subtitle">${esc(
    g.subtitle,
  )}</p></header><p class="guide-intro">${esc(
    g.intro,
  )}</p>${sections}<section class="guide-checklist"><h2>${esc(
    isGift ? L.giftChecklist : L.checklist,
  )}</h2><ul>${checklist}</ul></section><section class="guide-picks"><h2>${esc(
    isGift ? L.giftPicks : L.picks,
  )}</h2><p class="guide-picks-intro">${esc(
    isGift ? L.giftPicksIntro : L.picksIntro,
  )}</p><div class="guide-picks-grid">${picks}</div></section><section class="guide-advisor-cta"><h2>${esc(
    L.advisorTitle,
  )}</h2><p>${esc(L.advisorText)}</p></section><p class="guide-disclosure">${esc(
    L.affiliate,
  )}</p></article></div>`;
}

function giftHubBody() {
  const cards = giftGuides()
    .map((guide) => {
      const g = localizeGuide(guide, 'fr');
      return `<a class="guide-card" href="/guide/${escAttr(g.slug)}"><div class="guide-card-eyebrow">${esc(
        L.cardEyebrow(g.readTime),
      )}</div><h2 class="guide-card-title">${esc(g.title)}</h2><p class="guide-card-sub">${esc(
        g.subtitle,
      )}</p><span class="guide-card-link">${esc(L.read)}</span></a>`;
    })
    .join('');
  return `<div class="guide-page"><div class="guide-topbar"><button type="button" class="guide-back"><span aria-hidden="true">←</span> ${esc(
    L.back,
  )}</button><div class="guide-topbar-right"><span class="guide-brand">Oraklia</span></div></div><article class="guide-article"><header class="guide-header"><div class="guide-eyebrow">${esc(
    L.giftHubEyebrow,
  )}</div><h1 class="guide-title">${esc(L.giftHubTitle)}</h1><p class="guide-subtitle">${esc(
    L.giftHubSubtitle,
  )}</p></header><p class="guide-intro">${esc(
    L.giftHubIntro,
  )}</p><div class="home-guides-grid">${cards}</div><p class="guide-disclosure">${esc(
    L.affiliate,
  )}</p></article></div>`;
}

function cadeauBody() {
  const steps = L.cadeauSteps
    .map(([e, title, sub]) => `<div class="gl-step"><span class="gl-step-emoji" aria-hidden="true">${e}</span><div class="gl-step-body"><h3 class="gl-step-title">${esc(title)}</h3><p class="gl-step-sub">${esc(sub)}</p></div></div>`)
    .join('');
  const cards = giftGuides()
    .map((guide) => {
      const g = localizeGuide(guide, 'fr');
      return `<a class="guide-card" href="/guide/${escAttr(g.slug)}"><div class="guide-card-eyebrow">${esc(
        L.cardEyebrow(g.readTime),
      )}</div><h3 class="guide-card-title">${esc(g.title)}</h3><p class="guide-card-sub">${esc(
        g.subtitle,
      )}</p><span class="guide-card-link">${esc(L.read)}</span></a>`;
    })
    .join('');
  return `<div class="guide-page gift-landing"><div class="guide-topbar"><button type="button" class="guide-back guide-home" aria-label="${escAttr(L.cadeauHome)}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 10v9.5h13V10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> ${esc(
    L.cadeauHome,
  )}</button><div class="guide-topbar-right"><span class="guide-brand">Oraklia</span></div></div><div class="gl-hero"><div class="gl-eyebrow">🎁 ${esc(
    L.cadeauEyebrow,
  )}</div><h1 class="gl-title">${esc(L.cadeauTitle)}</h1><p class="gl-sub">${esc(
    L.cadeauSub,
  )}</p><a class="btn-primary big gl-cta" href="/cadeau">${esc(
    L.cadeauCta,
  )} <span class="btn-arrow">→</span></a></div><section class="gl-how"><h2 class="gl-section-title">${esc(
    L.cadeauHow,
  )}</h2><div class="gl-steps">${steps}</div></section><section class="gl-inspiration"><div class="gl-insp-head"><h2 class="gl-section-title">${esc(
    L.cadeauInspiration,
  )}</h2><p class="gl-insp-sub">${esc(
    L.cadeauInspirationSub,
  )}</p></div><div class="home-guides-grid">${cards}</div><a class="gl-hub-link" href="/idees-cadeaux">${esc(
    L.cadeauBrowse,
  )}</a></section></div>`;
}

function write(relPath, html) {
  const dir = join(DIST, relPath);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
}

const urls = ['/'];

// ── Guides ──────────────────────────────────────────────────────────────────
for (const guide of GUIDES) {
  const g = localizeGuide(guide, 'fr');
  const canonical = `${ORIGIN}/guide/${g.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: g.title,
    description: g.subtitle,
    inLanguage: 'fr-FR',
    image: `${ORIGIN}/og.png`,
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'Oraklia' },
    publisher: {
      '@type': 'Organization',
      name: 'Oraklia',
      logo: { '@type': 'ImageObject', url: `${ORIGIN}/brand/oraklia-logo.png` },
    },
  };
  const html = renderPage({
    title: `${g.title} — Oraklia`,
    description: g.subtitle,
    canonical,
    headExtra: `<script type="application/ld+json">\n${JSON.stringify(jsonLd)}\n  </script>`,
    body: guideBody(g),
  });
  write(`guide/${g.slug}`, html);
  urls.push(`/guide/${g.slug}`);
  console.log('prerendered', `/guide/${g.slug}`);
}

// ── Gift-ideas hub (/idees-cadeaux) ──────────────────────────────────────────
{
  const canonical = `${ORIGIN}/idees-cadeaux`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: L.giftHubTitle,
    description: L.giftHubSubtitle,
    inLanguage: 'fr-FR',
    itemListElement: giftGuides().map((guide, i) => {
      const g = localizeGuide(guide, 'fr');
      return {
        '@type': 'ListItem',
        position: i + 1,
        name: g.title,
        url: `${ORIGIN}/guide/${g.slug}`,
      };
    }),
  };
  const html = renderPage({
    title: `${L.giftHubTitle} — Oraklia`,
    description: L.giftHubSubtitle,
    canonical,
    headExtra: `<script type="application/ld+json">\n${JSON.stringify(jsonLd)}\n  </script>`,
    body: giftHubBody(),
  });
  write('idees-cadeaux', html);
  urls.push('/idees-cadeaux');
  console.log('prerendered', '/idees-cadeaux');
}

// ── Gift finder landing (/cadeau) ────────────────────────────────────────────
{
  const canonical = `${ORIGIN}/cadeau`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: L.cadeauTitle,
    description: L.cadeauSub,
    url: canonical,
  };
  const html = renderPage({
    title: `${L.cadeauTitle} — Oraklia`,
    description: L.cadeauSub,
    canonical,
    headExtra: `<script type="application/ld+json">\n${JSON.stringify(jsonLd)}\n  </script>`,
    body: cadeauBody(),
  });
  write('cadeau', html);
  urls.push('/cadeau');
  console.log('prerendered', '/cadeau');
}

// ── Legal (light: correct head + a short crawlable body; JS renders the rest) ─
{
  const canonical = `${ORIGIN}/mentions-legales`;
  const body = `<main style="max-width:680px;margin:40px auto;padding:0 20px"><h1>Mentions légales</h1><p>${esc(
    L.affiliate,
  )}</p></main>`;
  const html = renderPage({
    title: 'Mentions légales — Oraklia',
    description: 'Mentions légales et informations d’affiliation d’Oraklia.',
    canonical,
    body,
  });
  write('mentions-legales', html);
  urls.push('/mentions-legales');
  console.log('prerendered', '/mentions-legales');
}

// ── Privacy policy (public URL required by Play Console + Amazon Associates) ──
// Two routes point at the same in-app view: /confidentialite (FR) + /privacy (EN).
for (const [path, title, description, intro] of [
  [
    '/confidentialite',
    'Politique de confidentialité — Oraklia',
    'Politique de confidentialité d’Oraklia : données collectées, finalités, sous-traitants et vos droits (RGPD).',
    "Cette page explique quelles données personnelles Oraklia collecte, pourquoi, et quels sont vos droits au titre du RGPD.",
  ],
  [
    '/privacy',
    'Privacy policy — Oraklia',
    'Oraklia privacy policy: data collected, purposes, processors and your rights (GDPR).',
    'This page explains what personal data Oraklia collects, why, and what your rights are under the GDPR.',
  ],
]) {
  const canonical = `${ORIGIN}${path}`;
  const body = `<main style="max-width:680px;margin:40px auto;padding:0 20px"><h1>${esc(
    title.replace(' — Oraklia', ''),
  )}</h1><p>${esc(intro)}</p><p>${esc(L.affiliate)}</p></main>`;
  const html = renderPage({ title, description, canonical, body });
  write(path.replace(/^\//, ''), html);
  urls.push(path);
  console.log('prerendered', path);
}

// ── Sitemap (kept in sync with the real URLs) ────────────────────────────────
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${ORIGIN}${u === '/' ? '/' : u}</loc><changefreq>${
        u === '/' ? 'weekly' : 'monthly'
      }</changefreq><priority>${u === '/' ? '1.0' : '0.8'}</priority></url>`,
  )
  .join('\n')}
</urlset>
`;
writeFileSync(join(DIST, 'sitemap.xml'), sitemap, 'utf8');
console.log('wrote sitemap.xml with', urls.length, 'urls');
