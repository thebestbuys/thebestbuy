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

### Two parallel UIs — keep both in sync
`src/main.jsx` renders **either** `src/App.jsx` (desktop/web) **or** `src/mobile/MobileApp.jsx` based on: Capacitor native → mobile; else viewport `< 768px` → mobile; `?view=mobile|web` query param overrides. The two UIs **barely share code** — `MobileApp.jsx` is a large self-contained file with inline styles and **does not use** the i18n system or the shared `ProductCard` components. **A feature/compliance change usually has to be applied in both `App.jsx` and `MobileApp.jsx`.**

Providers (both UIs): `LanguageProvider` → `AuthProvider` (see `src/main.jsx`).

### The advisor loop (core of the app)
The client builds a compact **criteria object**, not a chat transcript: `objet` (the thing being searched) + `answers` = `[{id, q, a, tags, min, max}]`. `src/lib/askAI.js` exposes the two backend calls:
- `askQuestion({objet, answers, lang})` → POST `/api/chat` `{mode:'ask'}` → returns **one** adaptive next question. The first question is always **budget**, with brackets whose €-bounds Gemini adapts to the real typical price of `objet`.
- `recommend({objet, answers, lang})` → `{mode:'recommend'}` → Gemini returns ~10 products; the backend verifies them against Amazon and returns the top 3.

`App.jsx` decides when to recommend via `shouldRecommendAt(n)`: at `n >= 5` answers, then every 3rd answer.

`askAI({messages,...})` is the **legacy transcript-based** call — still used by the mobile app. Keep it working.

### Backend `api/chat.js` — one handler, two prompt paths
- **New path** (web): compact criteria JSON → prompts from `buildAskPrompt` / `buildRecommendPrompt`.
- **Legacy path** (mobile): full transcript in `messages` with **no** `mode` field → `buildSystemPrompt` + `toGeminiContents`. The `legacy` flag (`messages.length > 0 && body.mode == null`) branches everything. **Don't break this — mobile depends on it.**
- Model `gemini-3.1-flash-lite`, `responseMimeType: 'application/json'`. Response includes a `_debug` block (timings, token counts, `amazon_blocked`, `direct_links`).

### Amazon verification, affiliate links & the `amazon_verified` flag
`checkAmazon()` in `api/chat.js` (and `api/amazon.js`) scrapes Amazon.fr to confirm a product exists and pull its **real** price/rating/reviews/image plus a direct `/dp/ASIN` affiliate link.

- **Server-side scraping is currently blocked**: Amazon's AWS WAF returns HTTP 202 + a JS challenge. Detection (`status !== 200 || html.length < 10000 || awsWaf markers`) returns `{found:null}`, which sets `amazonBlocked` and bails fast (this is a deliberate latency guard — without it the handler probes all candidates and hangs 30–60s). So in practice verification currently returns nothing.
- Every product carries an **`amazon_verified` boolean** — `true` only when its data came from a successful scrape. **The UI must only show the exact price, star rating, review count, and product image when `amazon_verified === true`.** Otherwise: show an indicative price *range* labelled as an estimate, no stars, no Amazon image (CSS placeholder instead). This is enforced in `src/components/ProductCard.jsx` (`PriceTag`, `VerifiedRating`, `ProductImage`) and mirrored in `MobileApp.jsx`. Do not regress this.
- Affiliate tag `oraklia123-21` lives in `api/chat.js`, `api/amazon.js`, and `src/data/guides.js`. **Every** Amazon URL must carry `&tag=`. Direct `/dp/ASIN` links are preferred; `searchLink(brand, model)` is the commission-eligible fallback.

### Amazon Associates compliance (the site was rejected once — don't reintroduce violations)
- The disclosure string ("En tant que Partenaire Amazon, Oraklia réalise un bénéfice…") must stay visible in footers, guides, and legal notices.
- Outbound buy links use `rel="noopener noreferrer sponsored"`.
- Never display AI-invented prices/ratings/reviews/images as if they were real Amazon data (see `amazon_verified` above).
- `src/data/guides.js` holds original bilingual editorial buying guides — they exist partly to satisfy Amazon's "site of value" content requirement.

### Cross-cutting pieces
- **i18n** (`src/lib/i18n.jsx`): `useI18n()` → `{t, lang, setLang}`; `t(key, vars)` interpolates `{var}`. FR + EN dictionaries are in this one file — **add new keys to both languages**. (Mobile UI is hardcoded FR and ignores this.)
- **Routing**: there is no router. `App.jsx` is state-driven (home / advisor / product / legal / history / guide layers) and **intercepts the browser Back button** via the History API (`pushState`/`popstate`).
- **Persistence**: localStorage only, no backend DB — conversations (`src/lib/history.js`, keys `bb_conversations*`), favorites/selections (`src/lib/selections.js`), language, auth.
- `src/scoring.js` is an intentional stub (ranking/scoring is done by the AI now); `src/data.js` `CATEGORIES` is minimal/legacy.
- `designs/` contains static mockups/prototypes, **not** the live app — editing them changes nothing user-facing.

## Gotchas
- The `Edit` tool can fail to match lines containing `€` or non-breaking spaces. Edit a nearby clean line, or rewrite the block.
- After changing recommendation/verification logic, watch latency: the WAF block-detection early-return is what keeps responses fast.
