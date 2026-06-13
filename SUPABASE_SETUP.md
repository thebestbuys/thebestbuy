# Supabase setup — cross-device sync of selections & history

Selections ("Mes sélections") and chat history sync across devices when the
user is signed in with Google. localStorage stays as the offline cache; the
server (Supabase) is the source of truth once signed in. If the Supabase env
vars are absent, the app runs exactly as before (localStorage only).

## 1. Create the project

1. Go to https://supabase.com, create a new project. Pick a region close to
   your users (e.g. EU).
2. Note the **Project URL** and the client key under *Project Settings → API*.
   On newer projects the client key is called **Publishable key**
   (`sb_publishable_...`) — it replaces the old "anon public" key; use it.
   Never put the **Secret key** (`sb_secret_...`) in the front-end.

## 2. Create the tables

Open *SQL Editor*, paste the contents of [`supabase/schema.sql`](supabase/schema.sql)
and run it. This creates `selections` and `conversations`, both protected by
Row Level Security (a user can only read/write their own rows).

## 3. Enable Google sign-in (ID-token flow)

The app already gets a Google ID token from Google Identity Services (web) and
the native plugin (Android). Supabase verifies it via
`signInWithIdToken({ provider: 'google', token })`.

1. *Authentication → Providers → Google*: toggle **Enabled**.
2. In **Authorized Client IDs**, add the **same** Google client ID used by the
   app (`VITE_GOOGLE_CLIENT_ID`). For Android you may have a separate client ID
   — add it here too. (Client secret isn't required for the ID-token flow, but
   filling it in doesn't hurt.)
3. *Authentication → URL Configuration*: set the **Site URL** to your deployed
   origin (e.g. `https://thebestbuy.vercel.app`) and add `http://localhost:5173`
   to **Redirect URLs** for local dev.

## 4. Wire the env vars

In `.env` / `.env.local` (and in Vercel's project env for production):

```
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

Rebuild (`npm run build`) or restart `npm run dev`.

## How it behaves

- **Fresh sign-in**: local + anonymous data is pushed up, then the account's
  server data is pulled down and replaces the local cache (favorites saved
  before signing in are merged, not lost).
- **App open while already signed in**: the server data is pulled down
  (pull-only), so an item deleted on another device stays deleted.
- **Every change while signed in** (add/remove favorite, save/delete a
  conversation) mirrors to the server best-effort.
- **Sign out** ends the cloud session but leaves the account's server data
  intact.

## Known limitations (v1)

- **No real-time**: changes appear on other devices on next app open / panel
  open, not instantly.
- **No offline write queue**: a change made while signed in *and* offline
  reaches localStorage but not the server, and can be overwritten by the next
  pull. (Online is assumed when signed in.)
- **Nonce**: the ID-token exchange is done without a nonce. If Supabase rejects
  the token with a nonce error, we'll add hashed-nonce handling to the Google
  Identity Services init.
