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

import { GUIDES, localizeGuide, affiliateSearch } from '../src/data/guides.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ORIGIN = 'https://oraklia.fr';

// French labels (mirror of the i18n FR dict for the static guide chrome).
const L = {
  back: 'Retour',
  meta: (updated, time) => `Guide d'achat · ${updated} · ${time} de lecture`,
  checklist: 'La checklist à retenir',
  picks: 'Notre sélection par budget',
  picksIntro:
    'Des pistes pour démarrer vos recherches sur Amazon.fr selon votre budget. Les prix et la disponibilité évoluent ; seule la page Amazon fait foi.',
  pickCta: 'Voir sur Amazon →',
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
  return `<div class="guide-page"><div class="guide-topbar"><button type="button" class="guide-back"><span aria-hidden="true">←</span> ${esc(
    L.back,
  )}</button><div class="guide-topbar-right"><span class="guide-brand">Oraklia</span></div></div><article class="guide-article"><header class="guide-header"><div class="guide-eyebrow">${esc(
    L.meta(g.updated, g.readTime),
  )}</div><h1 class="guide-title">${esc(g.title)}</h1><p class="guide-subtitle">${esc(
    g.subtitle,
  )}</p></header><p class="guide-intro">${esc(
    g.intro,
  )}</p>${sections}<section class="guide-checklist"><h2>${esc(
    L.checklist,
  )}</h2><ul>${checklist}</ul></section><section class="guide-picks"><h2>${esc(
    L.picks,
  )}</h2><p class="guide-picks-intro">${esc(
    L.picksIntro,
  )}</p><div class="guide-picks-grid">${picks}</div></section><section class="guide-advisor-cta"><h2>${esc(
    L.advisorTitle,
  )}</h2><p>${esc(L.advisorText)}</p></section><p class="guide-disclosure">${esc(
    L.affiliate,
  )}</p></article></div>`;
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
