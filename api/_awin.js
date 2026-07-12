// Awin (affiliate network) tracked-link builder.
//
// Used for Rakuten FR as a secondary "buy" option next to Amazon. The Publisher
// ID and the advertiser MID are PUBLIC identifiers (they appear in clear text in
// every affiliate URL), so they're safe defaults here; env vars override them:
//   AWIN_PUBLISHER_ID  — our Awin publisher id (The Best Buyers Club)
//   AWIN_RAKUTEN_MID   — the Rakuten FR advertiser id (MID) on Awin
//
// Graceful degradation (same contract as the Amazon path): if the publisher id
// or a merchant MID is missing, the link builders return null and the caller
// simply omits that merchant's offer — nothing breaks.

const AWIN_PUBLISHER_ID = process.env.AWIN_PUBLISHER_ID || '1634669';
const AWIN_RAKUTEN_MID  = process.env.AWIN_RAKUTEN_MID  || '55615';
// Enhanced-feed download coordinates (Google format, JSONL). Env-overridable.
const AWIN_VERTICAL = process.env.AWIN_VERTICAL || 'retail';
const AWIN_LOCALE   = process.env.AWIN_LOCALE   || 'fr_FR';

export function awinFeedConfig() {
  return {
    publisherId: AWIN_PUBLISHER_ID,
    rakutenMid: AWIN_RAKUTEN_MID,
    vertical: AWIN_VERTICAL,
    locale: AWIN_LOCALE,
    hasToken: Boolean(process.env.AWIN_API_TOKEN),
  };
}

// Enhanced-feed (Google format, JSONL) download URL for a given advertiser MID.
//   GET https://api.awin.com/publishers/{PUBID}/awinfeeds/download/{MID}-{VERTICAL}-{LOCALE}
// Authenticated with a Bearer AWIN_API_TOKEN. Returns the full product catalogue.
export function awinFeedUrl(mid = AWIN_RAKUTEN_MID) {
  return `https://api.awin.com/publishers/${AWIN_PUBLISHER_ID}/awinfeeds/download/${mid}-${AWIN_VERTICAL}-${AWIN_LOCALE}`;
}

// Wrap a destination URL in an Awin tracked ("cread") link so the click is
// attributed to us and earns commission.
function awinLink(mid, dest) {
  if (!AWIN_PUBLISHER_ID || !mid || !dest) return null;
  return `https://www.awin1.com/cread.php?awinmid=${mid}&awinaffid=${AWIN_PUBLISHER_ID}&ued=${encodeURIComponent(dest)}`;
}

// Commission-eligible Rakuten FR link: a tracked deep link to the Rakuten search
// results for this product (brand + model). No verified price yet — this is the
// link-only step; real prices come later from the Awin product feed / API.
export function rakutenSearchLink(brand, model) {
  const q = [brand, model].filter(Boolean).join(' ').trim();
  if (!q) return null;
  const dest = `https://fr.shopping.rakuten.com/search/${encodeURIComponent(q)}`;
  return awinLink(AWIN_RAKUTEN_MID, dest);
}

export function awinConfigured() {
  return Boolean(AWIN_PUBLISHER_ID);
}
