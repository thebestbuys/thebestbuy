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

OBJECTIF: identifier les meilleurs produits réels pour l'utilisateur (catégorie: ${category || 'inconnue'}), en posant exactement 5 questions, puis recommander 5 produits réels disponibles sur Amazon.fr.

RÈGLES:
- Réponds toujours en français.
- PREMIÈRE QUESTION OBLIGATOIRE : pose TOUJOURS la question du budget en premier, avant toute autre question. Les choix doivent avoir des bornes "min" et/ou "max" en euros (ex: {"id":"low","label":"Moins de 300€","tags":[],"min":null,"max":300}).
- Une seule question à la fois, courte, 2 à 4 choix concrets.
- Les choix peuvent avoir des "tags" décrivant les préférences (ex: "ios", "android", "camera", "perf", "anc", "portable", "gaming") ou des bornes budget avec "min"/"max" en euros.
- Le champ "preferences" doit ACCUMULER tous les tags et contraintes de budget (ne supprime jamais les précédentes).
- Après exactement 5 questions et réponses, passe action="recommend" et retourne 5 produits classés du plus au moins adapté.
- Chaque produit doit avoir un score de correspondance (0-99) basé sur les préférences collectées.
- Propose uniquement des produits réellement vendus sur Amazon.fr. Ne propose jamais un produit introuvable sur Amazon.fr.

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

// Returns true if at least one search result was found, false if blocked/not found.
async function checkAmazon(brand, model) {
  const q = encodeURIComponent(`${brand} ${model}`);
  try {
    const res = await fetch(`https://www.amazon.fr/s?k=${q}&language=fr_FR`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null; // null = inconclusive (blocked)
    const html = await res.text();
    if (html.includes('validateCaptcha') || html.includes('robot check')) return null;
    return html.includes('data-component-type="s-search-result"');
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
  let replacementMs = 0;
  let amazonBlocked = false;
  let replacedCount = 0;

  // 6. If recommend: verify each product exists on Amazon, replace those not found
  if (parsed.action === 'recommend' && Array.isArray(parsed.products) && parsed.products.length) {
    const t6 = performance.now();

    const checks = await Promise.all(parsed.products.map((p) => checkAmazon(p.brand, p.model)));
    amazonVerifyMs = ms(t6);

    // null = Amazon blocked us → skip replacement to avoid false negatives
    const allInconclusive = checks.every((c) => c === null);

    if (!allInconclusive) {
      const notFound = parsed.products.filter((_, i) => checks[i] === false);

      if (notFound.length > 0) {
        const t7 = performance.now();
        const rejectedList = notFound.map((p) => `${p.brand} ${p.model}`).join(', ');
        const replacementMessages = [
          ...toGeminiContents(messages),
          {
            role: 'model',
            parts: [{ text: content }],
          },
          {
            role: 'user',
            parts: [{ text: `Ces produits sont introuvables sur Amazon.fr : ${rejectedList}. Remplace-les par d'autres produits similaires qui existent réellement sur Amazon.fr. Retourne la liste complète des 5 produits (conserve ceux qui étaient valides).` }],
          },
        ];

        try {
          const replacementUpstream = await callGemini(apiKey, {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: replacementMessages,
            generationConfig: { temperature: 0.5, responseMimeType: 'application/json' },
          });

          if (replacementUpstream.ok) {
            const repJson = await replacementUpstream.json();
            const repContent = repJson.candidates?.[0]?.content?.parts?.[0]?.text;
            if (repContent) {
              try {
                const repParsed = JSON.parse(repContent);
                if (Array.isArray(repParsed.products)) {
                  parsed.products = repParsed.products;
                  replacedCount = notFound.length;
                }
              } catch { /* keep original */ }
            }
          }
        } catch { /* keep original */ }

        replacementMs = ms(t7);
      }
    } else {
      amazonBlocked = true;
    }

    // Tag each product with its verification result
    parsed.products = parsed.products.map((p, i) => ({
      ...p,
      amazon_verified: checks[i] === true ? true : checks[i] === false ? false : null,
    }));
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
      replacement_call:  replacementMs,
      total:             totalMs,
    },
    amazon_blocked:  amazonBlocked,
    replaced_count:  replacedCount,
    ...debugTokens,
  };

  return send(res, 200, parsed);
}
