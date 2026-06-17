// Diagnostic endpoint for the Amazon Creators API — answers "why are products
// shown as estimates instead of verified, with a direct product link?".
//
// It runs WHERE the credentials live (Vercel prod), does a real token exchange
// + searchItems, and returns a structured verdict: token OK? search OK? ASIN +
// detailPageURL resolved? — or the exact failure (403 not eligible, 429 quota,
// bad endpoint…). Never returns secret values, only booleans/lengths.
//
// Usage (prod):  GET https://<your-app>.vercel.app/api/creators-test?q=iphone%2015%20pro%20max
// NOTE: the Vite dev server only wires /api/chat, so this works deployed (or
// under `vercel dev`), not under plain `npm run dev`.
//
// Optional gate: set CREATORS_TEST_KEY in the env to require ?key=<that value>.
// If unset, the endpoint is open (it leaks no secrets, only a public sample).

import { creatorsConfigured, creatorsDebugConfig, searchItems } from './_creators.js';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function send(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload, null, 2));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  // Optional shared-secret gate (only enforced if CREATORS_TEST_KEY is set).
  const gate = process.env.CREATORS_TEST_KEY || '';
  if (gate && req.query?.key !== gate) {
    return send(res, 401, { error: 'unauthorized', hint: 'append ?key=<CREATORS_TEST_KEY>' });
  }

  const out = {
    configured: creatorsConfigured(),
    config: creatorsDebugConfig(),
    token: null,
    search: null,
    diagnosis: '',
  };

  if (!out.configured) {
    out.diagnosis =
      "❌ Identifiants absents (AMAZON_CREATORS_CLIENT_ID / _SECRET). En prod : Vercel → Settings → Environment Variables, puis redeploy. C'est ce qui force l'affichage en estimation.";
    return send(res, 200, out);
  }

  const q =
    (typeof req.query?.q === 'string' && req.query.q.trim()) || 'iphone 15 pro max';
  const t0 = Date.now();
  try {
    const items = await searchItems(q, {});
    const first = items[0] || null;
    out.token = { ok: true };
    out.search = {
      ok: true,
      ms: Date.now() - t0,
      query: q,
      count: items.length,
      sample: first
        ? {
            asin: first.asin,
            title: first.title,
            price: first.price,
            hasImage: !!first.image,
            detailPageURL: first.detailPageURL,
            directLinkOk:
              typeof first.detailPageURL === 'string' && first.detailPageURL.includes('/dp/'),
          }
        : null,
    };
    out.diagnosis = first
      ? "✅ API Creators opérationnelle — ASIN et lien direct (detailPageURL) résolus. Les produits passeront en 'verified' avec le lien direct + le vrai prix/image."
      : "⚠️ Token OK mais la recherche ne renvoie aucun article — essaie un autre ?q=. Si ça persiste, l'API_BASE ou les 'resources' sont peut-être à revoir.";
  } catch (e) {
    const msg = e?.message || String(e);
    const isToken = /^token /i.test(msg);
    out.token = { ok: !isToken, error: isToken ? msg : null };
    out.search = { ok: false, ms: Date.now() - t0, query: q, error: msg };

    // Translate the status embedded in the thrown message into a clear cause.
    let diag = '❓ Erreur API non catégorisée — voir search.error.';
    if (isToken || /\b401\b/.test(msg)) {
      if (/invalid_scope/i.test(msg)) {
        diag = '🔑 invalid_scope : la valeur AMAZON_CREATORS_SCOPE ne correspond pas à ce que le profil autorise.';
      } else if (/invalid_client|unauthorized_client/i.test(msg)) {
        diag = '🔑 invalid_client : CLIENT_ID/SECRET erronés, ou mauvaise région de token endpoint pour ce profil.';
      } else {
        diag = '🔑 Échec du token OAuth : vérifie la région de AMAZON_CREATORS_TOKEN_URL (EU=api.amazon.co.uk, NA=api.amazon.com) et le scope.';
      }
    } else if (/\b403\b/.test(msg)) {
      diag =
        "⛔ HTTP 403 : le compte n'est pas (encore) éligible à la Creators API, ou le partnerTag n'est pas rattaché à ces identifiants.";
    } else if (/\b429\b/.test(msg)) {
      diag = '⏳ HTTP 429 : quota dépassé (démarre à 1 TPS / 8 640 req/jour). Réessaie plus tard.';
    } else if (/\b400\b/.test(msg)) {
      diag =
        '🧩 HTTP 400 : payload ou ressources rejetés — une valeur de AMAZON_CREATORS_RESOURCES est probablement invalide.';
    } else if (/ENOTFOUND|fetch failed|ECONN|getaddrinfo|EAI_AGAIN|timeout|aborted/i.test(msg)) {
      diag =
        '🌐 Endpoint injoignable : AMAZON_CREATORS_API_BASE est probablement faux (défaut: https://creatorsapi.amazon/catalog/v1).';
    }
    out.diagnosis = diag;
  }

  return send(res, 200, out);
}
