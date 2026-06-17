import { searchFirstItem, creatorsConfigured, PARTNER_TAG } from './_creators.js';

const AFFILIATE_TAG = PARTNER_TAG;

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
  res.end(JSON.stringify(payload));
}

async function searchAmazonFr(query) {
  if (!creatorsConfigured()) return null;
  try {
    const item = await searchFirstItem(query);
    if (!item || !item.asin) return null;
    return {
      amazon_url: `https://www.amazon.fr/dp/${item.asin}?tag=${AFFILIATE_TAG}`,
      image_url: item.image ?? null,
      // Amazon's API does not expose numeric star ratings / review counts.
      rating: null,
      reviews: null,
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed' });

  const q = req.query?.q;
  if (!q || typeof q !== 'string' || !q.trim()) {
    return send(res, 400, { error: 'Missing ?q= parameter' });
  }

  const result = await searchAmazonFr(q.trim());
  return send(res, 200, result ?? { amazon_url: null, image_url: null, rating: null, reviews: null });
}
