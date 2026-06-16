// Empty in dev / web builds → relative path resolved by Vite middleware or Vercel.
// Set VITE_API_BASE_URL=https://your-app.vercel.app for the native APK build.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function postChat(payload, token) {
  const headers = { 'Content-Type': 'application/json' };
  // For gifting to a friend, the bearer token lets the server resolve the
  // friend's private profile after verifying the friendship.
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
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

  return res.json();
}

// Legacy transcript-based API — still used by the mobile app.
// `gift` (when set) switches to gift mode; `surprise` asks for bolder ideas.
// `friendId` + `token`: gift for a friend whose profile is resolved server-side.
export function askAI({ messages, category, lang = 'fr', profile = '', gift = '', surprise = false, friendId = '', token = '' }) {
  return postChat({
    category,
    lang,
    profile,
    gift,
    surprise,
    friendId,
    messages: messages.map((m) => ({
      role: m.role === 'bot' || m.role === 'ai' ? 'assistant' : 'user',
      content: m.text,
    })),
  }, token);
}

// Ask for the next question, given the compact criteria gathered so far.
// `profile` is an optional free-form user self-description for personalization.
// `gift` (when set) switches to gift mode: a compact recipient description.
export function askQuestion({ objet, answers, lang = 'fr', profile = '', gift = '', surprise = false, friendId = '', token = '' }) {
  return postChat({ mode: 'ask', objet, answers, lang, profile, gift, surprise, friendId }, token);
}

// Ask for product recommendations from the accumulated criteria.
// `surprise` (gift mode) asks for bolder, more unexpected ideas.
export function recommend({ objet, answers, lang = 'fr', profile = '', gift = '', surprise = false, friendId = '', token = '' }) {
  return postChat({ mode: 'recommend', objet, answers, lang, profile, gift, surprise, friendId }, token);
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
