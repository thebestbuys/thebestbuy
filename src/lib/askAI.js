// Empty in dev / web builds → relative path resolved by Vite middleware or Vercel.
// Set VITE_API_BASE_URL=https://your-app.vercel.app for the native APK build.
import { recordUsage } from './usage.js';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Unique id for a single backend exchange (one /api/chat round-trip). Combined
// with the caller's conversationId, it makes every Gemini call traceable end to
// end — so concurrent conversations (e.g. two browser tabs) never get confused.
function genRequestId() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function postChat(payload, token) {
  const requestId = genRequestId();
  const conversationId = payload.conversationId || '';
  // Tag every exchange so two conversations running at once are easy to tell
  // apart in the console / Network tab. Echoed back by the server in _debug.
  const body = { ...payload, requestId };
  const headers = { 'Content-Type': 'application/json' };
  // For gifting to a friend, the bearer token lets the server resolve the
  // friend's private profile after verifying the friendship.
  if (token) headers.Authorization = `Bearer ${token}`;
  if (typeof console !== 'undefined') {
    console.debug(`[chat →] conv=${conversationId || '?'} req=${requestId} mode=${payload.mode || 'legacy'}`);
  }
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = await res.json();
      detail = errBody.detail || errBody.error || '';
      if (typeof detail !== 'string') detail = JSON.stringify(detail);
    } catch {
      detail = await res.text().catch(() => '');
    }

    const isQuota =
      res.status === 429 ||
      /RESOURCE_EXHAUSTED|insufficient_quota|quota/i.test(detail);

    if (isQuota) {
      throw new Error("quota IA épuisée, réessayez dans quelques instants");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("clé API invalide ou non autorisée");
    }
    if (res.status >= 500) {
      throw new Error("service indisponible, réessayez");
    }
    throw new Error(`erreur ${res.status}`);
  }

  const json = await res.json();
  // Mirror the server's per-account usage snapshot for the "requests left" UI.
  recordUsage(json?._debug?.usage);
  if (typeof console !== 'undefined') {
    const d = json?._debug || {};
    console.debug(`[chat ←] conv=${d.conversation_id || conversationId || '?'} req=${d.request_id || requestId}`);
  }
  return json;
}

// Legacy transcript-based API — still used by the mobile app.
// `gift` (when set) switches to gift mode; `surprise` asks for bolder ideas.
// `friendId` + `token`: gift for a friend whose profile is resolved server-side.
export function askAI({ messages, category, lang = 'fr', profile = '', gift = '', surprise = false, friendId = '', token = '', conversationId = '' }) {
  return postChat({
    category,
    lang,
    profile,
    gift,
    surprise,
    friendId,
    conversationId,
    messages: messages.map((m) => ({
      role: m.role === 'bot' || m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    })),
  }, token);
}

// Ask for the next question, given the compact criteria gathered so far.
// `profile` is an optional free-form user self-description for personalization.
// `gift` (when set) switches to gift mode: a compact recipient description.
export function askQuestion({ objet, answers, lang = 'fr', profile = '', gift = '', giftMode = false, surprise = false, friendId = '', token = '', conversationId = '' }) {
  return postChat({ mode: 'ask', objet, answers, lang, profile, gift, giftMode, surprise, friendId, conversationId }, token);
}

// Ask for product recommendations from the accumulated criteria.
// `surprise` (gift mode) asks for bolder, more unexpected ideas.
export function recommend({ objet, answers, lang = 'fr', profile = '', gift = '', giftMode = false, surprise = false, friendId = '', token = '', conversationId = '', exclude = [] }) {
  return postChat({ mode: 'recommend', objet, answers, lang, profile, gift, giftMode, surprise, friendId, conversationId, exclude }, token);
}

// Home-page suggestion chips chosen by the AI for the current season / events,
// personalized by the optional free-form `profile`. Returns [{label, icon}]
// ([] on any failure, so the caller keeps its static fallback list).
//
// Cached per (UTC day, lang, profile) in localStorage: the chips only need to
// change daily, but the effect that fetches them re-runs on every home mount.
// Without the cache that's one Gemini "suggestions" call per visit — pure waste.
// `force` (the "other ideas" re-roll) bypasses the cache AND refreshes it, so the
// newest set sticks for later visits that day.
const SUGG_CACHE_KEY = 'bb_suggestions';

function suggHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h.toString(36);
}

function suggCacheKey(lang, profile) {
  const day = new Date().toISOString().slice(0, 10);
  return `${day}|${lang}|${suggHash(profile || '')}`;
}

function readSuggCache(lang, profile) {
  try {
    const raw = localStorage.getItem(SUGG_CACHE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || o.key !== suggCacheKey(lang, profile)) return null;
    return Array.isArray(o.list) && o.list.length ? o.list : null;
  } catch {
    return null;
  }
}

function writeSuggCache(lang, profile, list) {
  try {
    localStorage.setItem(SUGG_CACHE_KEY, JSON.stringify({ key: suggCacheKey(lang, profile), list }));
  } catch {}
}

export async function fetchSuggestions({ lang = 'fr', profile = '', force = false } = {}) {
  const cached = readSuggCache(lang, profile);
  if (!force && cached) return cached;
  try {
    // On a re-roll ("other ideas"), tell Gemini which chips are already on
    // screen so it proposes genuinely different ones instead of repeating.
    const exclude = force && Array.isArray(cached)
      ? cached.map((s) => (typeof s === 'string' ? s : s?.label)).filter(Boolean)
      : [];
    const json = await postChat({ mode: 'suggestions', lang, profile, exclude });
    const list = Array.isArray(json?.suggestions) ? json.suggestions : [];
    if (list.length) writeSuggCache(lang, profile, list);
    return list;
  } catch {
    return [];
  }
}

// Ask Gemini about ONE specific product already shown (detail page "ask for
// more detail" button + the mini Q&A chat). `history` is the running Q&A so
// far ([{role:'user'|'assistant', text}]) so follow-up questions stay coherent.
export function askProductQuestion({ product, question = '', history = [], lang = 'fr', token = '' }) {
  return postChat({ mode: 'product_qa', product, question, history, lang }, token);
}

// Enrich a product with real Amazon data (image, URL, rating, reviews).
// Returns the same product object with extra fields merged in.
export async function enrichProduct(product) {
  try {
    const q = `${product.brand} ${product.model}`;
    const res = await fetch(`${API_BASE}/api/amazon?q=${encodeURIComponent(q)}`);
    if (!res.ok) return product;
    const data = await res.json();
    // Prefer a direct product link (/dp/ASIN) over a search link: if the
    // product currently only has a search link but /api/amazon found a real
    // product page, upgrade to that direct link (better conversion + tracking).
    const isDirect = (u) => typeof u === 'string' && u.includes('/dp/');
    const amazon_url = isDirect(product.amazon_url)
      ? product.amazon_url
      : (isDirect(data.amazon_url) ? data.amazon_url : (product.amazon_url || data.amazon_url || null));
    return {
      ...product,
      rating:    data.rating  ?? product.rating,
      reviews:   data.reviews ?? product.reviews,
      amazon_url,
      image_url: product.image_url || data.image_url || null,
    };
  } catch {
    return product;
  }
}
