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
//   AMAZON_CREATORS_TOKEN_URL     default https://api.amazon.co.uk/auth/o2/token
//                                 (EU region — FR/DE/etc. The security profile's
//                                 region decides this; NA alt: https://api.amazon.com/auth/o2/token)
//   AMAZON_CREATORS_SCOPE         default creatorsapi/default
//   AMAZON_CREATORS_API_BASE      default https://creatorsapi.amazon/catalog/v1
//   AMAZON_CREATORS_RESOURCES     comma-separated override of the fields below

import { logApiCalls } from './_metrics.js';

const CLIENT_ID = process.env.AMAZON_CREATORS_CLIENT_ID || '';
const CLIENT_SECRET = process.env.AMAZON_CREATORS_CLIENT_SECRET || '';
export const PARTNER_TAG = process.env.AMAZON_PARTNER_TAG || 'oraklia123-21';
const MARKETPLACE = process.env.AMAZON_MARKETPLACE || 'www.amazon.fr';
// EU region by default — this app's marketplace is www.amazon.fr and the
// Login-with-Amazon security profile lives in the EU region, so the NA endpoint
// (api.amazon.com) returns a 400. Override via env for NA/FE accounts.
const TOKEN_URL = process.env.AMAZON_CREATORS_TOKEN_URL || 'https://api.amazon.co.uk/auth/o2/token';
// v3.x credentials (LWA direct) use the double-colon scope; the older v2.x
// Cognito-fronted creds used 'creatorsapi/default'. Wrong form → invalid_scope.
const SCOPE = process.env.AMAZON_CREATORS_SCOPE || 'creatorsapi::default';
const API_BASE = (process.env.AMAZON_CREATORS_API_BASE || 'https://creatorsapi.amazon/catalog/v1').replace(/\/+$/, '');

// Conservative default: only resources confirmed by a working Creators API
// client. Adding unknown resource names risks a 400 that fails the whole call.
// Notably we do NOT request customerReviews — Amazon's API has never returned
// real star ratings / review counts, and an invalid name would break verify.
const RESOURCES = (process.env.AMAZON_CREATORS_RESOURCES ||
  'images.primary.large,images.variants.large,itemInfo.title,offersV2.listings.price')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Same list minus the extra product-gallery images ("variants"). If requesting
// variants ever 400s (unknown/unsupported resource on this credential), we fall
// back to this so verification never breaks — see searchItems' retry below.
const RESOURCES_NO_VARIANTS = RESOURCES.filter((r) => !/^images\.variants/i.test(r));
const HAS_VARIANTS = RESOURCES.length !== RESOURCES_NO_VARIANTS.length;
// Latched off for the process once a variants request is proven to 400, so warm
// invocations don't keep paying the double round-trip.
let _variantsDisabled = false;

export function creatorsConfigured() {
  return !!(CLIENT_ID && CLIENT_SECRET);
}

// Non-secret view of the resolved config — for the diagnostic endpoint only.
// Never exposes the actual id/secret, just whether they're present plus the
// endpoints/params in effect, so a wrong env override is easy to spot.
export function creatorsDebugConfig() {
  return {
    hasClientId: !!CLIENT_ID,
    hasClientSecret: !!CLIENT_SECRET,
    partnerTag: PARTNER_TAG,
    marketplace: MARKETPLACE,
    tokenUrl: TOKEN_URL,
    scope: SCOPE,
    apiBase: API_BASE,
    resources: RESOURCES,
  };
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
    // LWA errors are JSON: {error, error_description, error_index}. Surface the
    // meaningful fields instead of a blob truncated mid-error_index.
    let detail = text.slice(0, 200);
    try {
      const j = JSON.parse(text);
      if (j.error) detail = `${j.error}${j.error_description ? ': ' + j.error_description : ''}`;
    } catch { /* keep raw */ }
    throw new Error(`token ${res.status}: ${detail}`);
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
  await logApiCalls('amazon');
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // 403 (account not yet eligible), 429 (1 TPS / daily-cap throttle), 5xx…
    throw new Error(`${operation} ${res.status}: ${text.slice(0, 180)}`);
  }
  return res.json();
}

// Map one Creators API item → the compact shape checkAmazon() already returns.
// Defensive on every path: the exact offersV2 nesting is loosely documented.
// Amazon's image CDN renders any size on demand via a filename token
// (._SL1500_. = longest side 1500px). The API's "large" variant is often only
// ~500px — too soft for the on-hover product zoom — so we rewrite the URL to
// request a higher-resolution rendition from the *same* Amazon host. Defensive:
// only touches recognised Amazon media URLs; anything else is returned as-is.
const HI_RES_PX = 1500;
function hiResImageUrl(url) {
  if (!url || !/(?:media-amazon|images-amazon|ssl-images-amazon)\.com/i.test(url)) return url;
  return url
    // Drop any existing size/format tokens, e.g. "._SX466_SY466_SCLZZZ_."
    .replace(/\._[A-Z0-9,_]+_\.(jpg|jpeg|png|gif)$/i, '.$1')
    // Then inject our target longest-side size.
    .replace(/\.(jpg|jpeg|png|gif)$/i, `._SL${HI_RES_PX}_.$1`);
}

function mapItem(item) {
  if (!item) return null;
  const asin = item.asin || item.ASIN || null;
  const title = item.itemInfo?.title?.displayValue ?? null;

  // Product gallery: the primary shot first, then any "variants" (alternate
  // angles / lifestyle images). The API only exposes a subset of the on-page
  // gallery (often 0–6), so this list can be just one long. Dedupe by URL.
  const pickUrl = (img) => hiResImageUrl(img?.large?.url || img?.medium?.url || img?.small?.url || null);
  const variants = Array.isArray(item.images?.variants) ? item.images.variants : [];
  const seen = new Set();
  const images = [];
  for (const url of [pickUrl(item.images?.primary), ...variants.map(pickUrl)]) {
    if (url && !seen.has(url)) { seen.add(url); images.push(url); }
  }
  const image = images[0] || null;

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

  return { asin, title, image, images, price, detailPageURL };
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

  const useVariants = HAS_VARIANTS && !_variantsDisabled;
  const body = {
    keywords: key,
    itemCount: 3,
    resources: useVariants ? RESOURCES : RESOURCES_NO_VARIANTS,
  };
  if (lo !== undefined) body.minPrice = lo;
  if (hi !== undefined) body.maxPrice = hi;

  let json;
  try {
    json = await catalog('searchItems', body);
  } catch (e) {
    // Safety net: if the extra gallery ("variants") resource is unknown on this
    // credential, Amazon 400s the whole call. Rather than break verification,
    // latch variants off for the process and retry once with the core resources.
    if (useVariants && /\b400\b/.test(String(e?.message))) {
      _variantsDisabled = true;
      json = await catalog('searchItems', { ...body, resources: RESOURCES_NO_VARIANTS });
    } else {
      throw e;
    }
  }
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
