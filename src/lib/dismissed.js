// Locally-dismissed notification reminders (upcoming birthdays / holidays).
// These are derived, recurring items with no server row to delete, so when the
// user hides one we just remember its occurrence key in localStorage (scoped
// per user, like selections/profile). The key carries the occurrence year so a
// recurring event reappears next year instead of being hidden forever.
const ROOT_KEY = 'bb_notif_dismissed';

function keyFor(userId) {
  return userId ? `${ROOT_KEY}:${userId}` : `${ROOT_KEY}:_anon`;
}

export function getDismissed(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function dismissNotif(userId, key) {
  if (!key) return;
  const set = getDismissed(userId);
  set.add(key);
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify([...set]));
  } catch {}
}

// Un-hide everything — used by the "show hidden reminders" action when the user
// dismissed an occasion by mistake.
export function clearDismissed(userId) {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {}
}
