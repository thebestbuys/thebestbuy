// Manual occasions (reminders): birthdays of hand-entered people, anniversaries,
// etc. localStorage-backed, keyed per user, mirrored to Supabase. Friends' own
// birthdays come from list_friends (profile.birthday), not from here.
import { cloudUpsertOccasion, cloudDeleteOccasion } from './cloud.js';

const ROOT_KEY = 'bb_occasions';
const REV_KEY = 'bb_occasions_rev';

function keyFor(userId) {
  return userId ? `${ROOT_KEY}:${userId}` : `${ROOT_KEY}:_anon`;
}
function revKeyFor(userId) {
  return userId ? `${REV_KEY}:${userId}` : `${REV_KEY}:_anon`;
}

export function getOccasionsRevision(userId) {
  try {
    return Number(localStorage.getItem(revKeyFor(userId))) || 0;
  } catch {
    return 0;
  }
}
function bump(userId) {
  try {
    localStorage.setItem(revKeyFor(userId), String(getOccasionsRevision(userId) + 1));
  } catch {}
}

export function listOccasions(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(userId, arr) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(arr));
    bump(userId);
  } catch {}
}

export function addOccasion(userId, { label, date, recurring = true }) {
  const item = {
    id: `o_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    label: String(label || '').slice(0, 80).trim() || 'Occasion',
    date: String(date || '').trim(),
    recurring: recurring !== false,
  };
  if (!item.date) return null;
  const arr = listOccasions(userId);
  arr.push(item);
  write(userId, arr);
  cloudUpsertOccasion(item).catch(() => {});
  return item;
}

export function removeOccasion(userId, id) {
  write(userId, listOccasions(userId).filter((o) => o.id !== id));
  cloudDeleteOccasion(id).catch(() => {});
}

export function replaceOccasions(userId, rows) {
  write(userId, Array.isArray(rows) ? rows : []);
}

// Days until the next occurrence of a 'MM-DD' or 'YYYY-MM-DD' date.
// Recurring → next yearly occurrence; non-recurring → that exact date (may be
// in the past → returns a negative-ish large number so it sorts out).
export function daysUntil(dateStr, recurring = true, now = new Date()) {
  const m = String(dateStr || '').match(/(?:(\d{4})-)?(\d{2})-(\d{2})/);
  if (!m) return null;
  const [, , mm, dd] = m;
  const month = Number(mm) - 1;
  const day = Number(dd);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (recurring) {
    let next = new Date(today.getFullYear(), month, day);
    if (next < today) next = new Date(today.getFullYear() + 1, month, day);
    return Math.round((next - today) / 86400000);
  }
  const year = m[1] ? Number(m[1]) : now.getFullYear();
  const d = new Date(year, month, day);
  return Math.round((d - today) / 86400000);
}

// Reminder visibility window: surface an occasion up to 2 weeks BEFORE it
// happens and keep it for 2 days AFTER it has passed, then hide it.
export const REMIND_AHEAD = 14;
export const REMIND_PAST = 2;

// Signed days to the CLOSEST occurrence of a 'MM-DD' / 'YYYY-MM-DD' date:
// >= 0 when it's upcoming (or today), < 0 when it just passed. For recurring
// dates this picks whichever yearly occurrence (last / this / next year) is
// nearest, so a birthday that was 1 day ago reads -1 rather than +364.
export function daysToOccurrence(dateStr, recurring = true, now = new Date()) {
  const m = String(dateStr || '').match(/(?:(\d{4})-)?(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = (d) => Math.round((d - today) / 86400000);
  if (!recurring) {
    const year = m[1] ? Number(m[1]) : now.getFullYear();
    return diff(new Date(year, month, day));
  }
  return [
    diff(new Date(today.getFullYear() - 1, month, day)),
    diff(new Date(today.getFullYear(), month, day)),
    diff(new Date(today.getFullYear() + 1, month, day)),
  ].sort((a, b) => Math.abs(a) - Math.abs(b))[0];
}

// True when a signed day-offset (from daysToOccurrence) is inside the window.
export function withinReminderWindow(days) {
  return days != null && days >= -REMIND_PAST && days <= REMIND_AHEAD;
}

// Turn a person's age (years) for a recurring birthday on the next occurrence,
// when a full YYYY-MM-DD is known. Null otherwise.
export function turningAge(dateStr, now = new Date()) {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const birthYear = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  let year = now.getFullYear();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (new Date(year, month, day) < today) year += 1;
  return year - birthYear;
}
