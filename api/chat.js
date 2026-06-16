const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const AFFILIATE_TAG = 'oraklia123-21';

// Server-side Supabase config for friend-gift profile resolution.
const SUPA_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPA_ANON = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
async function resolveFriendProfile(req, friendId, lang) {
  const debug = {
    env: { url: !!SUPA_URL, anon: !!SUPA_ANON, service: !!SUPA_SERVICE },
    hasToken: false,
    userOk: false,
    verified: false,
    profileLen: 0,
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
    const requesterId = userData?.user?.id;
    debug.userOk = !!requesterId;
    if (userErr || !requesterId || requesterId === friendId) {
      debug.error = userErr ? 'getUser: ' + (userErr.message || 'failed') : 'no requester';
      return { text: '', debug };
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
    if (linkErr) debug.error = 'link: ' + (linkErr.message || 'failed');
    if (!link) return { text: '', debug }; // not friends → never use their profile
    debug.verified = true;

    const { data: prof, error: profErr } = await admin
      .from('profiles')
      .select('data')
      .eq('user_id', friendId)
      .maybeSingle();
    if (profErr) debug.error = 'profile: ' + (profErr.message || 'failed');
    const text = profileDataToString(prof?.data, lang);
    debug.profileLen = text.length;
    return { text, debug };
  } catch (e) {
    debug.error = 'exception: ' + (e?.message || String(e));
    return { text: '', debug };
  }
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
  : `Question courte, 2 à 4 choix concrets. Les choix peuvent porter des "tags" courts (ex: "ios", "anc", "gaming").`}

Réponds UNIQUEMENT par un objet JSON valide de cette forme:
{"reply":"<la question à afficher>","question":{"id":"slug-court","text":"<la question>","choices":[{"id":"slug","label":"Libellé court","tags":[],"min":null,"max":null}]}}`;
}

// Prompt to generate 10 real product candidates from the criteria JSON.
function buildRecommendPrompt(objet, answers, lang, exclude = [], profile = '') {
  const excludeLine = exclude.length
    ? `\nNE propose AUCUN de ces produits (déjà testés, introuvables sur Amazon.fr) : ${exclude.join(', ')}. Propose-en 10 AUTRES, différents.`
    : '';
  return `Tu es Oraklia, un conseiller d'achat. ${langLineFor(lang)}
L'utilisateur cherche à acheter : "${objet || 'un produit'}".${profileLine(profile)}
Critères recueillis (JSON): ${answersJson(answers)}

Propose EXACTEMENT 10 produits RÉELS, populaires et récents, réellement vendus sur Amazon.fr, correspondant au mieux à ces critères. Donne des marques et modèles PRÉCIS. Chaque produit a un score de correspondance 0-99 selon les critères.${excludeLine}

Réponds UNIQUEMENT par un objet JSON valide de cette forme:
{"reply":"<courte phrase d'introduction>","products":[{"id":"p1","brand":"Marque","model":"Modèle exact","price":999,"score":94,"specs":["Spec 1","Spec 2","Spec 3","Spec 4"],"why":"Raison courte"}]}`;
}

// ── Gift mode ──────────────────────────────────────────────────────────────
// One next question to refine gift ideas for the described recipient.
function buildGiftAskPrompt(giftStr, answers, lang) {
  return `Tu es Oraklia, un conseiller en idées cadeaux. ${langLineFor(lang)}
On cherche un CADEAU pour une personne décrite ainsi : "${giftStr}".
Préférences de raffinement déjà recueillies (JSON): ${answersJson(answers)}

Pose UNE SEULE nouvelle question courte (2 à 4 choix concrets) pour mieux cerner le cadeau idéal, sur une dimension PAS ENCORE couverte (ex: style/usage, pratique vs original, plaisir vs utile, univers précis). Ne repose jamais le budget ni l'occasion (déjà connus). Les choix peuvent porter des "tags" courts.

Réponds UNIQUEMENT par un objet JSON valide de cette forme:
{"reply":"<la question à afficher>","question":{"id":"slug-court","text":"<la question>","choices":[{"id":"slug","label":"Libellé court","tags":[],"min":null,"max":null}]}}`;
}

// 10 real, varied gift product candidates for the recipient + occasion + budget.
function buildGiftRecommendPrompt(giftStr, answers, lang, exclude = [], surprise = false) {
  const excludeLine = exclude.length
    ? `\nNE propose AUCUN de ces produits (déjà testés, introuvables sur Amazon.fr) : ${exclude.join(', ')}. Propose-en 10 AUTRES, différents.`
    : '';
  const surpriseLine = surprise
    ? "\nMODE SURPRISE : ose des idées ORIGINALES, inattendues et créatives (pas seulement les évidences) tout en restant adaptées à la personne et au budget. Privilégie la nouveauté et l'effet \"waouh\"."
    : '';
  return `Tu es Oraklia, un conseiller en idées cadeaux. ${langLineFor(lang)}
On cherche un CADEAU pour une personne décrite ainsi : "${giftStr}".
Préférences de raffinement (JSON): ${answersJson(answers)}

Propose EXACTEMENT 10 idées de cadeaux : des produits RÉELS, populaires et récents, réellement vendus sur Amazon.fr, qui feraient de bons cadeaux pour CETTE personne, pour cette occasion et DANS le budget indiqué. VARIE les catégories (pas 10 produits du même type). Donne des marques et modèles PRÉCIS. "why" explique en une phrase pourquoi ça correspond à la personne. Score 0-99 = à quel point l'idée lui correspond.${surpriseLine}${excludeLine}

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
function buildGiftSystemPrompt(giftStr, lang = 'fr', surprise = false) {
  const langLine = langLineFor(lang);
  const surpriseLine = surprise
    ? "\nMODE SURPRISE : ose des idées ORIGINALES, inattendues et créatives (pas seulement les évidences) tout en restant adaptées à la personne et au budget."
    : '';
  return `Tu es Oraklia, un conseiller en idées cadeaux conversationnel.
LANGUE DE RÉPONSE / OUTPUT LANGUAGE: ${langLine}
On cherche un CADEAU pour une personne décrite ainsi : "${giftStr}".${surpriseLine}

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

// Searches Amazon, returns first real result with full data — null = blocked.
async function checkAmazon(brand, model, searchContext) {
  const q = encodeURIComponent(`${searchContext ? searchContext + ' ' : ''}${brand} ${model}`);
  try {
    const res = await fetch(`https://www.amazon.fr/s?k=${q}&language=fr_FR`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return { found: null };
    const html = await res.text();
    // Amazon's AWS WAF bot challenge answers with HTTP 202 (still 2xx) and a tiny
    // JS-challenge page. Detect it (and CAPTCHA pages) and treat as BLOCKED so we
    // bail immediately instead of probing every candidate for 3s each.
    if (
      res.status !== 200 ||
      html.length < 10000 ||
      html.includes('awsWaf') ||
      html.includes('AwsWafIntegration') ||
      html.includes('validateCaptcha') ||
      html.includes('robot check')
    ) {
      return { found: null };
    }

    const resultIdx = html.indexOf('data-component-type="s-search-result"');
    if (resultIdx === -1) return { found: false };

    const ctx = html.slice(Math.max(0, resultIdx - 400), resultIdx + 400);
    const asinMatch = ctx.match(/data-asin="([A-Z0-9]{10})"/);
    if (!asinMatch?.[1]) return { found: false };

    const asin = asinMatch[1];
    const chunk = html.slice(resultIdx, resultIdx + 12000);

    // Image
    const imgMatch =
      chunk.match(/class="s-image"[^>]*src="(https:\/\/m\.media-amazon\.com[^"]+)"/) ||
      chunk.match(/class="s-image"[^>]*data-src="(https:\/\/m\.media-amazon\.com[^"]+)"/);

    // Title — first matching span class Amazon uses for product titles
    const titleRaw =
      chunk.match(/class="a-size-base-plus a-color-base a-text-normal">([^<]+)</)?.at(1)?.trim() ||
      chunk.match(/class="a-size-medium a-color-base a-text-normal">([^<]+)</)?.at(1)?.trim() ||
      null;

    // Split "ASUS Zenbook S 13 OLED..." → brand=ASUS, model=Zenbook S 13 OLED...
    const titleWords = titleRaw ? titleRaw.split(' ') : [];
    const amazonBrand = titleWords[0] || brand;
    const amazonModel = titleWords.slice(1).join(' ') || model;

    // Price — the most reliable source is the fully-formatted "a-offscreen" span
    // (e.g. "1 199,00 €"). Take the integer euros before the decimal comma; fall
    // back to "a-price-whole". Strip spaces/NBSP/thousands separators.
    let price = null;
    const offscreen = chunk.match(/class="a-offscreen">\s*([\d.,\s]+?)\s*€/);
    if (offscreen) {
      const intPart = offscreen[1].replace(/[\s €]/g, '').split(',')[0];
      price = parseInt(intPart.replace(/\D/g, ''), 10) || null;
    }
    if (price == null) {
      const pw = chunk.match(/class="a-price-whole">\s*([^<]+)/);
      price = pw ? (parseInt(pw[1].replace(/\D/g, ''), 10) || null) : null;
    }

    // Rating: "4,5 sur 5"
    const ratingMatch = chunk.match(/(\d[,.]\d)\s+sur\s+5/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;

    // Reviews
    const reviewMatch = chunk.match(/aria-label="([\d][\d ]*)\s*évaluation/);
    const reviews = reviewMatch ? (parseInt(reviewMatch[1].replace(/\D/g, ''), 10) || null) : null;

    return {
      found: true,
      title: titleRaw,
      amazon_url: `https://www.amazon.fr/dp/${asin}?tag=${AFFILIATE_TAG}`,
      image_url: imgMatch?.[1] ?? null,
      brand: amazonBrand,
      model: amazonModel,
      price,
      rating,
      reviews,
    };
  } catch {
    return { found: null };
  }
}

