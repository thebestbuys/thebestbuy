import { searchItems, creatorsConfigured } from './_creators.js';
import { logApiCalls, setRequestUser, setRequestConversation } from './_metrics.js';

// Primary + backup models are env-overridable. On the free tier each model has
// its OWN quota bucket, so a backup from a different line (default 2.5 Flash-Lite)
// roughly doubles daily headroom and adds resilience if the primary 429s/5xxs.
// Both default to the lite variants — cheapest, fastest, no "thinking" overhead,
// which is the right fit for our JSON-formatting use case.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
const GEMINI_MODEL_FALLBACK =
  process.env.GEMINI_MODEL_FALLBACK !== undefined
    ? process.env.GEMINI_MODEL_FALLBACK
    : 'gemini-2.5-flash-lite';
const geminiUrl = (model) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

// How many product candidates we ask Gemini to generate per recommend call.
// We only ever SHOW 3, but need a buffer because some candidates fail Amazon
// verification. Don't set this to 3: any miss then triggers the retry path,
// which re-sends the whole prompt (costly) — a small buffer here is cheaper.
const RECOMMEND_COUNT = 6;

// Output-token budget sized to the number of products requested. A small batch
// (e.g. the Amazon-retry top-up, which only needs to fill 1–2 slots) shouldn't
// be billed for the full 2048-token cap. ~260 tok/product is generous headroom
// so a valid JSON response is never truncated. Capped at 2048.
const recMaxTokens = (n) => Math.min(2048, 480 + n * 260);
const AFFILIATE_TAG = 'oraklia123-21';

// Server-side Supabase config for friend-gift profile resolution.
const SUPA_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPA_ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Per-account daily Gemini quota (signed-in users). Either cap trips the limit.
// Env-overridable; metering is skipped entirely if Supabase isn't configured, so
// the advisor keeps working (graceful degradation, like the Amazon verify path).
const AI_DAILY_REQUEST_CAP = Number(process.env.AI_DAILY_REQUEST_CAP || 50);
const AI_DAILY_TOKEN_CAP = Number(process.env.AI_DAILY_TOKEN_CAP || 200000);

const PROFILE_LABELS = {
  gender: { fr: 'Genre', en: 'Gender' },
  age: { fr: 'Âge', en: 'Age' },
  profession: { fr: 'Profession', en: 'Profession' },
  nationality: { fr: 'Nationalité', en: 'Nationality' },
  address: { fr: 'Adresse', en: 'Address' },
  bio: { fr: 'À propos', en: 'About' },
};

function profileDataToString(data, lang = 'fr') {
  if (!data || typeof data !== 'object') return '';
  const parts = [];
  for (const k of Object.keys(PROFILE_LABELS)) {
    const v = String(data[k] ?? '').trim();
    if (!v) continue;
    parts.push(`${PROFILE_LABELS[k][lang] || PROFILE_LABELS[k].fr}: ${v}`);
  }
  return parts.join('; ');
}

// Resolve a friend's PRIVATE profile on the requester's behalf, but only after
// verifying (a) the bearer token is valid and (b) an accepted friendship exists.
// Returns { text, debug } — text is the compact profile string ('' if anything
// is missing/unverified); debug carries only booleans/lengths (never the data).
async function resolveFriendProfile(req, friendId, lang, supaCalls) {
  const debug = {
    env: { url: !!SUPA_URL, anon: !!SUPA_ANON, service: !!SUPA_SERVICE },
    hasToken: false,
    userOk: false,
    verified: false,
    profileLen: 0,
    wishlistCount: 0,
    error: null,
  };
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    debug.hasToken = !!token;
    if (!friendId || !SUPA_URL || !SUPA_SERVICE || !SUPA_ANON || !token) return { text: '', debug };

    const { createClient } = await import('@supabase/supabase-js');

    const anon = createClient(SUPA_URL, SUPA_ANON);
    const { data: userData, error: userErr } = await anon.auth.getUser(token);
    if (supaCalls) supaCalls.n++;
    const requesterId = userData?.user?.id;
    debug.userOk = !!requesterId;
    if (userErr || !requesterId || requesterId === friendId) {
      debug.error = userErr ? 'getUser: ' + (userErr.message || 'failed') : 'no requester';
      return { text: '', wishlist: '', debug };
    }

    const admin = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } });
    const { data: link, error: linkErr } = await admin
      .from('friend_requests')
      .select('id')
      .eq('status', 'accepted')
      .or(
        `and(requester_id.eq.${requesterId},addressee_id.eq.${friendId}),` +
          `and(requester_id.eq.${friendId},addressee_id.eq.${requesterId})`,
      )
      .maybeSingle();
    if (supaCalls) supaCalls.n++;
    if (linkErr) debug.error = 'link: ' + (linkErr.message || 'failed');
    if (!link) return { text: '', debug }; // not friends → never use their profile
    debug.verified = true;

    const { data: prof, error: profErr } = await admin
      .from('profiles')
      .select('data')
      .eq('user_id', friendId)
      .maybeSingle();
    if (supaCalls) supaCalls.n++;
    if (profErr) debug.error = 'profile: ' + (profErr.message || 'failed');
    const text = profileDataToString(prof?.data, lang);
    debug.profileLen = text.length;

    // The recipient's saved products ("Mes sélections") = a wishlist signal.
    let wishlist = '';
    const { data: sels } = await admin
      .from('selections')
      .select('data')
      .eq('user_id', friendId)
      .limit(40);
    if (supaCalls) supaCalls.n++;
    const items = (sels || [])
      .map((r) => r.data)
      .filter(Boolean)
      .map((p) => {
        const n = `${p.brand || ''} ${p.model || ''}`.trim();
        if (!n) return '';
        return p.price != null ? `${n} (~${p.price}€)` : n;
      })
      .filter(Boolean)
      .slice(0, 20);
    wishlist = items.join('; ');
    debug.wishlistCount = items.length;

    return { text, wishlist, debug };
  } catch (e) {
    debug.error = 'exception: ' + (e?.message || String(e));
    return { text: '', wishlist: '', debug };
  }
}

