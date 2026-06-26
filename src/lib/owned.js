// "Déjà acheté" — products the user told us they already own, so the advisor
// stops recommending them. Twin of selections.js: localStorage is the offline
// cache / synchronous read source; when signed in to the cloud, every mutation
// mirrors to Supabase (best-effort) and cloudSync pulls server state on login /
// app open. See cloud.js / cloudSync.js.
//
// The product id is the stable brand+model slug (productKey in App.jsx), so a
// product owned in one conversation is recognised across every recommendation.
import {
  cloudClearOwned,
  cloudDeleteOwned,
  cloudUpsertOwned,
} from './cloud.js';

const ROOT_KEY = 'bb_owned';
const MAX_OWNED = 300;

function keyFor(userId) {
  return userId ? `${ROOT_KEY}:${userId}` : `${ROOT_KEY}:_anon`;
}

export function listOwned(userId) {
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
  } catch {}
}

export function isOwned(userId, productId) {
  if (productId == null) return false;
  return listOwned(userId).some((p) => p.id === productId);
}

// Set of owned product ids — for cheap membership checks while filtering.
export function ownedIdSet(userId) {
  return new Set(listOwned(userId).map((p) => p.id));
}

// "brand model" strings — appended to the `exclude` sent to /api/chat so Gemini
// never re-proposes an owned product (the backend already honours `exclude`).
export function getOwnedNames(userId) {
  return listOwned(userId)
    .map((p) => `${p.brand || ''} ${p.model || ''}`.trim())
    .filter(Boolean);
}

function snapshot(product) {
  return {
    id: product.id,
    brand: product.brand,
    model: product.model,
    price: product.price ?? null,
    image_url: product.image_url || null,
    color: product.color || null,
    score: product.score ?? null,
    amazon_url: product.amazon_url || null,
    category: product.category || null,
    // Carried so the panel honours the verified-vs-estimate display rules.
    amazon_verified: !!product.amazon_verified,
    addedAt: Date.now(),
  };
}

// Adds the product if absent, removes it if present.
// Returns the new state: true when owned, false when removed.
export function toggleOwned(userId, product) {
  if (product?.id == null) return false;
  const list = listOwned(userId);
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(userId, list);
    cloudDeleteOwned(product.id).catch(() => {});
    return false;
  }
  const item = snapshot(product);
  list.unshift(item);
  if (list.length > MAX_OWNED) list.length = MAX_OWNED;
  write(userId, list);
  cloudUpsertOwned(item).catch(() => {});
  return true;
}

export function removeOwned(userId, id) {
  write(userId, listOwned(userId).filter((p) => p.id !== id));
  cloudDeleteOwned(id).catch(() => {});
}

export function clearOwned(userId) {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {}
  cloudClearOwned().catch(() => {});
}

// Local-only overwrite used by cloudSync after pulling the server state.
// Does NOT push back to the cloud (avoids echo loops).
export function replaceOwned(userId, list) {
  write(userId, Array.isArray(list) ? list : []);
}