async function callGemini(apiKey, body) {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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

  const { mode = 'ask', objet = '', answers = [], messages = [], category, lang = 'fr', profile = '', gift = '', surprise = false, friendId = '' } = body;
  // Legacy clients (mobile) send a full transcript in "messages" with no "mode".
  const legacy = Array.isArray(messages) && messages.length > 0 && body.mode == null;
  const isRecommend = mode === 'recommend';
  // Gift mode: a recipient description is sent instead of a product "objet".
  // For a friend, resolve their PRIVATE profile server-side (verified friendship)
  // and fold it into the recipient description — it never reaches the client.
  const friendRes = friendId ? await resolveFriendProfile(req, friendId, lang) : { text: '', debug: null };
  const friendProfile = friendRes.text;
  const giftStr = [gift, friendProfile].map((s) => String(s || '').trim()).filter(Boolean).join('; ');
  // Supported on both the new (desktop) and legacy (mobile) paths.
  const isGift = giftStr.length > 0 || !!friendId;
  // Amazon verification searches by brand+model; in gift mode there is no single
  // product context, so don't prepend one.
  const searchTerm = isGift ? '' : (objet || category || (legacy ? (messages[0]?.content || '') : ''));

  // 2. Build prompt — new path sends a compact criteria JSON; legacy sends the transcript.
  const t2 = performance.now();
  let systemPrompt, contents, temperature;
  if (legacy) {
    systemPrompt = isGift
      ? buildGiftSystemPrompt(giftStr, lang, surprise)
      : buildSystemPrompt(category, lang, profile);
    contents = toGeminiContents(messages);
    temperature = isGift ? (surprise ? 0.95 : 0.7) : 0.5;
  } else if (isGift) {
    systemPrompt = isRecommend
      ? buildGiftRecommendPrompt(giftStr, answers, lang, [], surprise)
      : buildGiftAskPrompt(giftStr, answers, lang);
    contents = [{ role: 'user', parts: [{ text: isRecommend ? 'Donne les idées de cadeaux.' : 'Pose la prochaine question.' }] }];
    temperature = isRecommend ? (surprise ? 0.95 : 0.7) : 0.5;
  } else {
    systemPrompt = isRecommend
      ? buildRecommendPrompt(searchTerm, answers, lang, [], profile)
      : buildAskPrompt(searchTerm, answers, lang, profile);
    contents = [{ role: 'user', parts: [{ text: isRecommend ? 'Donne les recommandations.' : 'Pose la prochaine question.' }] }];
    temperature = isRecommend ? 0.5 : 0.4;
  }
  const geminiPayload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature, responseMimeType: 'application/json' },
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
      gemini_model: GEMINI_MODEL,
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

  const debugTokens = {
    input_tokens:  json.usageMetadata?.promptTokenCount ?? null,
    output_tokens: json.usageMetadata?.candidatesTokenCount ?? null,
  };
  let amazonVerifyMs = 0;
  let amazonBlocked = false;
  let directCount = 0;

  // New path: recommend decided by mode. Legacy path: decided by parsed.action.
  const doRecommend = legacy ? (parsed.action === 'recommend') : isRecommend;

  // 6. If recommend: verify sequentially (avoids Amazon bot detection from parallel requests)
  if (doRecommend && Array.isArray(parsed.products) && parsed.products.length) {
    const t6 = performance.now();
    const triedNames = new Set();
    let verifiedProducts = [];
    const searchContext = searchTerm;

    const verifyCandidates = async (candidates) => {
      for (const p of candidates) {
        if (verifiedProducts.length >= 3) break;
        triedNames.add(`${p.brand} ${p.model}`);
        const check = await checkAmazon(p.brand, p.model, searchContext);
        if (check.found === null) { amazonBlocked = true; break; }
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
      const retryPayload = legacy
        ? {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [
              ...toGeminiContents(messages),
              { role: 'model', parts: [{ text: content }] },
              { role: 'user', parts: [{ text: `Ces produits sont introuvables sur Amazon.fr : ${triedList}. Propose 10 autres produits différents qui existent vraiment sur Amazon.fr pour la même recherche.` }] },
            ],
            generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
          }
        : {
            systemInstruction: { parts: [{ text: isGift
              ? buildGiftRecommendPrompt(giftStr, answers, lang, [...triedNames], surprise)
              : buildRecommendPrompt(searchTerm, answers, lang, [...triedNames], profile) }] },
            contents: [{ role: 'user', parts: [{ text: 'Donne 10 autres recommandations.' }] }],
            generationConfig: { temperature: 0.6, responseMimeType: 'application/json' },
          };
      try {
        const repUpstream = await callGemini(apiKey, retryPayload);
        if (repUpstream.ok) {
          const repJson = await repUpstream.json();
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
    model: GEMINI_MODEL,
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
    direct_links: directCount,
    friend: friendRes.debug,
    ...debugTokens,
  };

  return send(res, 200, parsed);
}
