// Client-side mirror of the server's per-account AI usage. The source of truth
// is Supabase (see api/chat.js + the ai_usage table); this is UX only: showing
// how many requests are left today and an optimistic pre-gate. It is NOT a
// security limit — a user can clear localStorage. The server still enforces the
// real daily cap and returns 429 when it's reached.

const KEY = 'bb_ai_usage';

function utcDay() {
  return new Date().toISOString().slice(0, 10);
}

// Persist the server's echoed usage snapshot, tagged with the UTC day it belongs
// to. The server sends `_debug.usage = null` for anonymous calls → no-op then.
export function recordUsage(usage) {
  if (!usage || typeof usage !== 'object') return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...usage, day: utcDay() }));
  } catch {}
}

// Latest snapshot, but only if it's still today's (a new UTC day resets the
// displayed counters). null when missing / stale / unparseable.
export function getUsage() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u || u.day !== utcDay()) return null;
    return u;
  } catch {
    return null;
  }
}

// Requests left today per the mirrored snapshot (null when unknown).
export function requestsLeft() {
  const u = getUsage();
  if (!u || typeof u.requests !== 'number' || typeof u.request_cap !== 'number') return null;
  return Math.max(0, u.request_cap - u.requests);
}

// Optimistic pre-gate: true when the mirror says either cap is already reached,
// so the UI can short-circuit with the quota message instead of a round-trip.
// The server remains the authoritative gate.
export function isQuotaExhausted() {
  const u = getUsage();
  if (!u) return false;
  const reqOut = typeof u.requests === 'number' && typeof u.request_cap === 'number' && u.requests >= u.request_cap;
  const tokOut = typeof u.tokens === 'number' && typeof u.token_cap === 'number' && u.tokens >= u.token_cap;
  return reqOut || tokOut;
}
