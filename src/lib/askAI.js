// Empty in dev / web builds → relative path resolved by Vite middleware or Vercel.
// Set VITE_API_BASE_URL=https://your-app.vercel.app for the native APK build.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function askAI({ messages, category }) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category,
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
      detail = errBody.error || JSON.stringify(errBody);
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`AI request failed (${res.status}): ${detail}`);
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
    return { ...product, ...data };
  } catch {
    return product;
  }
}
