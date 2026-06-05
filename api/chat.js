const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const AFFILIATE_TAG = 'bestbuys007-21';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function send(res, status, payload) {
  setCors(res);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function buildSystemPrompt(category) {
  return `Tu es Bestbuys, un conseiller d'achat conversationnel en français.

OBJECTIF: identifier les meilleurs produits réels pour l'utilisateur (catégorie: ${category || 'inconnue'}), via un dialogue en deux phases.

PHASE 1 — DÉCOUVERTE (5 questions):
- Pose EXACTEMENT 5 questions, en commençant OBLIGATOIREMENT par le budget (choix avec bornes "min"/"max" en euros).
- Après la 5e réponse: action="recommend", products=[5 produits], question=null.

PHASE 2 — RAFFINEMENT CONTINU (après le premier recommend):
- Pose 3 nouvelles questions de raffinement (action="ask") pour affiner davantage.
- Après 3 réponses: action="recommend" avec les 5 produits MIS À JOUR selon toutes les préférences accumulées.
- Répète indéfiniment: 3 questions → recommend mis à jour → 3 questions → recommend mis à jour → ...
- Si tu reçois le message "__refine__": c'est le signal de démarrage de la phase 2, pose immédiatement la première question de raffinement (action="ask").

RÈGLES GÉNÉRALES:
- Réponds toujours en français.
- Une seule question à la fois, courte, 2 à 4 choix concrets.
- Les choix peuvent avoir des "tags" (ex: "ios", "android", "camera", "perf") ou des bornes budget "min"/"max" en euros.
- Le champ "preferences" doit ACCUMULER tous les tags et contraintes (ne supprime jamais les précédentes).
- Chaque produit doit avoir un score de correspondance (0-99) basé sur les préférences.
- Propose uniquement des produits réellement vendus sur Amazon.fr.

FORMAT DE RÉPONSE: UNIQUEMENT un objet JSON valide de cette forme exacte:
{
  "reply": "message à afficher dans le chat",
  "action": "ask" | "recommend",
  "question": null | {
    "id": "slug-court",
    "text": "texte de la question",
    "choices": [
      {"id": "slug", "label": "Libellé court", "tags": ["tag1"], "min": null, "max": null}
    ]
  },
  "preferences": {
    "tags": ["tag1", "tag2"],
    "budget_max": null,
    "budget_min": null
  },
  "products": null | [
    {
      "id": "p1",
      "brand": "Marque",
      "model": "Modèle exact",
      "price": 999,
      "score": 94,
      "specs": ["Spec clé 1", "Spec clé 2", "Spec clé 3", "Spec clé 4"],
      "why": "Raison courte et convaincante de recommandation"
    }
  ]
}

IMPORTANT: "products" est null quand action="ask". Quand action="recommend", "products" contient exactement 5 produits.`;
}

function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

function ms(start) {
  return Math.round(performance.now() - start);
}

const AMAZON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9',
};

