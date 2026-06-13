// Saved products ("Mes sélections"). Twin of history.js: localStorage-backed,
// keyed per user (falls back to an anonymous bucket for guests). Stores a light
// snapshot of each product — including the price/url at the moment it was saved,
// since Amazon prices drift over time.
const ROOT_KEY = 'bb_selections';
const REV_KEY = 'bb_selections_rev';
const MAX_SELECTIONS = 100;

function keyFor(userId) {
  return userId ? `${ROOT_KEY}:${userId}` : `${ROOT_KEY}:_anon`;
}

function revKeyFor(userId) {
  return userId ? `${REV_KEY}:${userId}` : `${REV_KEY}:_anon`;
}

// Monotonic counter bumped on every write, so readers (e.g. SelectionsPanel)
// can skip reloading when nothing has changed since their last read.
export function getSelectionsRevision(userId) {
  try {
    return Number(localStorage.getItem(revKeyFor(userId))) || 0;
  } catch {
    return 0;
  }
}

function bumpRevision(userId) {
  try {
    localStorage.setItem(revKeyFor(userId), String(getSelectionsRevision(userId) + 1));
  } catch {}
}

export function listSelections(userId) {
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

export function isSelected(userId, productId) {
  if (productId == null) return false;
  return listSelections(userId).some((p) => p.id === productId);
}

function snapshot(product) {
  return {
    id: product.id,
    brand: product.brand,
    model: product.model,
    price: product.price ?? null,
    image_url: product.image_url || null,
    color: product.color || null,
    rating: product.rating ?? null,
    reviews: product.reviews ?? null,
    score: product.score ?? null,
    amazon_url: product.amazon_url || null,
    category: product.category || null,
    addedAt: Date.now(),
  };
}

// Adds the product if absent, removes it if present.
// Returns the new state: true when selected, false when removed.
export function toggleSelection(userId, product) {
  if (product?.id == null) return false;
  const list = listSelections(userId);
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    write(userId, list);
    return false;
  }
  list.unshift(snapshot(product));
  if (list.length > MAX_SELECTIONS) list.length = MAX_SELECTIONS;
  write(userId, list);
  return true;
}

export function removeSelection(userId, id) {
  write(userId, listSelections(userId).filter((p) => p.id !== id));
}

export function clearSelections(userId) {
  try {
    localStorage.removeItem(keyFor(userId));
    bumpRevision(userId);
  } catch {}
}
