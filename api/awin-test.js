// Diagnostic endpoint for the Awin (Rakuten FR) product feed — answers
// "does my AWIN_API_TOKEN work, how big is the feed, and what fields does it
// carry?" so we can design the ingestion for step 2 without guessing.
//
// It runs WHERE the token lives (Vercel), authenticates against the Enhanced
// Feed download endpoint, reads only the FIRST ~1.5 MB (then cancels the stream
// so a huge catalogue never times out), and returns: HTTP status, the wire size
// (Content-Length), and a parsed sample product with its key fields (gtin/EAN,
// price, availability, tracked link, image). Never returns the token.
//
// Usage (prod):  GET https://<your-app>.vercel.app/api/awin-test
// NOTE: the Vite dev server only wires /api/chat, so this works deployed (or
// under `vercel dev`), not under plain `npm run dev`.
//
// Optional gate: set AWIN_TEST_KEY to require ?key=<that value>. If unset the
// endpoint is open (it returns only a public product sample, never the token).

import { awinFeedConfig, awinFeedUrl } from './_awin.js';

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

const CAP_BYTES = 1_500_000; // read at most ~1.5 MB, then abort
const CAP_LINES = 200;

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const gate = process.env.AWIN_TEST_KEY || '';
  if (gate && req.query?.key !== gate) {
    return send(res, 401, { error: 'unauthorized', hint: 'append ?key=<AWIN_TEST_KEY>' });
  }

  const cfg = awinFeedConfig();
  const out = { config: cfg, feed: null, diagnosis: '' };

  if (!cfg.hasToken) {
    out.diagnosis =
      "❌ AWIN_API_TOKEN absent. Vercel → Settings → Environment Variables → ajoute AWIN_API_TOKEN (sans préfixe VITE_), puis redeploy.";
    return send(res, 200, out);
  }

  const url = awinFeedUrl();
  const t0 = Date.now();
  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.AWIN_API_TOKEN}` },
    });
    out.feed = {
      url,
      httpStatus: resp.status,
      ok: resp.ok,
      contentLength: resp.headers.get('content-length'),
      contentEncoding: resp.headers.get('content-encoding'),
      contentType: resp.headers.get('content-type'),
    };

    if (!resp.ok) {
      let body = '';
      try { body = (await resp.text()).slice(0, 400); } catch { /* ignore */ }
      out.feed.errorBody = body;
      out.diagnosis =
        resp.status === 401 || resp.status === 403
          ? "🔑 Token refusé (401/403). Vérifie AWIN_API_TOKEN (bon token OAuth2, non expiré) et que le compte a accès aux flux."
          : resp.status === 404
            ? "❓ 404 : flux introuvable — MID/vertical/locale à revoir (attendu 55615-retail-fr_FR). Es-tu bien joint au programme Rakuten FR ?"
            : `❓ HTTP ${resp.status} — voir feed.errorBody.`;
      return send(res, 200, out);
    }

    // Stream just enough to size the feed and grab a sample product.
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let bytes = 0;
    const lines = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      buf += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (line) lines.push(line);
      }
      if (bytes >= CAP_BYTES || lines.length >= CAP_LINES) break;
    }
    try { await reader.cancel(); } catch { /* ignore */ }

    const rawSample = lines[0] || (buf.trim() || null);
    let sample = null;
    if (rawSample) {
      try {
        const p = JSON.parse(rawSample);
        sample = {
          fields: Object.keys(p),
          gtin: p.gtin ?? null,
          mpn: p.mpn ?? null,
          brand: p.brand ?? null,
          title: typeof p.title === 'string' ? p.title.slice(0, 120) : p.title ?? null,
          price: p.price ?? null,
          sale_price: p.sale_price ?? null,
          availability: p.availability ?? null,
          link: typeof p.link === 'string' ? p.link.slice(0, 140) : null,
          hasImage: !!p.image_link,
        };
      } catch (e) {
        sample = { parseError: e.message, raw: rawSample.slice(0, 300) };
      }
    }

    out.feed.ms = Date.now() - t0;
    out.feed.sampledBytes = bytes;
    out.feed.sampledLines = lines.length;
    out.feed.sample = sample;
    out.diagnosis =
      sample && !sample.parseError
        ? "✅ Flux Rakuten accessible + JSONL valide. Regarde feed.contentLength (taille sur le fil) pour dimensionner l'ingestion, et sample.gtin / price / link pour le matching. Renvoie-moi ce bloc feed."
        : "⚠️ Flux téléchargé mais la 1re ligne ne parse pas en JSON — voir feed.sample.";
    return send(res, 200, out);
  } catch (e) {
    out.feed = { url, error: e?.message || String(e), ms: Date.now() - t0 };
    out.diagnosis = "🌐 Échec réseau/endpoint — voir feed.error.";
    return send(res, 200, out);
  }
}
