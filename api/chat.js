const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

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
- Après la 5e réponse: action="recommend", products=[10 produits], question=null.

PHASE 2 — RAFFINEMENT CONTINU (après le premier recommend):
- Pose 3 nouvelles questions de raffinement (action="ask") pour affiner davantage.
- Après 3 réponses: action="recommend" avec les 10 produits MIS À JOUR selon toutes les préférences accumulées.
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

IMPORTANT: "products" est null quand action="ask". Quand action="recommend", "products" contient exactement 10 produits.`;
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

// Check that the Amazon result title is related to what we searched for.
// Accepts if brand matches + ≥1 model word, OR brand absent but ≥2 model words match.
function isCoherent(geminiBrand, geminiModel, amazonTitle) {
  if (!amazonTitle) return false;
  const title = amazonTitle.toLowerCase();
  const brandMatch = title.includes(geminiBrand.toLowerCase());
  const modelWords = geminiModel.toLowerCase().split(/\s+/).filter(w => w.length >= 3).slice(0, 5);
  const matched = modelWords.filter(w => title.includes(w)).length;
  return (brandMatch && matched >= 1) || (!brandMatch && matched >= 2);
}

// Searches Amazon, returns first real result with full data — null = blocked.
async function checkAmazon(brand, model, searchContext) {
  const q = encodeURIComponent(`${searchContext ? searchContext + ' ' : ''}${brand} ${model}`);
  try {
    const res = await fetch(`https://www.amazon.fr/s?k=${q}&language=fr_FR`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { found: null };
    const html = await res.text();
    if (html.includes('validateCaptcha') || html.includes('robot check')) return { found: null };

    const resultIdx = html.indexOf('data-component-type="s-search-result"');
    if (resultIdx === -1) return { found: false };

    const ctx = html.slice(Math.max(0, resultIdx - 400), resultIdx + 400);
    const asinMatch = ctx.match(/data-asin="([A-Z0-9]{10})"/);
    if (!asinMatch?.[1]) return { found: false };

    const asin = asinMatch[1];
    const chunk = html.slice(resultIdx, resultIdx + 12000);

    // Image
    const imgMatch =
      chunk.match(/class="s-image"[^>]*src="(https:\/\/m\.media-amazon\.com[^"]+)"/) ||
      chunk.match(/class="s-image"[^>]*data-src="(https:\/\/m\.media-amazon\.com[^"]+)"/);

    // Title — first matching span class Amazon uses for product titles
    const titleRaw =
      chunk.match(/class="a-size-base-plus a-color-base a-text-normal">([^<]+)</)?.at(1)?.trim() ||
      chunk.match(/class="a-size-medium a-color-base a-text-normal">([^<]+)</)?.at(1)?.trim() ||
      null;

    // Split "ASUS Zenbook S 13 OLED..." → brand=ASUS, model=Zenbook S 13 OLED...
    const titleWords = titleRaw ? titleRaw.split(' ') : [];
    const amazonBrand = titleWords[0] || brand;
    const amazonModel = titleWords.slice(1).join(' ') || model;

    // Price: digits only, avoids NBSP
    const priceMatch = chunk.match(/class="a-price-whole">([^<]+)/);
    const price = priceMatch ? (parseInt(priceMatch[1].replace(/\D/g, ''), 10) || null) : null;

    // Rating: "4,5 sur 5"
    const ratingMatch = chunk.match(/(\d[,.]\d)\s+sur\s+5/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : null;

    // Reviews
    const reviewMatch = chunk.match(/aria-label="([\d][\d ]*)\s*évaluation/);
    const reviews = reviewMatch ? (parseInt(reviewMatch[1].replace(/\D/g, ''), 10) || null) : null;

    return {
      found: true,
      title: titleRaw,
      amazon_url: `https://www.amazon.fr/dp/${asin}?tag=bestbuys007-21`,
      image_url: imgMatch?.[1] ?? null,
      brand: amazonBrand,
      model: amazonModel,
      price,
      rating,
      reviews,
    };
  } catch {
    return { found: null };
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
  try {
    body = await readBody(req);
  } catch {
    return send(res, 400, { error: 'Invalid JSON body' });
  }
  const t1_ms = ms(t1);

  const { messages = [], category } = body;
  if (!Array.isArray(messages)) {
    return send(res, 400, { error: '"messages" must be an array' });
  }

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
  try {
    upstream = await callGemini(apiKey, geminiPayload);
  } catch (e) {
    return send(res, 502, { error: 'Network error reaching Gemini', detail: String(e) });
  }
  const t3_ms = ms(t3);

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    let geminiError = {};
    try { geminiError = JSON.parse(text); } catch { /* raw text */ }
    return send(res, upstream.status, {
      error: 'Upstream error',
      gemini_status: upstream.status,
      gemini_status_text: upstream.statusText,
      gemini_model: GEMINI_MODEL,
      gemini_error: geminiError,
      gemini_raw: text,
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
      error: 'No content in Gemini response',
      gemini_model: GEMINI_MODEL,
      finish_reason: json.candidates?.[0]?.finishReason,
      prompt_feedback: json.promptFeedback,
      full_response: json,
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
  let amazonVerifyMs = 0;
  let amazonBlocked = false;

  // 6. If recommend: verify sequentially (avoids Amazon bot detection from parallel requests)
  if (parsed.action === 'recommend' && Array.isArray(parsed.products) && parsed.products.length) {
    const t6 = performance.now();
    const triedNames = new Set();
    let verifiedProducts = [];
    // Use the user's original query text (e.g. "smartphone") instead of internal category ID ("phone")
    const searchContext = messages[0]?.content || category || '';

    const verifyCandidates = async (candidates) => {
      for (const p of candidates) {
        if (verifiedProducts.length >= 3) break;
        triedNames.add(`${p.brand} ${p.model}`);
        const check = await checkAmazon(p.brand, p.model, searchContext);
        if (check.found === null) { amazonBlocked = true; break; }
        if (check.found === true && isCoherent(p.brand, p.model, check.title)) {
          verifiedProducts.push({
            ...p,
            amazon_verified: true,
            // Replace Gemini's guessed data with real Amazon first-result data
            brand:      check.brand      || p.brand,
            model:      check.model      || p.model,
            amazon_url: check.amazon_url,
            image_url:  check.image_url  ?? null,
            price:      check.price      ?? p.price,
            rating:     check.rating     ?? null,
            reviews:    check.reviews    ?? null,
          });
        }
      }
    };

    await verifyCandidates(parsed.products);

    // If not blocked but < 3 found, ask Gemini for replacements
    if (!amazonBlocked && verifiedProducts.length < 3) {
      const triedList = [...triedNames].join(', ');
      try {
        const repUpstream = await callGemini(apiKey, {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [
            ...toGeminiContents(messages),
            { role: 'model', parts: [{ text: content }] },
            { role: 'user', parts: [{ text: `Ces produits sont introuvables sur Amazon.fr : ${triedList}. Propose 10 autres produits différents qui existent vraiment sur Amazon.fr pour la même recherche.` }] },
          ],
          generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
        });
        if (repUpstream.ok) {
          const repJson = await repUpstream.json();
          const repText = repJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (repText) {
            const repParsed = JSON.parse(repText);
            if (Array.isArray(repParsed.products)) {
              const fresh = repParsed.products.filter((p) => !triedNames.has(`${p.brand} ${p.model}`));
              await verifyCandidates(fresh);
            }
          }
        }
      } catch { /* keep what we have */ }
    }

    amazonVerifyMs = ms(t6);

    if (amazonBlocked) {
      parsed.products = parsed.products.map((p) => ({
        ...p, amazon_verified: null, amazon_url: null, image_url: null,
      }));
    } else {
      parsed.products = verifiedProducts.slice(0, 3);
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
      amazon_verify:     amazonVerifyMs,
      total:             totalMs,
    },
    amazon_blocked: amazonBlocked,
    ...debugTokens,
  };

  return send(res, 200, parsed);
}