// Resolve the signed-in user's id from the bearer token, verified via Supabase
// auth. Returns null when not signed in, no token, or anything is misconfigured
// (so quota metering simply doesn't apply rather than blocking the request).
async function getRequesterId(req, supaCalls) {
  try {
    const auth = req.headers?.authorization || req.headers?.Authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || !SUPA_URL || !SUPA_ANON) return null;
    const { createClient } = await import('@supabase/supabase-js');
    const anon = createClient(SUPA_URL, SUPA_ANON);
    const { data, error } = await anon.auth.getUser(token);
    if (supaCalls) supaCalls.n++;
    if (error) return null;
    return data?.user?.id || null;
  } catch {
    return null;
  }
}

// Today's (UTC) usage row for a user. Missing row → zeroed totals.
async function readUsageToday(admin, userId, supaCalls) {
  const day = new Date().toISOString().slice(0, 10);
  const { data } = await admin
    .from('ai_usage')
    .select('requests, input_tokens, output_tokens')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle();
  if (supaCalls) supaCalls.n++;
  return data || { requests: 0, input_tokens: 0, output_tokens: 0 };
}

// Precise brand+model affiliate search link — used as a last resort when we
// can't scrape a direct product (ASIN) link. Tight query so Amazon's first
// result is almost always the exact product.
function searchLink(brand, model) {
  const q = `${brand || ''} ${model || ''}`.trim();
  return `https://www.amazon.fr/s?k=${encodeURIComponent(q)}&tag=${AFFILIATE_TAG}`;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function send(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function langLineFor(lang) {
  return lang === 'en'
    ? 'Reply ALWAYS in English (every text: reply, question, choices, specs, why).'
    : 'Réponds toujours en français.';
}

// Compact criteria payload — only the answered questions, not the full chat.
function answersJson(answers) {
  if (!Array.isArray(answers) || answers.length === 0) return '[]';
  return JSON.stringify(answers.map((a) => ({ q: a.q || '', r: a.a ?? a.label ?? '' })));
}

// The budget question (always the first one) carries €-bounds on the chosen
// choice. Turn them into Creators API minPrice/maxPrice (in CENTS), with a 10%
// tolerance so a near-budget deal isn't filtered out, and so the lowest/highest
// open-ended brackets (min=null / max=null) stay unbounded on that side.
function budgetBoundsCents(answers) {
  if (!Array.isArray(answers)) return {};
  for (const a of answers) {
    const min = Number(a?.min);
    const max = Number(a?.max);
    const hasMin = Number.isFinite(min) && min > 0;
    const hasMax = Number.isFinite(max) && max > 0;
    if (hasMin || hasMax) {
      return {
        minPrice: hasMin ? Math.round(min * 100 * 0.9) : undefined,
        maxPrice: hasMax ? Math.round(max * 100 * 1.1) : undefined,
      };
    }
  }
  return {};
}

// Optional user profile block — a free-form self-description used to tailor
// questions and recommendations. Empty string when no profile is set.
function profileLine(profile) {
  const p = typeof profile === 'string' ? profile.trim() : '';
  if (!p) return '';
  return `\nProfil de l'utilisateur (à prendre en compte pour personnaliser, sans le répéter): "${p.slice(0, 600)}"`;
}

// Prompt to generate ONE next question, adapted to the criteria gathered so far.
function buildAskPrompt(objet, answers, lang, profile = '') {
  const first = !Array.isArray(answers) || answers.length === 0;
  return `Tu es Oraklia, un conseiller d'achat. ${langLineFor(lang)}
L'utilisateur cherche à acheter : "${objet || 'un produit'}".${profileLine(profile)}
Réponses déjà recueillies (JSON — ne repose JAMAIS une dimension déjà couverte): ${answersJson(answers)}

Pose UNE SEULE nouvelle question, pertinente, pour affiner le besoin sur une dimension PAS ENCORE couverte.
${first
  ? `C'est la 1re question : commence OBLIGATOIREMENT par le BUDGET, avec EXACTEMENT 4 choix dont les bornes "min"/"max" en euros sont ADAPTÉES au prix réel typique de "${objet}" (ex: biberon ~5–50 €, écouteurs ~20–400 €, téléphone ~150–1500 €, téléviseur ~200–3000 €). Libellés courts "Moins de X €", "X – Y €", "Plus de Z €". 1er choix "min"=null, dernier choix "max"=null.`
  : `Question courte, 2 à 4 choix concrets. Les choix peuvent porter des "tags" courts (ex: "ios", "anc", "gaming"). Si PLUSIEURS réponses peuvent légitimement s'appliquer en même temps (ex: fonctionnalités/usages souhaités), mets "multi":true et propose 3 à 6 choix ; sinon "multi":false. Ne mets JAMAIS "multi":true sur le budget.`}

Réponds UNIQUEMENT par un objet JSON valide de cette forme:
{"reply":"<la question à afficher>","question":{"id":"slug-court","text":"<la question>","multi":false,"choices":[{"id":"slug","label":"Libellé court","tags":[],"min":null,"max":null}]}}`;
}

// Prompt to generate 10 real product candidates from the criteria JSON.
function buildRecommendPrompt(objet, answers, lang, exclude = [], profile = '', count = RECOMMEND_COUNT) {
  const excludeLine = exclude.length
    ? `\nNE propose AUCUN de ces produits (déjà testés, introuvables sur Amazon.fr) : ${exclude.join(', ')}. Propose-en ${count} AUTRES, différents.`
    : '';
  return `Tu es Oraklia, un conseiller d'achat. ${langLineFor(lang)}
L'utilisateur cherche à acheter : "${objet || 'un produit'}".${profileLine(profile)}
Critères recueillis (JSON): ${answersJson(answers)}

Propose EXACTEMENT ${count} produits RÉELS, populaires et récents, réellement vendus sur Amazon.fr, correspondant au mieux à ces critères. Donne des marques et modèles PRÉCIS. Chaque produit a un score de correspondance 0-99 selon les critères. La phrase d'introduction ("reply") ne doit JAMAIS indiquer le nombre de produits (écris "Voici quelques idées…", jamais "Voici 6 produits…").${excludeLine}

Réponds UNIQUEMENT par un objet JSON valide de cette forme:
{"reply":"<courte phrase d'introduction>","products":[{"id":"p1","brand":"Marque","model":"Modèle exact","price":999,"score":94,"specs":["Spec 1","Spec 2","Spec 3","Spec 4"],"why":"Raison courte"}]}`;
}

// ── Home-page suggestion chips ──────────────────────────────────────────────
// Icon slugs the home page can actually render (see SuggestionIcon in App.jsx).
// Gemini must pick from this exact list so every chip gets a matching glyph.
const SUGGESTION_ICONS = ['ac', 'fan', 'phone', 'laptop', 'tv', 'earbuds', 'watch', 'vacuum', 'coffee', 'speaker', 'default'];

// Prompt to pick ~8 product-category chips adapted to the season / current
// events (in France) and, when available, the user's profile.
function buildSuggestionsPrompt(lang, profile, dateStr) {
  const profileBullet = profile
    ? "\n- du PROFIL de l'utilisateur ci-dessus (adapte discrètement à ses centres d'intérêt probables, sans le citer),"
    : '';
  return `Tu es Oraklia, un conseiller d'achat. ${langLineFor(lang)}
Nous sommes le ${dateStr}.${profileLine(profile)}

Propose EXACTEMENT 5 idées de produits à acheter, sous forme de "chips" courts à afficher sur la page d'accueil. Choisis-les en fonction :
- de la PÉRIODE de l'année et de la SAISON en France (météo, vacances, fêtes, soldes, rentrée, Black Friday, Noël… selon la date),
- de l'actualité et des usages typiques du moment,${profileBullet}
- en VARIANT les catégories (high-tech, maison, saisonnier, loisirs…).

Chaque chip = une catégorie de produit COURTE (1 à 3 mots), concrète et achetable sur Amazon.fr, SANS marque précise. Donne aussi un "icon" choisi dans cette liste EXACTE (le plus proche, sinon "default") : ${SUGGESTION_ICONS.join(', ')}.

Réponds UNIQUEMENT par un objet JSON valide de cette forme:
{"suggestions":[{"label":"Climatiseur","icon":"ac"}]}`;
}

// ── Product Q&A (detail page "ask Gemini about this product") ──────────────
// Grounds the model in the ONE product already shown to the user (brand/model/
// price/specs/why) so it answers about that exact item, not a generic lookup.
function buildProductQaPrompt(product, lang) {
  const specs = Array.isArray(product?.specs) && product.specs.length ? product.specs.join(', ') : 'non précisées';
  const price = product?.price != null ? `${product.price} €` : 'inconnu';
  return `Tu es Oraklia, un conseiller d'achat expert. ${langLineFor(lang)}
L'utilisateur regarde la fiche de ce produit, déjà identifié — ne demande JAMAIS de précisions sur "lequel" :
- Marque : ${product?.brand || 'inconnue'}
- Modèle : ${product?.model || 'inconnu'}
- Prix indicatif : ${price}
- Caractéristiques : ${specs}
- Pourquoi il a été recommandé : ${product?.why || 'non précisé'}

Réponds à sa question (ou donne un avis si la demande est générique) UNIQUEMENT sur CE produit. Sois CONCIS et va droit au but : soit 2 à 3 phrases courtes, soit 2 à 4 puces brèves (une par ligne, chacune commençant par "- "). Évite tout long pavé. Concentre-toi sur l'essentiel (points forts, limites éventuelles, pour qui c'est adapté) sans répéter les infos déjà affichées sur la fiche.

Réponds UNIQUEMENT par un objet JSON valide de cette forme:
{"reply":"<ta réponse>"}`;
}

// ── Gift mode ──────────────────────────────────────────────────────────────
// One next question to refine gift ideas for the described recipient.
function buildGiftAskPrompt(giftStr, answers, lang) {
  return `Tu es Oraklia, un conseiller en idées cadeaux. ${langLineFor(lang)}
On cherche un CADEAU pour une personne décrite ainsi : "${giftStr}".
Préférences de raffinement déjà recueillies (JSON): ${answersJson(answers)}

Pose UNE SEULE nouvelle question courte (2 à 4 choix concrets) pour mieux cerner le cadeau idéal, sur une dimension PAS ENCORE couverte (ex: style/usage, pratique vs original, plaisir vs utile, univers précis). Ne repose jamais le budget ni l'occasion (déjà connus). Les choix peuvent porter des "tags" courts. Si PLUSIEURS réponses peuvent s'appliquer en même temps, mets "multi":true et propose 3 à 6 choix ; sinon "multi":false.

Réponds UNIQUEMENT par un objet JSON valide de cette forme:
{"reply":"<la question à afficher>","question":{"id":"slug-court","text":"<la question>","multi":false,"choices":[{"id":"slug","label":"Libellé court","tags":[],"min":null,"max":null}]}}`;
}

// 10 real, varied gift product candidates for the recipient + occasion + budget.
function buildGiftRecommendPrompt(giftStr, answers, lang, exclude = [], surprise = false, wishlist = '', count = RECOMMEND_COUNT) {
  const excludeLine = exclude.length
    ? `\nNE propose AUCUN de ces produits (déjà testés, introuvables sur Amazon.fr) : ${exclude.join(', ')}. Propose-en ${count} AUTRES, différents.`
    : '';
  const surpriseLine = surprise
    ? "\nMODE SURPRISE : ose des idées ORIGINALES, inattendues et créatives (pas seulement les évidences) tout en restant adaptées à la personne et au budget. Privilégie la nouveauté et l'effet \"waouh\"."
    : '';
  const wishlistLine = wishlist
    ? `\nLISTE DE SOUHAITS de la personne (produits qu'elle a elle-même sauvegardés) : ${wishlist}. Si un ou plusieurs RENTRENT DANS LE BUDGET, propose-les EN PRIORITÉ (inclus-en 1 à 3 parmi les ${count}) — ce sont des choses qu'elle veut déjà.`
    : '';
  return `Tu es Oraklia, un conseiller en idées cadeaux. ${langLineFor(lang)}
On cherche un CADEAU pour une personne décrite ainsi : "${giftStr}".${wishlistLine}
Préférences de raffinement (JSON): ${answersJson(answers)}

Propose EXACTEMENT ${count} idées de cadeaux : des produits RÉELS, populaires et récents, réellement vendus sur Amazon.fr, qui feraient de bons cadeaux pour CETTE personne, pour cette occasion et DANS le budget indiqué. VARIE les catégories (pas ${count} produits du même type). Donne des marques et modèles PRÉCIS. "why" explique en une phrase pourquoi ça correspond à la personne. Score 0-99 = à quel point l'idée lui correspond. La phrase d'introduction ("reply") ne doit JAMAIS indiquer le nombre de produits (écris "Voici des idées de cadeaux…", jamais "Voici 6 idées…").${surpriseLine}${excludeLine}

Réponds UNIQUEMENT par un objet JSON valide de cette forme:
{"reply":"<courte phrase d'introduction>","products":[{"id":"p1","brand":"Marque","model":"Modèle exact","price":999,"score":94,"specs":["Spec 1","Spec 2","Spec 3"],"why":"Pourquoi ce cadeau lui correspond"}]}`;
}

// ── Legacy transcript-based prompt (still used by the mobile app) ──────────
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

function buildSystemPrompt(category, lang = 'fr', profile = '') {
  const langLine = langLineFor(lang);
  return `Tu es Oraklia, un conseiller d'achat conversationnel.
LANGUE DE RÉPONSE / OUTPUT LANGUAGE: ${langLine}${profileLine(profile)}

OBJECTIF: identifier les meilleurs produits réels (catégorie: ${category || 'inconnue'}), via un dialogue en deux phases.

PHASE 1 — DÉCOUVERTE (5 questions):
- Pose EXACTEMENT 5 questions, en commençant OBLIGATOIREMENT par le budget.
- La question budget DOIT contenir 4 choix avec bornes "min"/"max" en euros ADAPTÉES au prix réel typique de l'objet (biberon ~5–50 €, écouteurs ~20–400 €, téléphone ~150–1500 €, télé ~200–3000 €).
- Après la 5e réponse: action="recommend", products=[10 produits], question=null.

PHASE 2 — RAFFINEMENT CONTINU:
- Pose 3 questions de raffinement (action="ask"), puis action="recommend" avec 10 produits mis à jour. Répète.
- Si tu reçois "__refine__": démarre la phase 2 (action="ask").

RÈGLES: ${langLine} Une seule question à la fois (2-4 choix). Les choix peuvent avoir des "tags" ou bornes "min"/"max". "preferences" accumule tags/contraintes. Score 0-99. Uniquement des produits réels d'Amazon.fr.

FORMAT (JSON uniquement):
{"reply":"...","action":"ask"|"recommend","question":null|{"id":"slug","text":"...","choices":[{"id":"slug","label":"...","tags":[],"min":null,"max":null}]},"preferences":{"tags":[],"budget_max":null,"budget_min":null},"products":null|[{"id":"p1","brand":"...","model":"...","price":999,"score":94,"specs":["..."],"why":"..."}]}

IMPORTANT: "products" null quand action="ask"; 10 produits quand action="recommend".`;
}

// Gift mode over the legacy transcript contract (used by the mobile app): same
// action/products/question JSON, but gift-flavoured — recipient/occasion/budget
// are already known, so it goes straight to recommendations and refines on demand.
function buildGiftSystemPrompt(giftStr, lang = 'fr', surprise = false, wishlist = '') {
  const langLine = langLineFor(lang);
  const surpriseLine = surprise
    ? "\nMODE SURPRISE : ose des idées ORIGINALES, inattendues et créatives (pas seulement les évidences) tout en restant adaptées à la personne et au budget."
    : '';
  const wishlistLine = wishlist
    ? `\nLISTE DE SOUHAITS de la personne (produits qu'elle a elle-même sauvegardés) : ${wishlist}. Si un ou plusieurs RENTRENT DANS LE BUDGET, propose-les EN PRIORITÉ (inclus-en 1 à 3) — ce sont des choses qu'elle veut déjà.`
    : '';
  return `Tu es Oraklia, un conseiller en idées cadeaux conversationnel.
LANGUE DE RÉPONSE / OUTPUT LANGUAGE: ${langLine}
On cherche un CADEAU pour une personne décrite ainsi : "${giftStr}".${surpriseLine}${wishlistLine}

DÉROULÉ:
- À ton PREMIER message: action="recommend" avec EXACTEMENT 10 idées de cadeaux RÉELS vendus sur Amazon.fr, VARIÉES (catégories différentes), adaptées à la personne, à l'occasion et au budget indiqués. Ne pose PAS de question sur le budget/l'occasion (déjà connus).
- Ensuite, si l'utilisateur veut affiner ou voir d'autres idées: soit action="ask" (UNE question courte, 2-4 choix), soit action="recommend" avec 10 AUTRES idées.

RÈGLES: ${langLine} Marques et modèles PRÉCIS. "why" = pourquoi ce cadeau lui correspond (1 phrase). Score 0-99. Uniquement des produits réels d'Amazon.fr.

FORMAT (JSON uniquement):
{"reply":"...","action":"ask"|"recommend","question":null|{"id":"slug","text":"...","choices":[{"id":"slug","label":"...","tags":[]}]},"preferences":{"tags":[]},"products":null|[{"id":"p1","brand":"...","model":"...","price":999,"score":94,"specs":["..."],"why":"..."}]}

IMPORTANT: ton premier message DOIT avoir action="recommend" avec 10 produits.`;
}

function ms(start) {
  return Math.round(performance.now() - start);
}

// Check that the Amazon result title is related to what we searched for.
// Accepts if brand matches + ≥1 model word, OR brand absent but ≥2 model words match.
function isCoherent(geminiBrand, geminiModel, amazonTitle) {
  if (!amazonTitle) return false;
  const title = amazonTitle.toLowerCase();
  const brandMatch = title.includes(geminiBrand.toLowerCase());
  const modelWords = geminiModel.toLowerCase().split(/\s+/).filter(w => w.length >= 3).slice(0, 5);
  const matched = modelWords.filter(w => title.includes(w)).length;
  return (brandMatch && matched >= 1) || (!brandMatch && matched >= 2);
}

// Among the few candidates Amazon returns for a query, pick the best match for
// what Gemini asked for — instead of blindly trusting result[0]. A coherent
// title dominates; ties break on closeness to Gemini's expected price, then on
// having an image. If none is coherent, the caller's isCoherent() gate still
// rejects the top pick, preserving the old "must match" behaviour.
function pickBestItem(items, brand, model, expectedPrice) {
  let best = null;
  let bestScore = -Infinity;
  for (const it of items) {
    if (!it || !it.asin) continue;
    let score = 0;
    if (isCoherent(brand, model, it.title)) score += 100;
    if (it.image) score += 5;
    if (it.price != null) {
      score += 3;
      if (expectedPrice > 0) {
        // up to +20 for an on-target price, decaying with relative deviation
        const dev = Math.abs(it.price - expectedPrice) / expectedPrice;
        score += Math.max(0, 20 - dev * 20);
      }
    }
    if (score > bestScore) { bestScore = score; best = it; }
  }
  return best;
}

// Searches Amazon, returns the best real result with full data — null = blocked.
// `opts`: { minPrice, maxPrice } budget bounds in CENTS; `expectedPrice` (euros)
// is Gemini's guess, used only to rank the candidates.
async function checkAmazon(brand, model, searchContext, opts = {}) {
  // Not configured (e.g. local dev without creds) -> behave like "blocked": the
  // handler bails fast and the UI shows estimates. No network call.
  if (!creatorsConfigured()) return { found: null, error: 'creators_not_configured' };

  const { minPrice, maxPrice, expectedPrice = 0 } = opts;
  const keywords = `${searchContext ? searchContext + ' ' : ''}${brand} ${model}`.trim();
  try {
    const items = await searchItems(keywords, { minPrice, maxPrice });
    const item = pickBestItem(items, brand, model, expectedPrice);
    if (!item || !item.asin) return { found: false };

    // Brand/model for display: prefer the real Amazon title. Split the same way
    // the old scraper did - "ASUS Zenbook S 13..." -> brand=ASUS, model=rest.
    const titleWords = item.title ? item.title.split(' ') : [];
    const amazonBrand = titleWords[0] || brand;
    const amazonModel = titleWords.slice(1).join(' ') || model;

    return {
      found: true,
      title: item.title,
      // Prefer the API's canonical affiliate URL (proper tag + tracking, lands
      // straight on the product page); fall back to a hand-built /dp/ASIN link
      // with our tag if the API didn't return one.
      amazon_url: item.detailPageURL || `https://www.amazon.fr/dp/${item.asin}?tag=${AFFILIATE_TAG}`,
      image_url: item.image ?? null,
      brand: amazonBrand,
      model: amazonModel,
      price: item.price ?? null,
      // Amazon's API does not expose numeric star ratings / review counts, so
      // these stay null -> the UI keeps them hidden (amazon_verified rules).
      rating: null,
      reviews: null,
    };
  } catch (e) {
    // Auth failure, 403 (account not yet eligible), 429 (1 TPS / daily-cap
    // throttle), 5xx, network - treat as BLOCKED so we bail fast and show
    // estimates, like the old WAF guard. Surfaced via _debug.amazon_error.
    return { found: null, error: e?.message || String(e) };
  }
}

