// Saved gift recipients ("Mes proches"). Twin of selections.js: localStorage-
// backed, keyed per user (anonymous bucket for guests), mirrored best-effort to
// the cloud (Supabase) on every mutation; cloudSync pulls the server state back
// on login / app open. A recipient stores the durable parts of a person
// (relationship, gender, age, interests) under a name — the occasion and budget
// are per gift search and are NOT saved here.
import {
  cloudClearRecipients,
  cloudDeleteRecipient,
  cloudUpsertRecipient,
} from './cloud.js';

const ROOT_KEY = 'bb_recipients';
const REV_KEY = 'bb_recipients_rev';
const MAX_RECIPIENTS = 50;

function keyFor(userId) {
  return userId ? `${ROOT_KEY}:${userId}` : `${ROOT_KEY}:_anon`;
}

function revKeyFor(userId) {
  return userId ? `${REV_KEY}:${userId}` : `${REV_KEY}:_anon`;
}

export function getRecipientsRevision(userId) {
  try {
    return Number(localStorage.getItem(revKeyFor(userId))) || 0;
  } catch {
    return 0;
  }
}

function bumpRevision(userId) {
  try {
    localStorage.setItem(revKeyFor(userId), String(getRecipientsRevision(userId) + 1));
  } catch {}
}

export function listRecipients(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(userId, list) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(list));
    bumpRevision(userId);
  } catch {}
}

export function newRecipientId() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Upsert a recipient (create when id is absent/unknown, otherwise update in
// place). Returns the stored item.
export function saveRecipient(userId, recipient) {
  const id = recipient.id || newRecipientId();
  const item = {
    id,
    label: String(recipient.label || '').slice(0, 60).trim(),
    relationship: String(recipient.relationship || ''),
    gender: String(recipient.gender || ''),
    age: String(recipient.age || ''),
    interests: String(recipient.interests || '').slice(0, 400),
    addedAt: recipient.addedAt || Date.now(),
  };
  const list = listRecipients(userId);
  const idx = list.findIndex((r) => r.id === id);
  if (idx >= 0) list[idx] = item;
  else list.unshift(item);
  if (list.length > MAX_RECIPIENTS) list.length = MAX_RECIPIENTS;
  write(userId, list);
  cloudUpsertRecipient(item).catch(() => {});
  return item;
}

export function removeRecipient(userId, id) {
  write(userId, listRecipients(userId).filter((r) => r.id !== id));
  cloudDeleteRecipient(id).catch(() => {});
}

export function clearRecipients(userId) {
  try {
    localStorage.removeItem(keyFor(userId));
    bumpRevision(userId);
  } catch {}
  cloudClearRecipients().catch(() => {});
}

// Local-only overwrite used by cloudSync after pulling the server state.
// Does NOT push back to the cloud (avoids echo loops).
export function replaceRecipients(userId, list) {
  write(userId, Array.isArray(list) ? list : []);
}
