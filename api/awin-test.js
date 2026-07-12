// Diagnostic endpoint for the Awin (Rakuten FR) product data — answers "which
// feed mechanism works for us, how big is it, and what fields does it carry?"
// so we can design the ingestion for step 2 without guessing.
//
// It tries, in order of what's configured (env vars, all server-side secrets):
//   1. AWIN_RAKUTEN_FEED_URL  — a Create-a-Feed download URL you generated in
//      the Awin UI (host productdata.awin.com, apikey embedded). Best route.
//   2. AWIN_DATAFEED_APIKEY   — your classic datafeed API key: we hit the LIST
//      endpoint and surface every feed you can access (so we find Rakuten's).
//   3. AWIN_API_TOKEN         — the OAuth2 "enhanced feed" (JSONL) attempt. Note:
//      not all advertisers (incl. Rakuten FR) expose this — it may 404.
//
// Reads only the first ~1.5 MB then cancels the stream, so a huge catalogue can
// never time out. Never returns any secret — only public feed metadata + a
// sample row.
//
// Usage (prod):  GET https://<your-app>.vercel.app/api/awin-test
// Optional gate: set AWIN_TEST_KEY to require ?key=<that value>.

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

const CAP_BYTES = 1_500_000;
const CAP_LINES = 200;

// Read at most CAP_BYTES / CAP_LINES from a response body, then abort.
async function readCapped(resp) {
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let bytes = 0;
  const lines = [];
  while (lines.length < CAP_LINES && bytes < CAP_BYTES) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).replace(/\r$/, '');
      buf = buf.slice(nl + 1);
      if (line.trim()) lines.push(line);
      if (lines.length >= CAP_LINES) break;
    }
  }
  try { await reader.cancel(); } catch { /* ignore */ }
  if (buf.trim() && lines.length < CAP_LINES) lines.push(buf.trim());
  return { bytes, lines };
}

function feedMeta(resp, url) {
  return {
    url,
    httpStatus: resp.status,
    ok: resp.ok,
    contentLength: resp.headers.get('content-length'),
    contentEncoding: resp.headers.get('content-encoding'),
    contentType: resp.headers.get('content-type'),
  };
}

