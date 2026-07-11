<!-- Last updated: 2026-07-11 -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Oraklia** — a French-first (FR/EN) AI shopping advisor. The user describes what they want to buy, the AI asks adaptive questions, then recommends products with Amazon.fr affiliate links. React + Vite SPA, Vercel serverless functions (`api/`), Google Gemini for the AI, Capacitor for the Android build.

> Naming note: the product is branded **Oraklia** in the UI, but `package.json`, `capacitor.config.json` (`appId com.bestbuys.app`, `appName BestBuys`) and several localStorage keys (`bb_*`) still use the old **bestbuys** name. Don't "fix" these unless asked — renaming the appId breaks the Android build identity.

## Commands

```bash
npm run dev        # Vite dev server — also serves /api/chat locally (see below)
npm run build      # → dist/
npm run preview    # preview the production build
npm run android    # build + cap sync android + cap open android
npm run cap:sync   # build + cap sync android
```

There is **no test runner and no linter** configured. Verify changes with `npm run build` (it must report all modules transformed without errors).

### Env vars
- `GEMINI_API_KEY` — **required** server-side; `api/chat.js` returns 500 without it.
- `VITE_API_BASE_URL` — leave empty for web/dev (API resolved via relative paths). Set to the deployed Vercel URL **only** for the native APK build, so the webview calls the hosted API.

### Local API serving (important)
The `api/` functions are Vercel serverless handlers (ESM, `export default handler`). In dev they are **not** run by Vercel — a custom Vite middleware in `vite.config.js` intercepts requests and loads `api/chat.js` via `ssrLoadModule`. Only `/api/chat` is wired this way; `/api/amazon` is **not** served in dev.

## Architecture

### Single responsive UI
`src/main.jsx` always renders `src/App.jsx`, for every viewport (desktop / tablet / phone) and the native Capacitor build. There is **one** UI now — the old self-contained `src/mobile/MobileApp.jsx` (FR-hardcoded, inline styles, legacy backend) was retired. `App.jsx` adapts via CSS media queries plus a `useIsNarrow()` hook (matchMedia `(max-width: 979px)`):
- **Wide (≥980px)**: the advisor is a two-pane split — `ChatPanel` (left) + `.results-panel` (right, `HeroCard` + `SmallCard`).
- **Narrow (<980px)**: a single chat column. Recommendations render **inside the chat stream** as Amazon "shared link" cards (`ProductLinkCard` in `ProductCard.jsx`), like a link unfurled in WhatsApp/Messenger; no side results panel. The account controls (notif bell, lang, account menu) move into the chat header via `ChatPanel`'s `headerExtras` prop.

Providers: `LanguageProvider` → `AuthProvider` (see `src/main.jsx`).

### The advisor loop (core of the app)
The client builds a compact **criteria object**, not a chat transcript: `objet` (the thing being searched) + `answers` = `[{id, q, a, tags, min, max}]`. `src/lib/askAI.js` exposes the two backend calls:
- `askQuestion({objet, answers, lang})` → POST `/api/chat` `{mode:'ask'}` → returns **one** adaptive next question. The first question is always **budget**, with brackets whose €-bounds Gemini adapts to the real typical price of `objet`.
- `recommend({objet, answers, lang})` → `{mode:'recommend'}` → Gemini returns ~10 products; the backend verifies them against Amazon and returns the top 3.

`App.jsx` decides when to recommend via `shouldRecommendAt(n)`: at `n >= 5` answers, then every 3rd answer.

`askAI({messages,...})` is the **legacy transcript-based** call. It used to power the old mobile UI; since `MobileApp.jsx` was retired it is **no longer called by the app** (dead but kept for now — safe to remove later, along with the legacy backend path).

### Backend `api/chat.js` — one handler, two prompt paths
- **New path** (web): compact criteria JSON → prompts from `buildAskPrompt` / `buildRecommendPrompt`.
- **Legacy path**: full transcript in `messages` with **no** `mode` field → `buildSystemPrompt` + `toGeminiContents`. The `legacy` flag (`messages.length > 0 && body.mode == null`) branches everything. This path is **no longer exercised by the app** (it backed the retired mobile UI); leave it in place but don't build new features on it.
- Model `gemini-3.1-flash-lite`, `responseMimeType: 'application/json'`. Response includes a `_debug` block (timings, token counts, `amazon_blocked`, `direct_links`).

