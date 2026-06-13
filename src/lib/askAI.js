// Empty in dev / web builds → relative path resolved by Vite middleware or Vercel.
// Set VITE_API_BASE_URL=https://your-app.vercel.app for the native APK build.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function askAI({ messages, category, lang = 'fr' }) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category,
      lang,
      messages: messages.map((m) => ({
        role: m.role === 'bot' || m.role === 'ai' ? 'assistant' : 'user',
        content: m.text,
      })),
    }),
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
