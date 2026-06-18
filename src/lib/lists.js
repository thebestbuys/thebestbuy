// Named collections ("listes"), each private or public. Twin of selections.js:
// localStorage-backed, keyed per user, mirrored best-effort to Supabase.
// Membership product↔list is stored on each selection (data.listIds), not here.
import { cloudUpsertList, cloudDeleteList } from './cloud.js';

const ROOT_KEY = 'bb_lists';
const REV_KEY = 'bb_lists_rev';
const MAX_LISTS = 50;

function keyFor(userId) {
  return userId ? `${ROOT_KEY}:${userId}` : `${ROOT_KEY}:_anon`;
}
function revKeyFor(userId) {
  return userId ? `${REV_KEY}:${userId}` : `${REV_KEY}:_anon`;
}

export function getListsRevision(userId) {
  try {
    return Number(localStorage.getItem(revKeyFor(userId))) || 0;
  } catch {
    return 0;
  }
}
function bump(userId) {
  try {
    localStorage.setItem(revKeyFor(userId), String(getListsRevision(userId) + 1));
  } catch {}
}

export function listLists(userId) {
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

export function newListId() {
  return `l_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createList(userId, name, visibility = 'private') {
  const item = {
    id: newListId(),
    name: String(name || '').slice(0, 60).trim() || 'Liste',
    visibility: visibility === 'public' ? 'public' : 'private',
    createdAt: Date.now(),
  };
  const arr = listLists(userId);
  arr.push(item);
  if (arr.length > MAX_LISTS) arr.length = MAX_LISTS;
  write(userId, arr);
  cloudUpsertList(item).catch(() => {});
  return item;
}

export function updateList(userId, id, patch) {
  const arr = listLists(userId);
  const idx = arr.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  const next = { ...arr[idx], ...patch };
  if (patch.name != null) next.name = String(patch.name).slice(0, 60).trim() || arr[idx].name;
  if (patch.visibility) next.visibility = patch.visibility === 'public' ? 'public' : 'private';
  arr[idx] = next;
  write(userId, arr);
  cloudUpsertList(next).catch(() => {});
  return next;
}

export function deleteList(userId, id) {
  write(userId, listLists(userId).filter((l) => l.id !== id));
  cloudDeleteList(id).catch(() => {});
}

// Local-only overwrite used by cloudSync after pulling the server state.
export function replaceLists(userId, serverRows) {
  const arr = (Array.isArray(serverRows) ? serverRows : []).map((r) => ({
    id: r.id,
    name: r.name || '',
    visibility: r.visibility === 'public' ? 'public' : 'private',
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  }));
  write(userId, arr);
}
