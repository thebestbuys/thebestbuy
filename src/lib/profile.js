// User profile ("Mon profil"). A short, free-form self-description the user can
// write so Oraklia's questions and recommendations match them better. Stored in
// localStorage, keyed per user (anonymous bucket for guests) — same pattern as
// selections.js / history.js. The compact text is injected into the AI prompts
// (see api/chat.js) so suggestions are tailored to the profile.
const ROOT_KEY = 'bb_profile';
const MAX_LEN = 600;

function keyFor(userId) {
  return userId ? `${ROOT_KEY}:${userId}` : `${ROOT_KEY}:_anon`;
}

const EMPTY = { bio: '' };

export function getProfile(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return { ...EMPTY };
    const obj = JSON.parse(raw);
    return { ...EMPTY, ...(obj && typeof obj === 'object' ? obj : {}) };
  } catch {
    return { ...EMPTY };
  }
}

export function saveProfile(userId, profile) {
  const clean = { bio: String(profile?.bio || '').slice(0, MAX_LEN).trim() };
  try {
    if (!clean.bio) localStorage.removeItem(keyFor(userId));
    else localStorage.setItem(keyFor(userId), JSON.stringify(clean));
  } catch {}
  return clean;
}

export function hasProfile(userId) {
  return !!getProfile(userId).bio;
}

// Compact one-line representation passed to the AI prompts (empty string when
// nothing is set, so callers can skip it cheaply).
export function profileToPrompt(profile) {
  const bio = String(profile?.bio || '').trim();
  return bio;
}
