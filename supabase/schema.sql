-- Oraklia cloud sync schema. Run this in the Supabase SQL editor.
-- Two tables, both scoped to the signed-in user by Row Level Security.

-- ── Selections (saved products) ───────────────────────────────────────────
create table if not exists public.selections (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  product_id text        not null,
  data       jsonb       not null,
  added_at   timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ── Conversations (chat history) ──────────────────────────────────────────
create table if not exists public.conversations (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.selections    enable row level security;
alter table public.conversations enable row level security;

drop policy if exists "own selections" on public.selections;
create policy "own selections" on public.selections
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own conversations" on public.conversations;
create policy "own conversations" on public.conversations
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helpful index for the ordered fetches the client does.
create index if not exists selections_added_idx
  on public.selections (user_id, added_at desc);
create index if not exists conversations_updated_idx
  on public.conversations (user_id, updated_at desc);