### Amazon verification, affiliate links & the `amazon_verified` flag
`checkAmazon()` in `api/chat.js` (and `searchAmazonFr()` in `api/amazon.js`) verifies a product exists and pulls its **real** price + image + direct affiliate product link via the **Amazon Creators API** (`api/_creators.js`). It searches via `searchItems()` (returns up to 3 candidates), and `pickBestItem()` chooses the best match (coherent title > closeness to Gemini's price > has image) rather than blindly result[0]. When the user picked a budget bracket, its €-bounds are passed through as `minPrice`/`maxPrice` (in **cents**, ±10% tolerance) so only in-budget products are verified.

- **The old HTML scraping was replaced by the Creators API** (the AWS-WAF block — HTTP 202 + JS challenge — made scraping unusable; the legacy PA-API 5.0 was retired 2026-05-15). `api/_creators.js` does OAuth 2.0 client-credentials (Credential ID/Secret → cached bearer token), then `POST {base}/searchItems`. Configured via `AMAZON_CREATORS_*` env vars (see `.env.example`); the dev middleware reads them from `.env.local`.
- **Graceful degradation is the contract**: if creds are missing, the account isn't yet API-eligible (403), the quota throttles (429 — starts at 1 TPS / 8,640 req/day), or any error/network failure, `checkAmazon()` returns `{found:null}` → `amazonBlocked` → the UI shows estimates. The failure reason is surfaced in `_debug.amazon_error`. So a broken/unconfigured API never breaks the app, it just falls back to estimates — same UX as the old WAF block.
- **Star rating & review count are NOT available** from Amazon's API → `rating`/`reviews` stay `null` and the UI keeps them hidden. Only price/image/link get verified.
- Endpoint details (`AMAZON_CREATORS_API_BASE`, token URL, `offersV2` price path) come partly from third-party docs and are **env-overridable** in case a call fails — check `_debug.amazon_error` first.
- Every product carries an **`amazon_verified` boolean** — `true` only when its data came from a successful Creators API hit. **The UI must only show the exact price, star rating, review count, and product image when `amazon_verified === true`.** Otherwise: show an indicative price *range* labelled as an estimate, no stars, no Amazon image (CSS placeholder instead). This is enforced in `src/components/ProductCard.jsx` (`PriceTag`, `VerifiedRating`, `ProductImage`) — including the inline `ProductLinkCard`, which reuses them so the rules hold for free. Do not regress this.
- Affiliate tag `oraklia123-21` lives in `api/chat.js`, `api/amazon.js`, and `src/data/guides.js`. **Every** Amazon URL must carry the `tag=`. The API's canonical **`detailPageURL`** (already tagged + tracked, lands on the product page) is preferred; a hand-built `/dp/ASIN?tag=` link is the fallback when the API omits it; `searchLink(brand, model)` is the last-resort commission-eligible fallback for unverified products.

### Amazon Associates compliance (the site was rejected once — don't reintroduce violations)
- The disclosure string ("En tant que Partenaire Amazon, Oraklia réalise un bénéfice…") must stay visible in footers, guides, and legal notices.
- Outbound buy links use `rel="noopener noreferrer sponsored"`.
- Never display AI-invented prices/ratings/reviews/images as if they were real Amazon data (see `amazon_verified` above).
- `src/data/guides.js` holds original bilingual editorial buying guides — they exist partly to satisfy Amazon's "site of value" content requirement.

### Cross-cutting pieces
- **i18n** (`src/lib/i18n.jsx`): `useI18n()` → `{t, lang, setLang}`; `t(key, vars)` interpolates `{var}`. FR + EN dictionaries are in this one file — **add new keys to both languages**.
- **Routing**: no router library. `App.jsx` is state-driven (home / advisor / product / history layers) and **intercepts the browser Back button** via the History API (`pushState`/`popstate`). The **SEO/shareable pages carry a real URL**: guides (`/guide/<slug>`) and legal (`/mentions-legales`). `navOpenGuide`/`navOpenLegal` pass a path to `pushHistory(url)`; `viewFromPath()` opens the right view on a direct hit/refresh (lazy `useState` init); every other view stays URL-less. These URLs are **prerendered** at build by `scripts/prerender.mjs` (plain Node, mirrors `GuideArticle` markup from `src/data/guides.js`) into `dist/<path>/index.html` with per-page title/description/canonical + Article JSON-LD, and it regenerates `dist/sitemap.xml`. `npm run build` runs `vite build && node scripts/prerender.mjs`. **Web build uses `base:'/'`; the Capacitor build must use `base:'./'` via `vite build --mode capacitor`** (the `cap:*`/`android` scripts do this) — don't run plain `vite build` for native or the APK's relative asset URLs break. `vercel.json` adds the SPA fallback (serves static prerendered files first, else `index.html`).
- **Persistence**: localStorage first (conversations `src/lib/history.js` keys `bb_conversations*`, favorites/selections `src/lib/selections.js`, profile, language, auth). When signed in, most stores **also mirror to Supabase** (`src/lib/cloud.js`, schema in `supabase/schema.sql`); cross-user reads go through **SECURITY DEFINER RPCs** scoped to accepted friendships (e.g. `list_friends`, `circle_trending`). After editing `supabase/schema.sql`, the SQL must be re-run in the Supabase SQL editor to take effect.
- **"Trends in my circle"** (`TrendingCircle` on the home): `circle_trending` RPC aggregates products that the user's *consenting* friends saved (`selections`) or clicked (`link_clicks`), ranked by distinct-friend count. Sharing is **opt-out** via the profile flag `shareTrends` (mirrored into `profiles.data`); a friend contributes unless it's `'false'`. Trending cards reuse `ProductLinkCard` so the `amazon_verified` display rules hold (legacy snapshots without the flag degrade safely to an estimate).
- `src/scoring.js` is an intentional stub (ranking/scoring is done by the AI now); `src/data.js` `CATEGORIES` is minimal/legacy.
- `designs/` contains static mockups/prototypes, **not** the live app — editing them changes nothing user-facing.

## Gotchas
- The `Edit` tool can fail to match lines containing `€` or non-breaking spaces. Edit a nearby clean line, or rewrite the block.
- After changing recommendation/verification logic, watch latency: verification calls the Creators API sequentially per candidate, so any error must fast-fail to `{found:null}` (which bails the loop) — that early-return is what keeps responses fast. Per-request token caching + the 6h result cache in `api/_creators.js` protect the low daily quota; don't remove them.
