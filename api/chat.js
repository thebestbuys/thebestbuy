const GEMINI_MODEL = 'gemini-3-flash-preview';
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

OBJECTIF: identifier les meilleurs produits réels pour l'utilisateur (catégorie: ${category || 'inconnue'}), en posant 3 à 5 questions courtes maximum, puis recommander 5 produits réels disponibles sur Amazon.fr.

RÈGLES:
- Réponds toujours en français.
- PREMIÈRE QUESTION OBLIGATOIRE : pose TOUJOURS la question du budget en premier, avant toute autre question. Les choix doivent avoir des bornes "min" et/ou "max" en euros (ex: {"id":"low","label":"Moins de 300€","tags":[],"min":null,"max":300}).
- Une seule question à la fois, courte, 2 à 4 choix concrets.
- Les choix peuvent avoir des "tags" décrivant les préférences (ex: "ios", "android", "camera", "perf", "anc", "portable", "gaming") ou des bornes budget avec "min"/"max" en euros.
- Le champ "preferences" doit ACCUMULER tous les tags et contraintes de budget (ne supprime jamais les précédentes).
- Après 3 à 5 réponses utiles, passe action="recommend" et retourne 5 produits classés du plus au moins adapté.
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

export default async function handler(req, res) {
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

  let body;
  try {
    body = await readBody(req);
  } catch {
    return send(res, 400, { error: 'Invalid JSON body' });
  }

  const { messages = [], category } = body;
  if (!Array.isArray(messages)) {
    return send(res, 400, { error: '"messages" must be an array' });
  }

  const geminiBody = JSON.stringify({
    systemInstruction: { parts: [{ text: buildSystemPrompt(category) }] },
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature: 0.5,
      responseMimeType: 'application/json',
    },
  });

  let upstream;
  try {
    upstream = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: geminiBody,
    });
  } catch (e) {
    return send(res, 502, { error: 'Network error reaching Gemini', detail: String(e) });
  }

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

  let json;
  try {
    json = await upstream.json();
  } catch {
    return send(res, 502, { error: 'Upstream returned non-JSON', gemini_model: GEMINI_MODEL });
  }

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

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return send(res, 502, { error: 'Model returned invalid JSON', gemini_model: GEMINI_MODEL, raw: content });
  }

  return send(res, 200, parsed);
}