// Scrape multiple real products from an Amazon search page.
async function searchAmazonProducts(query, budgetMax, maxResults = 12) {
  let url = `https://www.amazon.fr/s?k=${encodeURIComponent(query)}&language=fr_FR`;
  if (budgetMax) url += `&rh=p_36%3A-${budgetMax * 100}`; // price filter in centimes
  try {
    const res = await fetch(url, { headers: AMAZON_HEADERS, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    if (html.includes('validateCaptcha') || html.includes('robot check')) return null;

    const products = [];
    let pos = 0;

    while (products.length < maxResults) {
      const idx = html.indexOf('data-component-type="s-search-result"', pos);
      if (idx === -1) break;

      const headerCtx = html.slice(Math.max(0, idx - 300), idx + 300);
      const asinMatch = headerCtx.match(/data-asin="([A-Z0-9]{10})"/);
      if (!asinMatch?.[1]) { pos = idx + 1; continue; }

      const asin = asinMatch[1];
      const chunk = html.slice(idx, idx + 15000);

      // Title — several patterns Amazon uses
      const titleMatch =
        chunk.match(/class="[^"]*a-text-normal[^"]*">\s*([^<]{10,200})<\/span>/) ||
        chunk.match(/class="[^"]*a-size-base-plus[^"]*">\s*([^<]{10,200})<\/span>/) ||
        chunk.match(/class="[^"]*a-size-medium[^"]*">\s*([^<]{10,200})<\/span>/);
      const title = titleMatch?.[1]?.trim();
      if (!title) { pos = idx + 1; continue; }

      // Image
      const imgMatch =
        chunk.match(/class="s-image"[^>]*src="(https:\/\/m\.media-amazon\.com[^"]+)"/) ||
        chunk.match(/class="s-image"[^>]*data-src="(https:\/\/m\.media-amazon\.com[^"]+)"/);

      // Price
      const priceMatch = chunk.match(/class="a-price-whole">\s*([\d\s ]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/[\s ]/g, '')) : null;

      // Rating
      const ratingMatch = chunk.match(/([\d]+[,.]\d+)\s+sur\s+5/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;

      products.push({
        asin,
        title,
        price,
        rating,
        image_url: imgMatch?.[1] ?? null,
        amazon_url: `https://www.amazon.fr/dp/${asin}?tag=${AFFILIATE_TAG}`,
      });

      pos = idx + 1;
    }

    return products.length >= 3 ? products : null;
  } catch {
    return null;
  }
}

async function callGemini(apiKey, body) {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res;
}

export default async function handler(req, res) {
  const t0 = performance.now();

  if (req.method === 'OPTIONS') {
    setCors(res);
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return send(res, 500, { error: 'GEMINI_API_KEY not configured on server' });
  }

  // 1. Parse body
  const t1 = performance.now();
  let body;
  try { body = await readBody(req); } catch {
    return send(res, 400, { error: 'Invalid JSON body' });
  }
  const t1_ms = ms(t1);

  const { messages = [], category } = body;
  if (!Array.isArray(messages)) return send(res, 400, { error: '"messages" must be an array' });

  const systemPrompt = buildSystemPrompt(category);

  // 2. Build prompt
  const t2 = performance.now();
  const geminiPayload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: toGeminiContents(messages),
    generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
  };
  const t2_ms = ms(t2);

  // 3. Call Gemini
  const t3 = performance.now();
  let upstream;
  try { upstream = await callGemini(apiKey, geminiPayload); } catch (e) {
    return send(res, 502, { error: 'Network error reaching Gemini', detail: String(e) });
  }
  const t3_ms = ms(t3);

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    let geminiError = {};
    try { geminiError = JSON.parse(text); } catch { /* raw */ }
    return send(res, upstream.status, {
      error: 'Upstream error', gemini_status: upstream.status,
      gemini_status_text: upstream.statusText, gemini_model: GEMINI_MODEL,
      gemini_error: geminiError, gemini_raw: text,
    });
  }

  // 4. Read + parse Gemini response
  const t4 = performance.now();
  let json;
  try { json = await upstream.json(); } catch {
    return send(res, 502, { error: 'Upstream returned non-JSON', gemini_model: GEMINI_MODEL });
  }
  const t4_ms = ms(t4);

  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    return send(res, 502, {
      error: 'No content in Gemini response', gemini_model: GEMINI_MODEL,
      finish_reason: json.candidates?.[0]?.finishReason,
      prompt_feedback: json.promptFeedback, full_response: json,
    });
  }

  // 5. Parse model JSON output
  const t5 = performance.now();
  let parsed;
  try { parsed = JSON.parse(content); } catch {
    return send(res, 502, { error: 'Model returned invalid JSON', gemini_model: GEMINI_MODEL, raw: content });
  }
  const t5_ms = ms(t5);

  const debugTokens = {
    input_tokens:  json.usageMetadata?.promptTokenCount ?? null,
    output_tokens: json.usageMetadata?.candidatesTokenCount ?? null,
  };

  let amazonSearchMs = 0;
  let rankingMs = 0;
  let usedAmazonSearch = false;

  // 6. If recommend: search Amazon first, then rank with Gemini
  if (parsed.action === 'recommend') {
    const prefs = parsed.preferences ?? {};
    const budgetMax = prefs.budget_max ?? null;

    // Build search query: use the user's first message as base (most natural)
    const firstUserMsg = messages.find((m) => m.role === 'user')?.text ?? category ?? '';
    const searchableTags = (prefs.tags ?? []).filter((t) =>
      !['low', 'mid', 'high', 'budget', 'cheap', 'expensive'].includes(t)
    ).slice(0, 2);
    const searchQuery = [firstUserMsg, ...searchableTags].filter(Boolean).join(' ');

    // Search Amazon for real products
    const t6 = performance.now();
    const amazonProducts = await searchAmazonProducts(searchQuery, budgetMax);
    amazonSearchMs = ms(t6);

    if (amazonProducts && amazonProducts.length >= 3) {
      // Ask Gemini to rank the real Amazon products
      const t7 = performance.now();
      const productList = amazonProducts
        .map((p, i) => `${i + 1}. "${p.title}" | Prix: ${p.price != null ? p.price + '€' : 'inconnu'} | Note: ${p.rating ?? '?'}/5`)
        .join('\n');

      const rankingContents = [
        ...toGeminiContents(messages),
        { role: 'model', parts: [{ text: content }] },
        {
          role: 'user',
          parts: [{
            text: `Voici ${amazonProducts.length} produits RÉELS trouvés sur Amazon.fr. Sélectionne et classe les 5 meilleurs selon les préférences de l'utilisateur. Pour chaque produit retenu, indique son numéro dans la liste (champ "idx", base 1), extrais la marque et le modèle du titre, génère 4 specs clés et une raison courte. Retourne UNIQUEMENT ce JSON:
{"ranked":[{"idx":3,"brand":"...","model":"...","score":94,"specs":["..."],"why":"..."},...]}\n\nProduits:\n${productList}`,
          }],
        },
      ];

      try {
        const rankUpstream = await callGemini(apiKey, {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: rankingContents,
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        });

        if (rankUpstream.ok) {
          const rankJson = await rankUpstream.json();
          const rankContent = rankJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rankContent) {
            try {
              const rankParsed = JSON.parse(rankContent);
              const ranked = rankParsed.ranked ?? rankParsed.products;
              if (Array.isArray(ranked) && ranked.length > 0) {
                parsed.products = ranked.slice(0, 5).map((r, i) => {
                  const ap = amazonProducts[(r.idx ?? i + 1) - 1] ?? amazonProducts[i];
                  return {
                    id: `p${i + 1}`,
                    brand:      r.brand ?? '',
                    model:      r.model ?? ap.title,
                    price:      ap.price ?? r.price ?? 0,
                    score:      r.score ?? 80,
                    specs:      r.specs ?? [],
                    why:        r.why ?? '',
                    amazon_url: ap.amazon_url,
                    image_url:  ap.image_url,
                    amazon_verified: true,
                  };
                });
                usedAmazonSearch = true;
              }
            } catch { /* fall through to fallback */ }
          }
        }
      } catch { /* fall through to fallback */ }

      rankingMs = ms(t7);
    }

    // Fallback: if Amazon search failed/blocked, keep Gemini's products as-is
    if (!usedAmazonSearch && Array.isArray(parsed.products)) {
      parsed.products = parsed.products.map((p) => ({
        ...p,
        amazon_url: `https://www.amazon.fr/s?k=${encodeURIComponent(`${p.brand} ${p.model}`)}&tag=${AFFILIATE_TAG}`,
        image_url: null,
        amazon_verified: false,
      }));
    }
  }

  const totalMs = ms(t0);

  parsed._debug = {
    model: GEMINI_MODEL,
    timings_ms: {
      parse_body:        t1_ms,
      build_prompt:      t2_ms,
      gemini_api_call:   t3_ms,
      read_response:     t4_ms,
      parse_json_output: t5_ms,
      amazon_search:     amazonSearchMs,
      ranking_call:      rankingMs,
      total:             totalMs,
    },
    used_amazon_search: usedAmazonSearch,
    ...debugTokens,
  };

  return send(res, 200, parsed);
}
