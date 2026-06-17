// Amazon Creators API client — replaces the AWS-WAF-blocked HTML scraping.
//
// The legacy PA-API 5.0 (AWS SigV4) was retired 2026-05-15. The Creators API
// uses OAuth 2.0 client-credentials: we exchange the Credential ID / Secret
// (Associates Central → Tools → Creators API) for a short-lived bearer token,
// then POST lowerCamelCase bodies to {BASE}/searchItems | /getItems.
//
// IMPORTANT: nothing here ever throws to the caller's happy path — callers
// catch and degrade to the "estimate only" UI. Everything that can differ
// between regions / credential versions is env-driven so we can fix a wrong
// endpoint without a code change:
//
//   AMAZON_CREATORS_CLIENT_ID      (required)  Credential ID
//   AMAZON_CREATORS_CLIENT_SECRET  (required)  Credential Secret
//   AMAZON_PARTNER_TAG             default oraklia123-21
//   AMAZON_MARKETPLACE            default www.amazon.fr
//   AMAZON_CREATORS_TOKEN_URL     default https://api.amazon.com/auth/o2/token
//                                 (EU/v3 alt: https://api.amazon.co.uk/auth/o2/token)
//   AMAZON_CREATORS_SCOPE         default creatorsapi/default
//   AMAZON_CREATORS_API_BASE      default https://creatorsapi.amazon/catalog/v1
//   AMAZON_CREATORS_RESOURCES     comma-separated override of the fields below

const CLIENT_ID = process.env.AMAZON_CREATORS_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AMAZON_CREATORS_CLIENT_SECRET || '';
export const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG || 'oraklia123-21';
const MARKETPLACE = process.env.AMAZON_MARKETPLACE || 'www.amazon.fr';
const TOKEN_URL = process.env.AMAZON_CREATORS_TOKEN_URL || 'https://api.amazon.com/auth/o2/token';
const SCOPE = process.env.AMAZON_CREATORS_SCOPE || 'creatorsapi/default';
const API_BASE = (process.env.AMAZON_CREATORS_API_BASE || 'https://creatorsapi.amazon/catalog/v1').replace(/\/+$/, '');

// Conservative default: only resources confirmed by a working Creators API
// client. Adding unknown resource names risks a 400 that fails the whole call.
// Notably we do NOT request customerReviews — Amazon's API has never returned
// real star ratings / review counts, and an invalid name would break verify.
const RESOURCES = (process.env.AMAZON_CREATORS_RESOURCES ||
  'images.primary.large,itemInfo.title,offersV2.listings.price')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

export function creatorsConfigured() {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

// --- token cache (module scope → survives warm serverless invocations) ---
let _token = null; // { value, expiresAt }

async function getAccessToken() {
  if (_token && _token.expiresAt > Date.now() + 30_000) return _token.value;
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope: SCOPE }).toString(),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`token ${res.status}: ${text.slice(0, 180)}`);
  }
  const json = await res.json();
  if (!json.access_token) throw new Error('token: no access_token in response');
  const ttl = (Number(json.expires_in) || 3600) * 1000;
  _token = { value: json.access_token, expiresAt: Date.now() + ttl };
  return _token.value;
}

async function catalog(operation, body) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/${operation}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-marketplace': MARKETPLACE,
    },
    body: JSON.stringify({
      partnerTag: PARTNER_TAG,
      partnerType: 'Associates',
      marketplace: MARKETPLACE,
      ...body,
    }),
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // 403 (account not yet eligible), 429 (1 TPS / daily-cap throttle), 5xx…
    throw new Error(`${operation} ${res.status}: ${text.slice(0, 180)}`);
  }
  return res.json();
}

// Map one Creators API item → the compact shape checkAmazon() already returns.
// Defensive on every path: the exact offersV2 nesting is loosely documented.
function mapItem(item) {
  if (!item) return null;
  const asin = item.asin || item.ASIN || null;
  const title = item.itemInfo?.title?.displayValue ?? null;
  const image =
    item.images?.primary?.large?.url ||
    item.images?.primary?.medium?.url ||
    item.images?.primary?.small?.url ||
    null;

  // Canonical affiliate product URL provided by the API — it already carries
  // our partner tag + tracking params, so it's the *proper* link to use and is
  // preferred over a hand-built /dp/ASIN?tag= URL. Returned by default (not a
  // requestable resource). camelCase in the Creators API (PA-API: DetailPageURL).
  const detailPageURL = item.detailPageURL || item.DetailPageURL || null;

  const listing = item.offersV2?.listings?.[0] || item.offers?.listings?.[0] || null;
  const rawPrice =
    listing?.price?.money?.amount ??
    listing?.price?.amount ??
    listing?.price?.value ??
    null;
  const price = rawPrice != null ? Math.round(Number(rawPrice)) || null : null;

  return { asin, title, image, price, detailPageURL };
}

// In-process result cache to protect the daily quota (8,640/day for the first
// 30 days). Best-effort: cold starts wipe it. Errors are never cached (they
// throw before we reach set), so a transient 429 won't poison results.
const _cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

// Search Amazon.fr and return up to 3 mapped candidates (best-of-N is decided
// by the caller, which has the expected brand/model/price to score against).
// `minPrice`/`maxPrice` are budget bounds in CENTS (PA-API/Creators units —
// 3241 = 32.41€): minPrice keeps items with ≥1 offer above it, maxPrice ≤ it.
// Cache key folds in the price bounds so two budgets don't share a result.
export async function searchItems(keywords, { minPrice, maxPrice } = {}) {
  const key = String(keywords || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!key) return [];
  const lo = Number.isFinite(minPrice) && minPrice > 0 ? Math.round(minPrice) : undefined;
  const hi = Number.isFinite(maxPrice) && maxPrice > 0 ? Math.round(maxPrice) : undefined;
  const cacheKey = `${key}|${lo ?? ''}|${hi ?? ''}`;
  const hit = _cache.get(cacheKey);
  if (hit && hit.expiresAt > Date.now()) return hit.items;

  const body = { keywords: key, itemCount: 3, resources: RESOURCES };
  if (lo !== undefined) body.minPrice = lo;
  if (hi !== undefined) body.maxPrice = hi;

  const json = await catalog('searchItems', body);
  const raw = json.searchResult?.items || json.itemsResult?.items || json.items || [];
  const items = raw.map(mapItem).filter(Boolean);

  _cache.set(cacheKey, { items, expiresAt: Date.now() + CACHE_TTL });
  return items;
}

// Back-compat thin wrapper: first candidate only (used by /api/amazon enrich).
export async function searchFirstItem(keywords, opts) {
  const items = await searchItems(keywords, opts);
  return items[0] || null;
}
