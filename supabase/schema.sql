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

-- ── Owned ("Déjà acheté") — products the user already has, so the advisor
--    stops recommending them. Same shape as selections.
create table if not exists public.owned (
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

-- ── Recipients (saved gift profiles) ──────────────────────────────────────
create table if not exists public.recipients (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  recipient_id text        not null,
  data         jsonb       not null,
  added_at     timestamptz not null default now(),
  primary key (user_id, recipient_id)
);

-- ── Profiles (cloud "Mon profil", + identity for the friend directory) ──────
-- `data` holds the private self-description (bio, age, tastes…) read only by the
-- owner (client) and the server (gift generation for friends). display_name /
-- avatar_url are the public identity used by the friend search.
create table if not exists public.profiles (
  user_id      uuid        primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  email        text,
  data         jsonb       not null default '{}'::jsonb,
  -- Tester / internal account flag, toggled from the admin panel. Tester users
  -- are excluded from the dashboard aggregates (see tester_ids()).
  is_tester    boolean     not null default false,
  updated_at   timestamptz not null default now()
);
-- Backfill for existing deployments (create table if not exists won't add it).
alter table public.profiles add column if not exists is_tester boolean not null default false;

-- ── Friend requests / friendships ──────────────────────────────────────────
create table if not exists public.friend_requests (
  id           uuid        primary key default gen_random_uuid(),
  requester_id uuid        not null references auth.users (id) on delete cascade,
  addressee_id uuid        not null references auth.users (id) on delete cascade,
  status       text        not null default 'pending',  -- pending | accepted
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- ── Lists (named collections, private/public) ──────────────────────────────
-- Membership product↔list lives in selections.data.listIds (no extra table).
-- id is TEXT (client-generated, e.g. "l_xxx"). An earlier version used a uuid
-- column which rejected those ids — migrate it (the uuid table never stored
-- anything, since those inserts failed).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'lists'
      and column_name = 'id' and data_type = 'uuid'
  ) then
    drop table public.lists cascade;
  end if;
end $$;
create table if not exists public.lists (
  id         text        primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  name       text        not null,
  visibility text        not null default 'private',  -- private | public
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Occasions (manual reminders: birthdays, etc.) ──────────────────────────
create table if not exists public.occasions (
  id         text        primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  label      text        not null,
  date       text        not null,           -- 'MM-DD' or 'YYYY-MM-DD'
  recurring  boolean     not null default true,
  created_at timestamptz not null default now()
);

-- ── Polls ("ask a friend's opinion") ───────────────────────────────────────
create table if not exists public.polls (
  id         text        primary key,
  owner_id   uuid        not null references auth.users (id) on delete cascade,
  items      jsonb       not null,            -- [{b,m,p,u,i}, …]
  title      text,                            -- optional poll name / question
  created_at timestamptz not null default now()
);
-- Backfill for existing deployments (create table if not exists won't add it).
alter table public.polls add column if not exists title text;
create table if not exists public.poll_recipients (
  poll_id      text not null references public.polls (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  primary key (poll_id, recipient_id)
);
create table if not exists public.poll_votes (
  poll_id    text        not null references public.polls (id) on delete cascade,
  voter_id   uuid        not null references auth.users (id) on delete cascade,
  choice     integer     not null,
  created_at timestamptz not null default now(),
  primary key (poll_id, voter_id)
);

-- ── Shared lists (short share links) ───────────────────────────────────────
-- A gift/wishlist snapshot stored under a short id, so share links stay tiny
-- (?s=ab12cd34) instead of carrying the whole payload in the URL.
create table if not exists public.shared_lists (
  id         text        primary key,
  data       jsonb       not null,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.selections    enable row level security;
alter table public.owned         enable row level security;
alter table public.conversations enable row level security;
alter table public.recipients    enable row level security;
alter table public.profiles      enable row level security;
alter table public.friend_requests enable row level security;
alter table public.shared_lists  enable row level security;
alter table public.lists         enable row level security;
alter table public.occasions     enable row level security;
alter table public.polls           enable row level security;
alter table public.poll_recipients enable row level security;
alter table public.poll_votes      enable row level security;

drop policy if exists "own selections" on public.selections;
create policy "own selections" on public.selections
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own owned" on public.owned;
create policy "own owned" on public.owned
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own conversations" on public.conversations;
create policy "own conversations" on public.conversations
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own recipients" on public.recipients;
create policy "own recipients" on public.recipients
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A user can read/write only their own profile row. Friend search reads public
-- fields through a SECURITY DEFINER function (see Phase B), so the table itself
-- stays private.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Friend requests: each side can see/act on rows that involve them.
drop policy if exists "see own friend rows" on public.friend_requests;
create policy "see own friend rows" on public.friend_requests
  for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

drop policy if exists "send friend request" on public.friend_requests;
create policy "send friend request" on public.friend_requests
  for insert
  with check (auth.uid() = requester_id);

drop policy if exists "respond to friend request" on public.friend_requests;
create policy "respond to friend request" on public.friend_requests
  for update
  using      (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

drop policy if exists "remove friend row" on public.friend_requests;
create policy "remove friend row" on public.friend_requests
  for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Shared lists: anyone with the link can read (incl. anonymous visitors);
-- only signed-in users can create one.
drop policy if exists "read shared lists" on public.shared_lists;
create policy "read shared lists" on public.shared_lists
  for select
  using (true);

drop policy if exists "create shared lists" on public.shared_lists;
create policy "create shared lists" on public.shared_lists
  for insert
  with check (auth.uid() is not null);

drop policy if exists "own occasions" on public.occasions;
create policy "own occasions" on public.occasions
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Lists: owner-only read/write. Friends read PUBLIC lists via SECURITY DEFINER
-- functions (Phase 2), so the table itself stays private.
drop policy if exists "own lists" on public.lists;
create policy "own lists" on public.lists
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Polls: owner manages own rows directly; all cross-user access goes through the
-- SECURITY DEFINER functions below (recipients/votes have no direct policy).
drop policy if exists "own polls" on public.polls;
create policy "own polls" on public.polls
  for all
  using      (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Create a poll (optional title) and address it to accepted friends only.
drop function if exists public.create_poll(text, jsonb, uuid[]);
create or replace function public.create_poll(p_id text, p_items jsonb, p_recipients uuid[], p_title text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.polls (id, owner_id, items, title) values (p_id, auth.uid(), p_items, nullif(btrim(p_title), ''));
  insert into public.poll_recipients (poll_id, recipient_id)
  select p_id, r
  from unnest(p_recipients) as r
  where exists (
    select 1 from public.friend_requests fr
    where fr.status = 'accepted'
      and ((fr.requester_id = auth.uid() and fr.addressee_id = r)
        or (fr.requester_id = r and fr.addressee_id = auth.uid()))
  );
end;
$$;
grant execute on function public.create_poll(text, jsonb, uuid[], text) to authenticated;

-- Polls addressed to me (with the asker's identity, the poll title + my vote).
drop function if exists public.incoming_polls();
create or replace function public.incoming_polls()
returns table (id text, owner_id uuid, owner_name text, owner_avatar text, title text, items jsonb, created_at timestamptz, my_vote integer)
language sql security definer set search_path = public as $$
  select pl.id, pl.owner_id, pr.display_name, pr.avatar_url, pl.title, pl.items, pl.created_at,
    (select v.choice from public.poll_votes v where v.poll_id = pl.id and v.voter_id = auth.uid())
  from public.polls pl
  join public.poll_recipients prr on prr.poll_id = pl.id and prr.recipient_id = auth.uid()
  join public.profiles pr on pr.user_id = pl.owner_id
  order by pl.created_at desc;
$$;
grant execute on function public.incoming_polls() to authenticated;

-- My polls (with title) and per-voter results.
drop function if exists public.outgoing_polls();
create or replace function public.outgoing_polls()
returns table (id text, title text, items jsonb, created_at timestamptz, votes jsonb)
language sql security definer set search_path = public as $$
  select pl.id, pl.title, pl.items, pl.created_at,
    coalesce((
      select jsonb_agg(jsonb_build_object('choice', v.choice, 'name', p.display_name))
      from public.poll_votes v join public.profiles p on p.user_id = v.voter_id
      where v.poll_id = pl.id
    ), '[]'::jsonb)
  from public.polls pl
  where pl.owner_id = auth.uid()
  order by pl.created_at desc;
$$;
grant execute on function public.outgoing_polls() to authenticated;

-- Cast / change my vote (only if I'm a recipient).
create or replace function public.vote_poll(p_id text, p_choice integer)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.poll_recipients where poll_id = p_id and recipient_id = auth.uid()) then
    insert into public.poll_votes (poll_id, voter_id, choice)
    values (p_id, auth.uid(), p_choice)
    on conflict (poll_id, voter_id) do update set choice = excluded.choice;
  end if;
end;
$$;
grant execute on function public.vote_poll(text, integer) to authenticated;

-- Owner deletes their own poll ("Mes sondages"); recipients + votes cascade.
create or replace function public.delete_poll(p_id text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.polls where id = p_id and owner_id = auth.uid();
end;
$$;
grant execute on function public.delete_poll(text) to authenticated;

-- Recipient dismisses a poll addressed to them ("On te demande ton avis"):
-- removes only their recipient row + vote; the poll stays for the owner/others.
create or replace function public.dismiss_poll(p_id text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.poll_votes where poll_id = p_id and voter_id = auth.uid();
  delete from public.poll_recipients where poll_id = p_id and recipient_id = auth.uid();
end;
$$;
grant execute on function public.dismiss_poll(text) to authenticated;

-- ── Friend directory functions (SECURITY DEFINER) ──────────────────────────
-- These read the public identity columns of OTHER users without opening the
-- profiles table to everyone. They always scope to auth.uid().

-- Search registered users by display name (fuzzy), with the current relationship
-- status so the UI can show Add / Pending / Friends.
create or replace function public.search_users(q text)
returns table (user_id uuid, display_name text, avatar_url text, status text)
language sql security definer set search_path = public as $$
  select p.user_id, p.display_name, p.avatar_url,
    (select fr.status from public.friend_requests fr
       where (fr.requester_id = auth.uid() and fr.addressee_id = p.user_id)
          or (fr.requester_id = p.user_id and fr.addressee_id = auth.uid())
       limit 1) as status
  from public.profiles p
  where p.user_id <> auth.uid()
    and coalesce(p.display_name, '') <> ''
    and p.display_name ilike '%' || q || '%'
  order by p.display_name
  limit 10;
$$;
grant execute on function public.search_users(text) to authenticated;

-- Accepted friends, returning the OTHER party's public identity + how many items
-- they have in their wishlist (selections), so the UI can hint "X has N ideas".
-- Drop first: the return columns changed (can't be done by CREATE OR REPLACE).
drop function if exists public.list_friends();
create function public.list_friends()
returns table (user_id uuid, display_name text, avatar_url text, wishlist_count integer, birthday text)
language sql security definer set search_path = public as $$
  select p.user_id, p.display_name, p.avatar_url,
    (select count(*)::int from public.selections s where s.user_id = p.user_id) as wishlist_count,
    (p.data->>'birthday') as birthday
  from public.friend_requests fr
  join public.profiles p
    on p.user_id = case when fr.requester_id = auth.uid()
                        then fr.addressee_id else fr.requester_id end
  where fr.status = 'accepted'
    and (fr.requester_id = auth.uid() or fr.addressee_id = auth.uid())
  order by p.display_name;
$$;
grant execute on function public.list_friends() to authenticated;

-- A friend's PUBLIC lists (only if accepted friendship), with item counts.
create or replace function public.friend_public_lists(friend uuid)
returns table (id text, name text, item_count integer)
language sql security definer set search_path = public as $$
  select l.id, l.name,
    (select count(*)::int from public.selections s
       where s.user_id = l.user_id and s.data->'listIds' ? l.id) as item_count
  from public.lists l
  where l.user_id = friend
    and l.visibility = 'public'
    and exists (
      select 1 from public.friend_requests fr
      where fr.status = 'accepted'
        and ((fr.requester_id = auth.uid() and fr.addressee_id = friend)
          or (fr.requester_id = friend and fr.addressee_id = auth.uid()))
    )
  order by l.name;
$$;
grant execute on function public.friend_public_lists(uuid) to authenticated;

-- Items of a specific PUBLIC list owned by an accepted friend.
create or replace function public.public_list_items(list text)
returns table (data jsonb)
language sql security definer set search_path = public as $$
  select s.data
  from public.lists l
  join public.selections s
    on s.user_id = l.user_id and s.data->'listIds' ? l.id
  where l.id = list
    and l.visibility = 'public'
    and exists (
      select 1 from public.friend_requests fr
      where fr.status = 'accepted'
        and ((fr.requester_id = auth.uid() and fr.addressee_id = l.user_id)
          or (fr.requester_id = l.user_id and fr.addressee_id = auth.uid()))
    )
  order by (s.data->>'addedAt') desc;
$$;
grant execute on function public.public_list_items(text) to authenticated;

-- ── Link clicks (Amazon outbound) — a lightweight popularity signal ─────────
-- Every time a user opens an Amazon product link we record a row. Combined with
-- selections, this feeds the "Trends in my circle" aggregate below.
create table if not exists public.link_clicks (
  id         bigint      generated always as identity primary key,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  product_id text        not null,
  data       jsonb       not null,            -- product snapshot (same shape as selections.data)
  clicked_at timestamptz not null default now()
);
alter table public.link_clicks enable row level security;
drop policy if exists "own link clicks" on public.link_clicks;
create policy "own link clicks" on public.link_clicks
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create index if not exists link_clicks_user_idx on public.link_clicks (user_id, clicked_at desc);
create index if not exists link_clicks_product_idx on public.link_clicks (product_id);

-- ── "Trends in my circle" (SECURITY DEFINER) ───────────────────────────────
-- Aggregate, across the current user's accepted friends WHO CONSENT to sharing,
-- the products they saved (selections) or clicked (link_clicks). Sharing is
-- OPT-OUT: a friend contributes unless profiles.data.shareTrends = 'false'.
-- Ranked by the number of distinct friends behind each product; returns one
-- representative snapshot (most recent) per product, plus ANONYMIZED aggregate
-- signals: friend_count (distinct friends behind it, saves ∪ views), save_count
-- (distinct friends who favourited it) and view_count (Amazon views across the
-- circle). No friend identities are returned — the UI only ever shows counts.
-- Return signature changed → drop before recreate.
drop function if exists public.circle_trending(int);
create or replace function public.circle_trending(max_items int default 12)
returns table (product_id text, data jsonb, friend_count int, save_count int, view_count int)
language sql security definer set search_path = public as $$
  with friends as (
    select case when fr.requester_id = auth.uid() then fr.addressee_id else fr.requester_id end as fid
    from public.friend_requests fr
    where fr.status = 'accepted'
      and (fr.requester_id = auth.uid() or fr.addressee_id = auth.uid())
  ),
  consenting as (
    select f.fid
    from friends f
    join public.profiles p on p.user_id = f.fid
    where coalesce(p.data->>'shareTrends', 'true') <> 'false'
  ),
  signals as (
    select s.user_id, s.product_id, s.data, s.added_at as ts, 'save'::text as kind
    from public.selections s
    join consenting c on c.fid = s.user_id
    union all
    select lc.user_id, lc.product_id, lc.data, lc.clicked_at as ts, 'view'::text as kind
    from public.link_clicks lc
    join consenting c on c.fid = lc.user_id
  ),
  agg as (
    select
      product_id,
      count(distinct user_id) as friend_count,
      count(distinct user_id) filter (where kind = 'save') as save_count,
      count(*) filter (where kind = 'view') as view_count
    from signals
    group by product_id
  ),
  rep as (
    -- one representative snapshot per product: the most recent signal
    select distinct on (product_id) product_id, data, ts
    from signals
    order by product_id, ts desc
  )
  select a.product_id, r.data, a.friend_count::int, a.save_count::int, a.view_count::int
  from agg a
  join rep r on r.product_id = a.product_id
  order by a.friend_count desc, a.view_count desc, r.ts desc
  limit greatest(1, least(max_items, 50));
$$;
grant execute on function public.circle_trending(int) to authenticated;

-- Pending requests addressed to me, with the requester's identity.
create or replace function public.list_incoming_requests()
returns table (id uuid, user_id uuid, display_name text, avatar_url text, created_at timestamptz)
language sql security definer set search_path = public as $$
  select fr.id, p.user_id, p.display_name, p.avatar_url, fr.created_at
  from public.friend_requests fr
  join public.profiles p on p.user_id = fr.requester_id
  where fr.addressee_id = auth.uid() and fr.status = 'pending'
  order by fr.created_at desc;
$$;
grant execute on function public.list_incoming_requests() to authenticated;

-- Helpful index for the ordered fetches the client does.
create index if not exists selections_added_idx
  on public.selections (user_id, added_at desc);
create index if not exists owned_added_idx
  on public.owned (user_id, added_at desc);
create index if not exists conversations_updated_idx
  on public.conversations (user_id, updated_at desc);
create index if not exists recipients_added_idx
  on public.recipients (user_id, added_at desc);

-- ── Superuser ("god mode" / SU) ─────────────────────────────────────────────
-- One hard-wired account gets READ access to every user's lists, wishlist,
-- "déjà acheté" and conversation history — WITHOUT being anyone's friend. We
-- never insert friend_requests rows for it, so the superuser never appears in
-- another user's friends list, search results or circle_trending. Identity is
-- resolved from auth.uid() inside SECURITY DEFINER functions (the signed JWT),
-- never from a client-supplied flag, so the UI "SU mode" toggle is purely
-- cosmetic: every admin_* call below re-checks is_superuser() server-side and
-- returns an empty set for anyone else. To change the admin, edit the email in
-- BOTH this function and SUPERUSER_EMAIL in src/lib/cloud.js.
create or replace function public.is_superuser()
returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from auth.users u
    where u.id = auth.uid()
      and lower(u.email) = 'thebestbuyersclub@gmail.com'
  );
$$;
grant execute on function public.is_superuser() to authenticated;

-- Tester / internal accounts to EXCLUDE from the admin dashboard aggregates, so
-- the stats reflect real users only. Now fully dynamic: it returns the user ids
-- flagged profiles.is_tester, which the superuser toggles from the admin panel
-- (admin_set_tester below). Internal helper: execute is revoked from clients;
-- only the owner-run admin_* functions (SECURITY DEFINER) call it.
create or replace function public.tester_ids()
returns table (user_id uuid)
language sql stable security definer set search_path = public as $$
  select p.user_id from public.profiles p where p.is_tester;
$$;
revoke all on function public.tester_ids() from public, anon, authenticated;

-- One-time seed of the originally-known testers, so a fresh install starts with
-- them excluded. Guarded: only runs when no tester is flagged yet, so it never
-- clobbers choices the admin later makes from the panel.
do $$
begin
  if not exists (select 1 from public.profiles where is_tester) then
    update public.profiles
    set is_tester = true
    where lower(btrim(coalesce(display_name, ''))) in ('elcocogld', 'romain marcucci', 'best buys');
  end if;
end $$;

-- Superuser toggles a user's tester flag from the admin panel. No-op for anyone
-- else (the is_superuser() guard makes the UPDATE match zero rows).
create or replace function public.admin_set_tester(target uuid, p_tester boolean)
returns void
language sql security definer set search_path = public as $$
  update public.profiles
  set is_tester = coalesce(p_tester, false), updated_at = now()
  where public.is_superuser() and user_id = target;
$$;
grant execute on function public.admin_set_tester(uuid, boolean) to authenticated;

-- Every registered user (superuser only). Mirrors list_friends' shape (+ email)
-- so the Admin panel can reuse the friend-row UI. Empty for non-superusers.
-- Includes the is_tester flag so the panel can show/toggle it; testers are NOT
-- hidden here (the admin needs to see them to manage the flag) — they're only
-- excluded from the aggregate stats. Return signature changed → drop first.
drop function if exists public.admin_list_users();
create or replace function public.admin_list_users()
returns table (user_id uuid, display_name text, avatar_url text, email text, wishlist_count integer, is_tester boolean)
language sql security definer set search_path = public as $$
  select p.user_id, p.display_name, p.avatar_url, p.email,
    (select count(*)::int from public.selections s where s.user_id = p.user_id) as wishlist_count,
    coalesce(p.is_tester, false) as is_tester
  from public.profiles p
  where public.is_superuser()
    and p.user_id <> auth.uid()
  order by coalesce(nullif(btrim(p.display_name), ''), p.email);
$$;
grant execute on function public.admin_list_users() to authenticated;

-- All of a user's lists, PRIVATE INCLUDED, with item counts (superuser only).
create or replace function public.admin_user_lists(target uuid)
returns table (id text, name text, visibility text, item_count integer)
language sql security definer set search_path = public as $$
  select l.id, l.name, l.visibility,
    (select count(*)::int from public.selections s
       where s.user_id = l.user_id and s.data->'listIds' ? l.id) as item_count
  from public.lists l
  where public.is_superuser() and l.user_id = target
  order by l.name;
$$;
grant execute on function public.admin_user_lists(uuid) to authenticated;

-- Items of a specific list owned by any user (superuser only).
create or replace function public.admin_list_items(list text)
returns table (data jsonb)
language sql security definer set search_path = public as $$
  select s.data
  from public.lists l
  join public.selections s on s.user_id = l.user_id and s.data->'listIds' ? l.id
  where public.is_superuser() and l.id = list
  order by (s.data->>'addedAt') desc;
$$;
grant execute on function public.admin_list_items(text) to authenticated;

-- A user's FULL wishlist (every selection, including those in no list).
create or replace function public.admin_user_selections(target uuid)
returns table (data jsonb)
language sql security definer set search_path = public as $$
  select s.data from public.selections s
  where public.is_superuser() and s.user_id = target
  order by s.added_at desc;
$$;
grant execute on function public.admin_user_selections(uuid) to authenticated;

-- A user's "Déjà acheté" (owned) products (superuser only).
create or replace function public.admin_user_owned(target uuid)
returns table (data jsonb)
language sql security definer set search_path = public as $$
  select o.data from public.owned o
  where public.is_superuser() and o.user_id = target
  order by o.added_at desc;
$$;
grant execute on function public.admin_user_owned(uuid) to authenticated;

-- A user's "Consultés" (link clicks) products, most recent click first
-- (superuser only). Dedup by product_id happens client-side, same as
-- cloudFetchLinkClicks — this is an append-only log so a product can repeat.
create or replace function public.admin_user_clicks(target uuid)
returns table (product_id text, data jsonb, clicked_at timestamptz)
language sql security definer set search_path = public as $$
  select lc.product_id, lc.data, lc.clicked_at from public.link_clicks lc
  where public.is_superuser() and lc.user_id = target
  order by lc.clicked_at desc;
$$;
grant execute on function public.admin_user_clicks(uuid) to authenticated;

-- A user's conversation history (superuser only).
create or replace function public.admin_user_conversations(target uuid)
returns table (id text, data jsonb, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select c.id, c.data, c.updated_at from public.conversations c
  where public.is_superuser() and c.user_id = target
  order by c.updated_at desc;
$$;
grant execute on function public.admin_user_conversations(uuid) to authenticated;

-- A user's profile: public identity + the private profile data (superuser only).
create or replace function public.admin_user_profile(target uuid)
returns table (display_name text, email text, avatar_url text, data jsonb)
language sql security definer set search_path = public as $$
  select p.display_name, p.email, p.avatar_url, p.data
  from public.profiles p
  where public.is_superuser() and p.user_id = target;
$$;
grant execute on function public.admin_user_profile(uuid) to authenticated;

-- ── Backend API call volume (Gemini / Amazon / Supabase) ───────────────────
-- Counts of calls our own serverless functions (api/*.js) make to each backing
-- service, for the admin dashboard. One row per flush, `count` lets a single
-- request batch several calls (e.g. all the Supabase reads in one /api/chat
-- request) into one insert. Written only by the server (service role) — no
-- RLS policy means anon/authenticated get neither read nor write; only the
-- service-role key (which bypasses RLS) can touch it.
create table if not exists public.api_call_logs (
  id         bigint      generated always as identity primary key,
  service    text        not null check (service in ('gemini', 'amazon', 'supabase')),
  count      integer     not null default 1,
  user_id    uuid,
  created_at timestamptz not null default now()
);
-- user_id added later so the API-volume metrics can exclude tester accounts too.
-- Nullable: server-side calls with no signed-in user (e.g. anonymous suggestions)
-- still log, just unattributed. No FK so a row survives an account deletion.
alter table public.api_call_logs add column if not exists user_id uuid;
-- Conversation id of the advisor session that made the call (nullable: null for
-- suggestions / non-advisor calls). Lets the dashboard count DISTINCT anonymous
-- advisor sessions (anon rows have user_id null), not just raw call volume.
alter table public.api_call_logs add column if not exists conversation_id text;
alter table public.api_call_logs enable row level security;
create index if not exists api_call_logs_service_day_idx
  on public.api_call_logs (service, created_at);

-- ── Admin metrics (BestBuys dashboard, superuser only) ──────────────────────
-- One round-trip of aggregate database stats. Returns {} for non-superusers.
-- Reads auth.users for true signup counts (profiles has no created_at).
-- p_include_testers = true keeps tester accounts in every aggregate (the admin
-- panel toggle); default false excludes them. Signature changed → drop first.
drop function if exists public.admin_metrics();
drop function if exists public.admin_metrics(boolean);
create or replace function public.admin_metrics(p_include_testers boolean default false)
returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select case when not public.is_superuser() then '{}'::jsonb else jsonb_build_object(
    'users',            (select count(*) from auth.users where (p_include_testers or id not in (select user_id from public.tester_ids()))),
    'new_users_7d',     (select count(*) from auth.users where created_at > now() - interval '7 days' and (p_include_testers or id not in (select user_id from public.tester_ids()))),
    'new_users_30d',    (select count(*) from auth.users where created_at > now() - interval '30 days' and (p_include_testers or id not in (select user_id from public.tester_ids()))),
    'active_users_7d',  (select count(distinct user_id) from public.link_clicks where clicked_at > now() - interval '7 days' and (p_include_testers or user_id not in (select user_id from public.tester_ids()))),
    'selections',       (select count(*) from public.selections where (p_include_testers or user_id not in (select user_id from public.tester_ids()))),
    'owned',            (select count(*) from public.owned where (p_include_testers or user_id not in (select user_id from public.tester_ids()))),
    'conversations',    (select count(*) from public.conversations where (p_include_testers or user_id not in (select user_id from public.tester_ids()))),
    'convos_7d',        (select count(*) from public.conversations where updated_at > now() - interval '7 days' and (p_include_testers or user_id not in (select user_id from public.tester_ids()))),
    'link_clicks',      (select count(*) from public.link_clicks where (p_include_testers or user_id not in (select user_id from public.tester_ids()))),
    'clicks_7d',        (select count(*) from public.link_clicks where clicked_at > now() - interval '7 days' and (p_include_testers or user_id not in (select user_id from public.tester_ids()))),
    'friendships',      (select count(*) from public.friend_requests where status = 'accepted' and (p_include_testers or (requester_id not in (select user_id from public.tester_ids()) and addressee_id not in (select user_id from public.tester_ids())))),
    'pending_requests', (select count(*) from public.friend_requests where status = 'pending' and (p_include_testers or (requester_id not in (select user_id from public.tester_ids()) and addressee_id not in (select user_id from public.tester_ids())))),
    'lists',            (select count(*) from public.lists where (p_include_testers or user_id not in (select user_id from public.tester_ids()))),
    'public_lists',     (select count(*) from public.lists where visibility = 'public' and (p_include_testers or user_id not in (select user_id from public.tester_ids()))),
    'polls',            (select count(*) from public.polls where (p_include_testers or owner_id not in (select user_id from public.tester_ids()))),
    'occasions',        (select count(*) from public.occasions where (p_include_testers or user_id not in (select user_id from public.tester_ids()))),
    'gemini_calls',     (select coalesce(sum(count), 0)::int from public.api_call_logs where service = 'gemini'   and (p_include_testers or user_id is null or user_id not in (select user_id from public.tester_ids()))),
    'amazon_calls',     (select coalesce(sum(count), 0)::int from public.api_call_logs where service = 'amazon'   and (p_include_testers or user_id is null or user_id not in (select user_id from public.tester_ids()))),
    'supabase_calls',   (select coalesce(sum(count), 0)::int from public.api_call_logs where service = 'supabase' and (p_include_testers or user_id is null or user_id not in (select user_id from public.tester_ids()))),
    -- Anonymous (not signed-in) usage: rows with user_id null. Sessions are
    -- distinct advisor conversation ids; ai_calls is the raw Gemini call volume.
    -- Independent of p_include_testers (anonymous users are never testers).
    'anon_ai_calls',    (select coalesce(sum(count), 0)::int from public.api_call_logs where service = 'gemini' and user_id is null),
    'anon_sessions',    (select count(distinct conversation_id)::int from public.api_call_logs where service = 'gemini' and user_id is null and conversation_id is not null),
    'anon_sessions_7d', (select count(distinct conversation_id)::int from public.api_call_logs where service = 'gemini' and user_id is null and conversation_id is not null and created_at > now() - interval '7 days')
  ) end;
$$;
grant execute on function public.admin_metrics(boolean) to authenticated;

-- Most popular products across ALL users: saved (selections) + clicked
-- (link_clicks) counts, with one representative snapshot each (superuser only).
-- Signature changed (added `trend`, then a date window) → drop before recreate.
-- saves/clicks are counted within [p_from, p_to] when given (else all-time); the
-- `trend` column stays a rolling last-7-vs-previous-7 days regardless.
drop function if exists public.admin_top_products(int);
drop function if exists public.admin_top_products(int, date, date);
drop function if exists public.admin_top_products(int, date, date, boolean);
create or replace function public.admin_top_products(max_items int default 12, p_from date default null, p_to date default null, p_include_testers boolean default false)
returns table (product_id text, data jsonb, saves int, clicks int, trend numeric)
language sql security definer set search_path = public as $$
  with sav as (
    select product_id, count(*)::int as saves from public.selections
    where (p_from is null or added_at::date >= p_from)
      and (p_to   is null or added_at::date <= p_to)
      and (p_include_testers or user_id not in (select user_id from public.tester_ids()))
    group by product_id
  ),
  clk as (
    select product_id, count(*)::int as clicks from public.link_clicks
    where (p_from is null or clicked_at::date >= p_from)
      and (p_to   is null or clicked_at::date <= p_to)
      and (p_include_testers or user_id not in (select user_id from public.tester_ids()))
    group by product_id
  ),
  ids as (
    select product_id from sav union select product_id from clk
  ),
  -- all signals (a save or a click), with their timestamp, for the trend window
  sig as (
    select product_id, added_at as ts from public.selections
    where (p_include_testers or user_id not in (select user_id from public.tester_ids()))
    union all
    select product_id, clicked_at as ts from public.link_clicks
    where (p_include_testers or user_id not in (select user_id from public.tester_ids()))
  ),
  recent as (
    select product_id, count(*)::int as c from sig
    where ts > now() - interval '7 days' group by product_id
  ),
  prev as (
    select product_id, count(*)::int as c from sig
    where ts <= now() - interval '7 days' and ts > now() - interval '14 days'
    group by product_id
  ),
  rep as (
    -- one representative snapshot per product: the most recent signal
    select distinct on (product_id) product_id, data from (
      select product_id, data, added_at as ts from public.selections
      where (p_include_testers or user_id not in (select user_id from public.tester_ids()))
      union all
      select product_id, data, clicked_at as ts from public.link_clicks
      where (p_include_testers or user_id not in (select user_id from public.tester_ids()))
    ) s order by product_id, ts desc
  )
  select i.product_id, rep.data, coalesce(sav.saves, 0), coalesce(clk.clicks, 0),
    -- 7-day trend: recent vs the previous 7-day window. No prior activity →
    -- +100 % if it appeared this week, else 0.
    case
      when coalesce(prev.c, 0) = 0 then (case when coalesce(recent.c, 0) > 0 then 100 else 0 end)
      else round((coalesce(recent.c, 0) - prev.c)::numeric / prev.c * 100, 1)
    end as trend
  from ids i
  left join sav on sav.product_id = i.product_id
  left join clk on clk.product_id = i.product_id
  left join recent on recent.product_id = i.product_id
  left join prev on prev.product_id = i.product_id
  left join rep on rep.product_id = i.product_id
  where public.is_superuser()
  order by (coalesce(sav.saves, 0) + coalesce(clk.clicks, 0)) desc, rep.data->>'model'
  limit greatest(1, least(max_items, 50));
$$;

-- ── AI usage metering (per-account daily Gemini quota) ─────────────────────
-- One row per user per UTC day, accumulating request count + Gemini token spend
-- (input + output, retry calls included). The server (api/chat.js) reads this
-- before each ask/recommend call to enforce a daily cap, and increments it
-- after. Writes go ONLY through the service-role RPC below, so the counter is
-- tamper-proof: users can read their own row (for the "N requests left" UI) but
-- never write it directly.
create table if not exists public.ai_usage (
  user_id       uuid        not null references auth.users (id) on delete cascade,
  day           date        not null default (now() at time zone 'utc')::date,
  requests      integer     not null default 0,
  input_tokens  bigint      not null default 0,
  output_tokens bigint      not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;

-- Read-only for the owner (display). No insert/update/delete policy → the table
-- is write-locked to everyone except the service role / the RPC below.
drop policy if exists "own ai_usage" on public.ai_usage;
create policy "own ai_usage" on public.ai_usage
  for select
  using (auth.uid() = user_id);

-- Atomic increment (no read-modify-write race). SECURITY DEFINER + explicit
-- user_id so the server can call it with the service-role key. Execute is
-- revoked from anon/authenticated so it can't be invoked from the client to
-- inflate a counter — only the server (service role) may call it.
create or replace function public.increment_ai_usage(p_user uuid, p_in bigint, p_out bigint)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.ai_usage (user_id, day, requests, input_tokens, output_tokens, updated_at)
  values (p_user, (now() at time zone 'utc')::date, 1, greatest(p_in, 0), greatest(p_out, 0), now())
  on conflict (user_id, day) do update
    set requests      = public.ai_usage.requests + 1,
        input_tokens  = public.ai_usage.input_tokens + greatest(p_in, 0),
        output_tokens = public.ai_usage.output_tokens + greatest(p_out, 0),
        updated_at    = now();
$$;

revoke all on function public.increment_ai_usage(uuid, bigint, bigint) from public, anon, authenticated;
grant execute on function public.admin_top_products(int, date, date, boolean) to authenticated;

-- Daily activity series for the admin dashboard charts (superuser only). One row
-- per calendar day over the last `days` days (server tz / UTC), with the day's
-- new signups, distinct active users (a link click that day), conversations
-- touched, Amazon clicks and selections. Empty for non-superusers.
drop function if exists public.admin_daily_series(int);
drop function if exists public.admin_daily_series(int, boolean);
create or replace function public.admin_daily_series(days int default 90, p_include_testers boolean default false)
returns table (d date, new_users int, active_users int, conversations int, link_clicks int, selections int, owned int, gemini_calls int, amazon_calls int, supabase_calls int, anon_sessions int, anon_ai_calls int)
language sql stable security definer set search_path = public, auth as $$
  with span as (
    select generate_series(
      (now() - ((greatest(1, least(days, 365)) - 1) || ' days')::interval)::date,
      now()::date,
      '1 day'
    ) as d
  )
  select s.d,
    (select count(*) from auth.users u where u.created_at::date = s.d and (p_include_testers or u.id not in (select user_id from public.tester_ids())))::int,
    (select count(distinct lc.user_id) from public.link_clicks lc where lc.clicked_at::date = s.d and (p_include_testers or lc.user_id not in (select user_id from public.tester_ids())))::int,
    (select count(*) from public.conversations c where c.updated_at::date = s.d and (p_include_testers or c.user_id not in (select user_id from public.tester_ids())))::int,
    (select count(*) from public.link_clicks lc where lc.clicked_at::date = s.d and (p_include_testers or lc.user_id not in (select user_id from public.tester_ids())))::int,
    (select count(*) from public.selections se where se.added_at::date = s.d and (p_include_testers or se.user_id not in (select user_id from public.tester_ids())))::int,
    (select count(*) from public.owned o where o.added_at::date = s.d and (p_include_testers or o.user_id not in (select user_id from public.tester_ids())))::int,
    (select coalesce(sum(count), 0) from public.api_call_logs l where l.service = 'gemini'   and l.created_at::date = s.d and (p_include_testers or l.user_id is null or l.user_id not in (select user_id from public.tester_ids())))::int,
    (select coalesce(sum(count), 0) from public.api_call_logs l where l.service = 'amazon'   and l.created_at::date = s.d and (p_include_testers or l.user_id is null or l.user_id not in (select user_id from public.tester_ids())))::int,
    (select coalesce(sum(count), 0) from public.api_call_logs l where l.service = 'supabase' and l.created_at::date = s.d and (p_include_testers or l.user_id is null or l.user_id not in (select user_id from public.tester_ids())))::int,
    -- Anonymous (not-signed-in) usage: rows with user_id null. Sessions ≈ distinct
    -- advisor conversation ids; AI calls = gemini generations without an account.
    (select count(distinct l.conversation_id) from public.api_call_logs l where l.service = 'gemini' and l.user_id is null and l.conversation_id is not null and l.created_at::date = s.d)::int,
    (select coalesce(sum(count), 0) from public.api_call_logs l where l.service = 'gemini' and l.user_id is null and l.created_at::date = s.d)::int
  from span s
  where public.is_superuser()
  order by s.d;
$$;
grant execute on function public.admin_daily_series(int, boolean) to authenticated;

-- ── Account deletion (RGPD "right to erasure") ─────────────────────────────
-- A signed-in user permanently deletes their own account. Every user-owned
-- table references auth.users(id) ON DELETE CASCADE (selections, owned,
-- conversations, recipients, profiles, lists, occasions, friend_requests,
-- polls/poll_recipients/poll_votes, link_clicks, ai_usage, api_call_logs …), so
-- removing the auth.users row wipes all their data in one shot. Deleting from
-- the auth schema needs elevated rights → SECURITY DEFINER (function owned by
-- the postgres role, which the Supabase SQL editor uses). We re-resolve the
-- caller from auth.uid() and only ever delete that row, so a user can never
-- delete anyone but themselves.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = me;
end;
$$;
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
