const AFFILIATE_TAG = 'bestbuys007-21';

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function searchAmazonFr(query) {
  const url = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}&language=fr_FR`;

  let res;
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8',
      },
      signal: AbortSignal.timeout(9000),
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const html = await res.text();

  // Detect CAPTCHA / bot block
  if (html.includes('validateCaptcha') || html.includes('automated access') || html.includes('robot check')) {
    return null;
  }

  // Find the first search result block
  const resultIdx = html.indexOf('data-component-type="s-search-result"');
  if (resultIdx === -1) return null;

  // ASIN is on the same div, search a window around the marker
  const ctx = html.slice(Math.max(0, resultIdx - 400), resultIdx + 400);
  const asinMatch = ctx.match(/data-asin="([A-Z0-9]{10})"/);
  if (!asinMatch?.[1]) return null;

  const asin = asinMatch[1];

  // Work inside the result block (up to 12 KB ahead)
  const chunk = html.slice(resultIdx, resultIdx + 12000);

  // Product image — Amazon encodes real src for top results, data-src for lazy ones
  const imgMatch =
    chunk.match(/class="s-image"[^>]*src="(https:\/\/m\.media-amazon\.com[^"]+)"/) ||
    chunk.match(/class="s-image"[^>]*data-src="(https:\/\/m\.media-amazon\.com[^"]+)"/);
  const imageUrl = imgMatch?.[1] ?? null;

  // Rating: "4,5 sur 5 étoiles" (French locale uses comma as decimal)
  const ratingMatch = chunk.match(/([\d]+[,.][\d]+)\s+sur\s+5/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;

  // Review count: aria-label="1 234 évaluations" or plain number before "évaluation"
  const reviewMatch =
    chunk.match(/aria-label="([\d\s ]+)\s*évaluation/) ||
    chunk.match(/([\d][\d\s ]*)\s+évaluation/);
  const rawReviews = reviewMatch?.[1]?.replace(/[\s ]/g, '') ?? null;
  const reviews = rawReviews && !isNaN(parseInt(rawReviews, 10)) ? parseInt(rawReviews, 10) : null;

  return {
    amazon_url: `https://www.amazon.fr/dp/${asin}?tag=${AFFILIATE_TAG}`,
    image_url: imageUrl,
    rating,
    reviews,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const q = req.query?.q;
  if (!q || typeof q !== 'string' || !q.trim()) {
    return send(res, 400, { error: 'Missing ?q= parameter' });
  }

  const result = await searchAmazonFr(q.trim());
  return send(res, 200, result ?? { amazon_url: null, image_url: null, rating: null, reviews: null });
}
