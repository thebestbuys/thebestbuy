// Saved chat conversations. localStorage is the offline cache / synchronous
// read source; when signed in to the cloud, mutations mirror to Supabase and
// cloudSync pulls server state on login / app open. See cloud.js / cloudSync.js.
import {
  cloudClearConversations,
  cloudDeleteConversation,
  cloudUpsertConversation,
} from './cloud.js';

const ROOT_KEY = 'bb_conversations';
const MAX_CONVOS = 50;

function keyFor(userId) {
  return userId ? `${ROOT_KEY}:${userId}` : `${ROOT_KEY}:_anon`;
}

export function listConversations(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveConversation(userId, convo) {
  if (!convo?.id) return;
  const list = listConversations(userId);
  const idx = list.findIndex((c) => c.id === convo.id);
  const now = Date.now();
  const merged = {
    ...convo,
    createdAt: convo.createdAt ?? list[idx]?.createdAt ?? now,
    updatedAt: now,
  };
  if (idx >= 0) list[idx] = merged;
  else list.unshift(merged);
  list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  if (list.length > MAX_CONVOS) list.length = MAX_CONVOS;
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(list));
  } catch {}
  cloudUpsertConversation(merged).catch(() => {});
}

export function deleteConversation(userId, id) {
  const list = listConversations(userId).filter((c) => c.id !== id);
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(list));
  } catch {}
  cloudDeleteConversation(id).catch(() => {});
}

export function clearAllConversations(userId) {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {}
  cloudClearConversations().catch(() => {});
}

// Local-only overwrite used by cloudSync after pulling the server state.
// Does NOT push back to the cloud (avoids echo loops).
export function replaceConversations(userId, list) {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(Array.isArray(list) ? list : []));
  } catch {}
}

export function newConversationId() {
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function deriveTitle({ initialQuery, messages }) {
  const iq = (initialQuery || '').trim();
  if (iq) return iq;
  const firstUser = messages?.find((m) => m.role === 'user' && m.text);
  if (firstUser?.text) return firstUser.text.trim();
  return 'Conversation';
}

export function formatRelative(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "à l'instant";
  const min = Math.round(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return new Date(ts).toLocaleDateString('fr-FR');
}
