// Products the user actually clicked on among the advisor's proposals (opened
// their detail view). This is the source list for the "Déjà acheté" page — we
// only surface things the user showed interest in, not every product ever
// proposed. localStorage per user; no cloud mirror (the *owned* marks sync via
// owned.js, this is just the local "what did I look at" trail).
const ROOT_KEY = 'bb_clicked';
const MAX_CLICKED = 200;

function keyFor(userId) {
  return userId ? `${ROOT_KEY}:${userId}` : `${ROOT_KEY}:_anon`;
}

export function listClicked(userId) {
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

// Fuller snapshot than selections/owned: the detail pane needs why/specs/score
// /rating too. Falls back gracefully when a field is missing (e.g. a trending
// card snapshot without specs).
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
    why: product.why || null,
    specs: Array.isArray(product.specs) ? product.specs : null,
    amazon_url: product.amazon_url || null,
    category: product.category || null,
    amazon_verified: !!product.amazon_verified,
    clickedAt: Date.now(),
  };
}

// Record a click (detail open). Most-recent first, deduped by id (a re-click
// refreshes the snapshot and moves it to the front).
export function recordClick(userId, product) {
  if (product?.id == null) return;
  const list = listClicked(userId).filter((p) => p.id !== product.id);
  list.unshift(snapshot(product));
  if (list.length > MAX_CLICKED) list.length = MAX_CLICKED;
  write(userId, list);
}

export function clearClicked(userId) {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {}
}