// Parse a sample product row (JSONL line, or CSV header + first data row).
function sampleFrom(lines) {
  if (!lines.length) return null;
  const first = lines[0];
  if (first.startsWith('{')) {
    try {
      const p = JSON.parse(first);
      return {
        format: 'jsonl',
        fields: Object.keys(p),
        gtin: p.gtin ?? null,
        price: p.price ?? null,
        availability: p.availability ?? null,
        link: typeof p.link === 'string' ? p.link.slice(0, 140) : null,
        hasImage: !!p.image_link,
      };
    } catch (e) {
      return { format: 'jsonl?', parseError: e.message, raw: first.slice(0, 300) };
    }
  }
  // Assume CSV/TSV: first line is the header.
  const delim = first.includes('\t') ? '\t' : first.split(',').length >= first.split(';').length ? ',' : ';';
  return {
    format: 'csv',
    delimiter: delim === '\t' ? 'tab' : delim,
    header: first.split(delim).slice(0, 60),
    firstRow: (lines[1] || '').split(delim).slice(0, 60),
  };
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') { setCors(res); res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const gate = process.env.AWIN_TEST_KEY || '';
  if (gate && req.query?.key !== gate) {
    return send(res, 401, { error: 'unauthorized', hint: 'append ?key=<AWIN_TEST_KEY>' });
  }

  const cfg = awinFeedConfig();
  const feedUrlEnv = process.env.AWIN_RAKUTEN_FEED_URL || '';
  const datafeedKey = process.env.AWIN_DATAFEED_APIKEY || '';
  const out = {
    config: {
      ...cfg,
      hasFeedUrl: Boolean(feedUrlEnv),
      hasDatafeedKey: Boolean(datafeedKey),
    },
    source: null,
    feed: null,
    diagnosis: '',
  };

  const t0 = Date.now();
  try {
    // 1) Explicit Create-a-Feed download URL (best route).
    if (feedUrlEnv) {
      out.source = 'create-a-feed (AWIN_RAKUTEN_FEED_URL)';
      const resp = await fetch(feedUrlEnv);
      out.feed = feedMeta(resp, feedUrlEnv.replace(/apikey\/[^/]+/i, 'apikey/***'));
      if (!resp.ok) {
        out.feed.errorBody = (await resp.text().catch(() => '')).slice(0, 400);
        out.diagnosis = `❓ HTTP ${resp.status} sur l'URL Create-a-Feed — vérifie l'URL / la clé.`;
        return send(res, 200, out);
      }
      const { bytes, lines } = await readCapped(resp);
      out.feed.ms = Date.now() - t0;
      out.feed.sampledBytes = bytes;
      out.feed.sampledLines = lines.length;
      out.feed.sample = sampleFrom(lines);
      out.diagnosis = "✅ Flux Create-a-Feed accessible. Renvoie-moi le bloc feed (contentLength + sample.header/fields) → je monte l'ingestion.";
      return send(res, 200, out);
    }

    // 2) Datafeed list (discover Rakuten's feed id + download URL).
    if (datafeedKey) {
      out.source = 'datafeed list (AWIN_DATAFEED_APIKEY)';
      const listUrl = `https://productdata.awin.com/datafeed/list/apikey/${datafeedKey}/`;
      const resp = await fetch(listUrl);
      out.feed = feedMeta(resp, 'https://productdata.awin.com/datafeed/list/apikey/***/');
      if (!resp.ok) {
        out.feed.errorBody = (await resp.text().catch(() => '')).slice(0, 400);
        out.diagnosis = `❓ HTTP ${resp.status} sur la liste des flux — la clé datafeed est-elle correcte ?`;
        return send(res, 200, out);
      }
      const { bytes, lines } = await readCapped(resp);
      out.feed.ms = Date.now() - t0;
      out.feed.sampledBytes = bytes;
      out.feed.totalFeeds = Math.max(0, lines.length - 1); // minus header
      out.feed.header = (lines[0] || '').split(',').slice(0, 40);
      // Surface the rows that look like Rakuten (mid 55615 or name match).
      out.feed.rakutenRows = lines
        .filter((l) => l.includes('55615') || /rakuten/i.test(l))
        .slice(0, 5);
      out.diagnosis = out.feed.rakutenRows.length
        ? "✅ Rakuten trouvé dans tes flux — renvoie-moi feed.header + feed.rakutenRows, j'en extrais l'URL de download exacte."
        : "⚠️ Liste des flux OK mais aucune ligne Rakuten (55615). Colle-moi feed.header + les 1res lignes pour que je repère le bon flux.";
      return send(res, 200, out);
    }

    // 3) Fallback: the OAuth enhanced-feed attempt (often 404 for Rakuten).
    out.source = 'enhanced feed (AWIN_API_TOKEN)';
    if (!cfg.hasToken) {
      out.diagnosis = "❌ Rien de configuré. Route recommandée : génère un flux Rakuten dans Toolbox → Create-a-Feed, puis mets son URL de download dans AWIN_RAKUTEN_FEED_URL (Vercel). Ou mets ta clé datafeed dans AWIN_DATAFEED_APIKEY.";
      return send(res, 200, out);
    }
    const url = awinFeedUrl();
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${process.env.AWIN_API_TOKEN}` } });
    out.feed = feedMeta(resp, url);
    if (!resp.ok) {
      out.feed.errorBody = (await resp.text().catch(() => '')).slice(0, 400);
      out.diagnosis = "❓ L'API enhanced feed ne sert pas Rakuten (404). Bascule sur Create-a-Feed : génère le flux dans le Toolbox et mets son URL dans AWIN_RAKUTEN_FEED_URL, ou ta clé datafeed dans AWIN_DATAFEED_APIKEY.";
      return send(res, 200, out);
    }
    const { bytes, lines } = await readCapped(resp);
    out.feed.ms = Date.now() - t0;
    out.feed.sampledBytes = bytes;
    out.feed.sampledLines = lines.length;
    out.feed.sample = sampleFrom(lines);
    out.diagnosis = "✅ Enhanced feed OK (surprise !) — renvoie-moi le bloc feed.";
    return send(res, 200, out);
  } catch (e) {
    out.feed = { error: e?.message || String(e), ms: Date.now() - t0 };
    out.diagnosis = "🌐 Échec réseau/endpoint — voir feed.error.";
    return send(res, 200, out);
  }
}