async function callGeminiModel(apiKey, model, body) {
  const res = await fetch(`${geminiUrl(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await logApiCalls('gemini');
  return res;
}

// Calls the primary model; on a quota/availability error (429 rate/daily-cap,
// or transient 500/503) it retries once with the configured backup model.
// The returned Response is tagged with `modelUsed` / `fellBack` for _debug so
// you can see in the response when (and why) the fallback kicked in.
async function callGemini(apiKey, body) {
  const res = await callGeminiModel(apiKey, GEMINI_MODEL, body);
  const canFallback =
    !res.ok &&
    GEMINI_MODEL_FALLBACK &&
    GEMINI_MODEL_FALLBACK !== GEMINI_MODEL &&
    [429, 500, 503].includes(res.status);
  if (canFallback) {
    const primaryStatus = res.status;
    const fb = await callGeminiModel(apiKey, GEMINI_MODEL_FALLBACK, body);
    try {
      fb.modelUsed = GEMINI_MODEL_FALLBACK;
      fb.fellBack = true;
      fb.primaryStatus = primaryStatus;
    } catch { /* Response not extensible — fallback still works */ }
    return fb;
  }
  try { res.modelUsed = GEMINI_MODEL; } catch { /* ignore */ }
  return res;
}

export default async function handler(req, res) {
  const t0 = performance.now();

  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return send(res, 500, { error: 'GEMINI_API_KEY not configured on server' });
  }

  // 1. Parse body
  const t1 = performance.now();
  let body;
  try {
    body = await readBody(req);
  } catch {
    return send(res, 400, { error: 'Invalid JSON body' });
  }
  const t1_ms = ms(t1);

  const { mode = 'ask', objet = '', answers = [], messages = [], category, lang = 'fr', profile = '', gift = '', surprise = false, friendId = '', conversationId = '', requestId = '', exclude = [], product = null, question = '', history = [] } = body;
  // Tag logged API calls with the conversation so the dashboard can count
  // distinct anonymous advisor sessions (anon users have no user_id).
  setRequestConversation(conversationId);

  // Home-page suggestion chips: a light, self-contained path (no Amazon
  // verification). Gemini picks ~8 product categories for the current season /
  // events, personalized by the optional profile. Any failure → 502 and the
  // client falls back to its static chip list.
  if (mode === 'suggestions') {
    const dateStr = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    const payload = {
      systemInstruction: { parts: [{ text: buildSuggestionsPrompt(lang, profile, dateStr) }] },
      contents: [{ role: 'user', parts: [{ text: 'Donne les suggestions.' }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 512, responseMimeType: 'application/json' },
    };
    try {
      const up = await callGemini(apiKey, payload);
      if (!up.ok) {
        const text = await up.text().catch(() => '');
        return send(res, up.status, { error: 'Upstream error', gemini_status: up.status, gemini_raw: text });
      }
      const j = await up.json();
      const c = j.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsedS = JSON.parse(c);
      const suggestions = (Array.isArray(parsedS.suggestions) ? parsedS.suggestions : [])
        .map((s) => ({
          label: String(s?.label ?? '').trim().slice(0, 40),
          icon: SUGGESTION_ICONS.includes(s?.icon) ? s.icon : 'default',
        }))
        .filter((s) => s.label)
        .slice(0, 5);
      return send(res, 200, { suggestions, _debug: { model: GEMINI_MODEL, request_id: requestId || null } });
    } catch (e) {
      return send(res, 502, { error: 'suggestions failed', detail: String(e) });
    }
  }

  // Per-account daily quota (signed-in users only). Verify the token, read
  // today's usage and reject early with 429 when over the cap. Any misconfig or
  // error skips metering so the advisor never breaks (graceful degradation).
  // usageAdmin / usageBefore are reused after the response to bump the counter.
  // supaCalls counts every Supabase round-trip this request makes (auth check,
  // usage read/write, friend profile lookups) — flushed once at the end as a
  // single row so the call-volume admin panel doesn't cost one insert per call.
  const supaCalls = { n: 0 };
  const requesterId = await getRequesterId(req, supaCalls);
  // Attribute every API call logged for the rest of this request to the user,
  // so the dashboard can exclude tester accounts from the call-volume stats.
  setRequestUser(requesterId);
  let usageAdmin = null;
  let usageBefore = null;
  if (requesterId && SUPA_URL && SUPA_SERVICE) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      usageAdmin = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } });
      usageBefore = await readUsageToday(usageAdmin, requesterId, supaCalls);
      const usedTokens = (usageBefore.input_tokens || 0) + (usageBefore.output_tokens || 0);
      if (usageBefore.requests >= AI_DAILY_REQUEST_CAP || usedTokens >= AI_DAILY_TOKEN_CAP) {
        await logApiCalls('supabase', supaCalls.n);
        return send(res, 429, {
          error: 'Daily AI quota reached',
          quota: {
            requests: usageBefore.requests,
            request_cap: AI_DAILY_REQUEST_CAP,
            tokens: usedTokens,
            token_cap: AI_DAILY_TOKEN_CAP,
          },
        });
      }
    } catch {
      usageAdmin = null;
    }
  }

  // Products the client already saw and wants different from ("show me others").
  const excludeNames = (Array.isArray(exclude) ? exclude : []).map((s) => String(s || '').trim()).filter(Boolean).slice(0, 30);
  // Legacy clients (mobile) send a full transcript in "messages" with no "mode".
  const legacy = Array.isArray(messages) && messages.length > 0 && body.mode == null;
  const isRecommend = mode === 'recommend';
  // Gift mode: a recipient description is sent instead of a product "objet".
  // For a friend, resolve their PRIVATE profile server-side (verified friendship)
  // and fold it into the recipient description — it never reaches the client.
  const friendRes = friendId ? await resolveFriendProfile(req, friendId, lang, supaCalls) : { text: '', wishlist: '', debug: null };
  const friendProfile = friendRes.text;
  const friendWishlist = friendRes.wishlist || '';
  const giftStr = [gift, friendProfile].map((s) => String(s || '').trim()).filter(Boolean).join('; ');
  // Supported on both the new (desktop) and legacy (mobile) paths.
  const isGift = giftStr.length > 0 || !!friendId;
  // Amazon verification searches by brand+model; in gift mode there is no single
  // product context, so don't prepend one.
  const searchTerm = isGift ? '' : (objet || category || (legacy ? (messages[0]?.content || '') : ''));

  // 2. Build prompt — new path sends a compact criteria JSON; legacy sends the transcript.
  const t2 = performance.now();
  let systemPrompt, contents, temperature;
  if (mode === 'product_qa') {
    systemPrompt = buildProductQaPrompt(product, lang);
    const qaHistory = Array.isArray(history) ? history.slice(-8) : [];
    const qaQuestion = String(question || '').trim() ||
      (lang === 'en' ? 'Give me a more detailed opinion on this product.' : 'Donne-moi un avis plus détaillé sur ce produit.');
    contents = [...toGeminiContents(qaHistory), { role: 'user', parts: [{ text: qaQuestion }] }];
    temperature = 0.6;
  } else if (legacy) {
    systemPrompt = isGift
      ? buildGiftSystemPrompt(giftStr, lang, surprise, friendWishlist)
      : buildSystemPrompt(category, lang, profile);
    contents = toGeminiContents(messages);
    temperature = isGift ? (surprise ? 0.95 : 0.7) : 0.5;
  } else if (isGift) {
    systemPrompt = isRecommend
      ? buildGiftRecommendPrompt(giftStr, answers, lang, excludeNames, surprise, friendWishlist)
      : buildGiftAskPrompt(giftStr, answers, lang);
    contents = [{ role: 'user', parts: [{ text: isRecommend ? 'Donne les idées de cadeaux.' : 'Pose la prochaine question.' }] }];
    temperature = isRecommend ? (surprise ? 0.95 : 0.7) : 0.5;
  } else {
    systemPrompt = isRecommend
      ? buildRecommendPrompt(searchTerm, answers, lang, excludeNames, profile)
      : buildAskPrompt(searchTerm, answers, lang, profile);
    contents = [{ role: 'user', parts: [{ text: isRecommend ? 'Donne les recommandations.' : 'Pose la prochaine question.' }] }];
    temperature = isRecommend ? 0.5 : 0.4;
  }
  // Cap output as a guard against runaway generation. Sized so a valid response
  // is never truncated (truncation => invalid JSON => 502): recommend returns a
  // batch of products, ask returns one short question. Legacy may do either, so
  // it gets the larger cap. The model stops when done — this doesn't pad output.
  const maxOutputTokens = mode === 'product_qa' ? 700 : (legacy || isRecommend) ? 2048 : 1024;
  const geminiPayload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature, maxOutputTokens, responseMimeType: 'application/json' },
  };
  const t2_ms = ms(t2);

  // 3. Call Gemini
  const t3 = performance.now();
  let upstream;
  try {
    upstream = await callGemini(apiKey, geminiPayload);
  } catch (e) {
    return send(res, 502, { error: 'Network error reaching Gemini', detail: String(e) });
  }
  const t3_ms = ms(t3);

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    let geminiError = {};
    try { geminiError = JSON.parse(text); } catch { /* raw text */ }
    return send(res, upstream.status, {
      error: 'Upstream error',
      gemini_status: upstream.status,
      gemini_status_text: upstream.statusText,
      gemini_model: upstream.modelUsed || GEMINI_MODEL,
      gemini_fell_back: !!upstream.fellBack,
      gemini_error: geminiError,
      gemini_raw: text,
    });
  }

  // 4. Read + parse Gemini response
  const t4 = performance.now();
  let json;
  try { json = await upstream.json(); } catch {
    return send(res, 502, { error: 'Upstream returned non-JSON', gemini_model: GEMINI_MODEL });
  }
  const t4_ms = ms(t4);

  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    return send(res, 502, {
      error: 'No content in Gemini response',
      gemini_model: GEMINI_MODEL,
      finish_reason: json.candidates?.[0]?.finishReason,
      prompt_feedback: json.promptFeedback,
      full_response: json,
    });
  }

  // 5. Parse model JSON output
  const t5 = performance.now();
  let parsed;
  try { parsed = JSON.parse(content); } catch {
    return send(res, 502, { error: 'Model returned invalid JSON', gemini_model: GEMINI_MODEL, raw: content });
  }
  const t5_ms = ms(t5);

  // Token usage — accumulated across calls so a retry's cost is visible too
  // (the previous version only reported the first call). gemini_calls = 2 means
  // the Amazon-retry fired and roughly doubled this request's token spend.
  let inputTokens = json.usageMetadata?.promptTokenCount ?? null;
  let outputTokens = json.usageMetadata?.candidatesTokenCount ?? null;
  let geminiCalls = 1;
  let amazonVerifyMs = 0;
  let amazonBlocked = false;
  let amazonError = null;
  let directCount = 0;

  // New path: recommend decided by mode. Legacy path: decided by parsed.action.
  const doRecommend = legacy ? (parsed.action === 'recommend') : isRecommend;

  // 6. If recommend: verify sequentially (avoids Amazon bot detection from parallel requests)
  if (doRecommend && Array.isArray(parsed.products) && parsed.products.length) {
    const t6 = performance.now();
    const triedNames = new Set();
    let verifiedProducts = [];
    const searchContext = searchTerm;
    // Filter Amazon results to the user's budget bracket (gift mode keeps its
    // budget in free text, not structured answers, so this is simply empty there).
    const budget = budgetBoundsCents(answers);

    const verifyCandidates = async (candidates) => {
      for (const p of candidates) {
        if (verifiedProducts.length >= 3) break;
        triedNames.add(`${p.brand} ${p.model}`);
        const check = await checkAmazon(p.brand, p.model, searchContext, {
          ...budget,
          expectedPrice: Number(p.price) || 0,
        });
        if (check.found === null) { amazonBlocked = true; amazonError = check.error || null; break; }
        if (check.found === true && isCoherent(p.brand, p.model, check.title)) {
          verifiedProducts.push({
            ...p,
            amazon_verified: true,
            // Replace Gemini's guessed data with real Amazon first-result data
            brand:      check.brand      || p.brand,
            model:      check.model      || p.model,
            amazon_url: check.amazon_url,
            image_url:  check.image_url  ?? null,
            price:      check.price      ?? p.price,
            rating:     check.rating     ?? null,
            reviews:    check.reviews    ?? null,
          });
        }
      }
    };

    await verifyCandidates(parsed.products);

    // If not blocked but < 3 found, ask Gemini for replacements (excluding tried)
    if (!amazonBlocked && verifiedProducts.length < 3) {
      const triedList = [...triedNames].join(', ');
      // Only ask for what's still missing (+ a small buffer) instead of a full
      // batch: most retries need 1–2 more products, so a 3–4 batch roughly halves
      // the 2nd call's output tokens. maxOutputTokens scales with that count too.
      const needed = 3 - verifiedProducts.length;
      const retryCount = Math.max(2, Math.min(RECOMMEND_COUNT, needed + 2));
      const retryMaxTokens = recMaxTokens(retryCount);
      const retryPayload = legacy
        ? {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [
              ...toGeminiContents(messages),
              { role: 'model', parts: [{ text: content }] },
              { role: 'user', parts: [{ text: `Ces produits sont introuvables sur Amazon.fr : ${triedList}. Propose ${retryCount} autres produits différents qui existent vraiment sur Amazon.fr pour la même recherche.` }] },
            ],
            generationConfig: { temperature: 0.6, maxOutputTokens: retryMaxTokens, responseMimeType: 'application/json' },
          }
        : {
            systemInstruction: { parts: [{ text: isGift
              ? buildGiftRecommendPrompt(giftStr, answers, lang, [...triedNames, ...excludeNames], surprise, friendWishlist, retryCount)
              : buildRecommendPrompt(searchTerm, answers, lang, [...triedNames, ...excludeNames], profile, retryCount) }] },
            contents: [{ role: 'user', parts: [{ text: `Donne ${retryCount} autres recommandations.` }] }],
            generationConfig: { temperature: 0.6, maxOutputTokens: retryMaxTokens, responseMimeType: 'application/json' },
          };
      try {
        const repUpstream = await callGemini(apiKey, retryPayload);
        if (repUpstream.ok) {
          const repJson = await repUpstream.json();
          geminiCalls += 1;
          inputTokens = (inputTokens || 0) + (repJson.usageMetadata?.promptTokenCount || 0);
          outputTokens = (outputTokens || 0) + (repJson.usageMetadata?.candidatesTokenCount || 0);
          const repText = repJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (repText) {
            const repParsed = JSON.parse(repText);
            if (Array.isArray(repParsed.products)) {
              const fresh = repParsed.products.filter((p) => !triedNames.has(`${p.brand} ${p.model}`));
              await verifyCandidates(fresh);
            }
          }
        }
      } catch { /* keep what we have */ }
    }

    amazonVerifyMs = ms(t6);

    // Assemble final list. Direct /dp/ASIN links (scraped, with real data) come
    // first — these are the best for conversion + commission attribution. If we
    // have fewer than 3 (Amazon blocked our scraping or too few coherent hits),
    // top up with Gemini candidates using PRECISE brand+model affiliate search
    // links as a last resort, so every link still carries our tag and lands as
    // close as possible to the exact product.
    const finalProducts = [...verifiedProducts];
    const used = new Set(finalProducts.map((p) => `${p.brand} ${p.model}`.toLowerCase()));
    for (const p of parsed.products) {
      if (finalProducts.length >= 3) break;
      const key = `${p.brand} ${p.model}`.toLowerCase();
      if (used.has(key)) continue;
      used.add(key);
      finalProducts.push({
        ...p,
        amazon_verified: false,
        amazon_url: searchLink(p.brand, p.model),
        image_url: null,
      });
    }
    parsed.products = finalProducts.slice(0, 3);
    directCount = verifiedProducts.length;
  }

  const totalMs = ms(t0);

  parsed._debug = {
    // Echo the caller's ids so every exchange is traceable end to end and
    // concurrent conversations can't be confused (client logs match server).
    conversation_id: conversationId || null,
    request_id: requestId || null,
    model: upstream.modelUsed || GEMINI_MODEL,
    gemini_fell_back: !!upstream.fellBack,
    timings_ms: {
      parse_body:        t1_ms,
      build_prompt:      t2_ms,
      gemini_api_call:   t3_ms,
      read_response:     t4_ms,
      parse_json_output: t5_ms,
      amazon_verify:     amazonVerifyMs,
      total:             totalMs,
    },
    amazon_blocked: amazonBlocked,
    amazon_error: amazonError,
    direct_links: directCount,
    friend: friendRes.debug,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    gemini_calls: geminiCalls,
  };

  // Account this request's spend (retry included) and echo today's running
  // totals so the client can mirror "N requests left" in localStorage. Awaited
  // (serverless may reclaim the function right after the response) but wrapped so
  // a metering failure never breaks the reply.
  if (usageAdmin && requesterId) {
    try {
      await usageAdmin.rpc('increment_ai_usage', {
        p_user: requesterId,
        p_in: inputTokens || 0,
        p_out: outputTokens || 0,
      });
    } catch { /* counter is best-effort */ }
    supaCalls.n++;
    const beforeTok = usageBefore ? (usageBefore.input_tokens || 0) + (usageBefore.output_tokens || 0) : 0;
    parsed._debug.usage = {
      requests: (usageBefore?.requests || 0) + 1,
      request_cap: AI_DAILY_REQUEST_CAP,
      tokens: beforeTok + (inputTokens || 0) + (outputTokens || 0),
      token_cap: AI_DAILY_TOKEN_CAP,
    };
  } else {
    parsed._debug.usage = null;
  }

  await logApiCalls('supabase', supaCalls.n);
  return send(res, 200, parsed);
}
