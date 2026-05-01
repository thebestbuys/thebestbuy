import { PRODUCTS } from '../src/data.js';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function buildSystemPrompt(category, products) {
  const slim = products.map((p) => ({
    id: p.id, brand: p.brand, model: p.model, price: p.price, tags: p.tags,
  }));
  return `Tu es Bestbuys, un conseiller d'achat conversationnel en français.

OBJECTIF: identifier le meilleur produit pour l'utilisateur dans le catalogue ci-dessous, en posant 3 à 5 questions courtes maximum, puis en recommandant.

CATÉGORIE: ${category || 'inconnue'}
CATALOGUE (avec tags du vocabulaire à utiliser):
${JSON.stringify(slim, null, 2)}

RÈGLES:
- Réponds toujours en français.
- Une seule question à la fois, courte, 2 à 4 choix concrets.
- Chaque "choice" doit avoir des "tags" tirés du vocabulaire du catalogue ci-dessus (ex: "ios", "android", "camera", "perf", "pro", "balanced", "anc", "portable", "gaming", "office", "creative", "audio", "sport", "calls", "over", "in"). Si la question concerne le budget, mets les tags à [] et utilise "min"/"max" en euros sur les choix.
- Le champ "preferences" doit ACCUMULER tous les tags et contraintes de budget recueillis depuis le début de la conversation (pas seulement le dernier tour). Ne supprime pas les préférences précédentes.
- Après 3 à 5 réponses utiles, passe action="recommend", question=null. La sélection s'affiche automatiquement à droite.

FORMAT DE RÉPONSE: tu dois répondre UNIQUEMENT avec un objet JSON valide de cette forme exacte:
{
  "reply": "message à afficher dans le chat",
  "action": "ask" ou "recommend",
  "question": null OU {
    "id": "slug-court",
    "text": "texte de la question (peut répéter reply ou être plus précis)",
    "choices": [
      {"id": "slug", "label": "Libellé court", "tags": ["tag1"], "min": null, "max": null}
    ]
  },
  "preferences": {
    "tags": ["tag1", "tag2"],
    "budget_max": null,
    "budget_min": null
  }
}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return send(res, 500, { error: 'OPENAI_API_KEY not configured on server' });
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
  const products = (category && PRODUCTS[category]) || [];

  const systemMessage = { role: 'system', content: buildSystemPrompt(category, products) };

  let upstream;
  try {
    upstream = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [systemMessage, ...messages],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      }),
    });
  } catch (e) {
    return send(res, 502, { error: 'Network error reaching OpenAI', detail: String(e) });
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '');
    return send(res, upstream.status, { error: 'Upstream error', detail: text });
  }

  let json;
  try {
    json = await upstream.json();
  } catch {
    return send(res, 502, { error: 'Upstream returned non-JSON' });
  }

  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    return send(res, 502, { error: 'No content in OpenAI response' });
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return send(res, 502, { error: 'Model returned invalid JSON', raw: content });
  }

  return send(res, 200, parsed);
}
