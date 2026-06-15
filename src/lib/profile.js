// User profile ("Mon profil"). A set of optional fields plus a free-form
// self-description the user can fill so Oraklia's questions and recommendations
// match them better. Stored in localStorage, keyed per user (anonymous bucket
// for guests) — same pattern as selections.js / history.js. A compact text
// representation is injected into the AI prompts (see api/chat.js).
const ROOT_KEY = 'bb_profile';

// Field name → max length, used both as the schema and for sanitizing on save.
// `bio` is the long free-text field; the rest are short structured inputs.
const FIELD_MAX = {
  gender: 40,
  age: 4,
  profession: 80,
  nationality: 60,
  address: 160,
  bio: 600,
};

const FIELDS = Object.keys(FIELD_MAX);

// Order + French/English labels used when building the prompt string.
const PROMPT_LABELS = {
  gender: { fr: 'Genre', en: 'Gender' },
  age: { fr: 'Âge', en: 'Age' },
  profession: { fr: 'Profession', en: 'Profession' },
  nationality: { fr: 'Nationalité', en: 'Nationality' },
  address: { fr: 'Adresse', en: 'Address' },
  bio: { fr: 'À propos', en: 'About' },
};

const EMPTY = FIELDS.reduce((o, k) => ((o[k] = ''), o), {});

function keyFor(userId) {
  return userId ? `${ROOT_KEY}:${userId}` : `${ROOT_KEY}:_anon`;
}

export function getProfile(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return { ...EMPTY };
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') return { ...EMPTY };
    // Migrate old shape (bio-only) and ignore unknown keys.
    return { ...EMPTY, ...Object.fromEntries(FIELDS.map((k) => [k, String(obj[k] ?? '')])) };
  } catch {
    return { ...EMPTY };
  }
}

export function saveProfile(userId, profile) {
  const clean = {};
  let anyValue = false;
  for (const k of FIELDS) {
    const v = String(profile?.[k] ?? '').slice(0, FIELD_MAX[k]).trim();
    clean[k] = v;
    if (v) anyValue = true;
  }
  try {
    if (!anyValue) localStorage.removeItem(keyFor(userId));
    else localStorage.setItem(keyFor(userId), JSON.stringify(clean));
  } catch {}
  return clean;
}

export function hasProfile(userId) {
  const p = getProfile(userId);
  return FIELDS.some((k) => p[k]);
}

// Compact representation passed to the AI prompts (empty string when nothing is
// set, so callers can skip it cheaply). e.g.
//   "Genre: Femme; Âge: 34; Profession: ...; À propos: ..."
export function profileToPrompt(profile, lang = 'fr') {
  if (!profile) return '';
  const parts = [];
  for (const k of FIELDS) {
    const v = String(profile[k] ?? '').trim();
    if (!v) continue;
    const label = PROMPT_LABELS[k][lang] || PROMPT_LABELS[k].fr;
    parts.push(`${label}: ${v}`);
  }
  return parts.join('; ');
}
