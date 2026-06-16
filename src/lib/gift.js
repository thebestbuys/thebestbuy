// Gift mode: describe a recipient (relationship, age, interests…) + an occasion
// + a budget, and Oraklia suggests gift ideas. The recipient is serialized into
// a compact string fed to the AI prompts (see api/chat.js); the whole results
// pipeline (Amazon verification, product cards, refinement) is reused unchanged.

export const GIFT_EMPTY = {
  relationship: '',
  gender: '',
  age: '',
  interests: '',
  occasion: '',
  budgetMin: '',
  budgetMax: '',
};

const PROMPT_LABELS = {
  relationship: { fr: 'Relation', en: 'Relationship' },
  gender: { fr: 'Genre', en: 'Gender' },
  age: { fr: 'Âge', en: 'Age' },
  interests: { fr: "Centres d'intérêt", en: 'Interests' },
  occasion: { fr: 'Occasion', en: 'Occasion' },
};

function budgetLine(gift, lang) {
  const min = String(gift.budgetMin ?? '').trim();
  const max = String(gift.budgetMax ?? '').trim();
  const label = lang === 'en' ? 'Budget' : 'Budget';
  if (min && max) return `${label}: ${min}–${max} €`;
  if (max) return `${label}: ${lang === 'en' ? 'up to' : "jusqu'à"} ${max} €`;
  if (min) return `${label}: ${lang === 'en' ? 'from' : 'à partir de'} ${min} €`;
  return '';
}

// Compact one-line description passed to the AI prompts. Empty string when the
// recipient is blank.
export function giftToPrompt(gift, lang = 'fr') {
  if (!gift) return '';
  const parts = [];
  for (const k of Object.keys(PROMPT_LABELS)) {
    const v = String(gift[k] ?? '').trim();
    if (!v) continue;
    const label = PROMPT_LABELS[k][lang] || PROMPT_LABELS[k].fr;
    parts.push(`${label}: ${v}`);
  }
  const b = budgetLine(gift, lang);
  if (b) parts.push(b);
  return parts.join('; ');
}

// Short human title for history entries, e.g. "Cadeau · une sœur · anniversaire".
export function giftTitle(gift, lang = 'fr') {
  if (!gift) return lang === 'en' ? 'Gift' : 'Cadeau';
  const head = lang === 'en' ? 'Gift' : 'Cadeau';
  const who = gift.friendName || gift.relationship;
  const bits = [who, gift.occasion].map((s) => String(s || '').trim()).filter(Boolean);
  return [head, ...bits].join(' · ');
}

// ── Shareable gift lists ───────────────────────────────────────────────────
// Encode a small gift list (recipient context + a few products) into a URL-safe
// base64 string carried in ?share=… . No backend needed — the link is fully
// self-contained. Kept compact (short keys) since it lives in the URL.
export function encodeGiftShare(payload) {
  try {
    const json = JSON.stringify(payload);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

export function decodeGiftShare(str) {
  try {
    const b64 = String(str).replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    const obj = JSON.parse(json);
    if (!obj || !Array.isArray(obj.items)) return null;
    return obj;
  } catch {
    return null;
  }
}
