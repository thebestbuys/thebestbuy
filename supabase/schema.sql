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
  updated_at   timestamptz not null default now()
);

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
-- representative snapshot (most recent) per product, that friend count, plus a
-- small array of the friends' public identities (name + avatar) so the UI can
-- show who's behind it. Return signature changed → drop before recreate.
drop function if exists public.circle_trending(int);
create or replace function public.circle_trending(max_items int default 12)
returns table (product_id text, data jsonb, friend_count int, friends jsonb)
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
    select s.user_id, s.product_id, s.data, s.added_at as ts
    from public.selections s
    join consenting c on c.fid = s.user_id
    union all
    select lc.user_id, lc.product_id, lc.data, lc.clicked_at as ts
    from public.link_clicks lc
    join consenting c on c.fid = lc.user_id
  ),
  agg as (
    -- distinct-friend count per product (DISTINCT isn't allowed in a window fn)
    select product_id, count(distinct user_id) as friend_count
    from signals
    group by product_id
  ),
  people as (
    -- distinct friend identities per product (one row per friend), most recent first
    select distinct on (s.product_id, s.user_id)
      s.product_id, s.user_id, p.display_name, p.avatar_url, s.ts
    from signals s
    join public.profiles p on p.user_id = s.user_id
    order by s.product_id, s.user_id, s.ts desc
  ),
  fr_list as (
    -- up to 6 friends per product as a jsonb array {id,name,avatar}
    select product_id,
      jsonb_agg(jsonb_build_object('id', user_id, 'name', display_name, 'avatar', avatar_url)
                order by ts desc) filter (where rn <= 6) as friends
    from (select *, row_number() over (partition by product_id order by ts desc) as rn from people) ranked
    group by product_id
  ),
  rep as (
    -- one representative snapshot per product: the most recent signal
    select distinct on (product_id) product_id, data, ts
    from signals
    order by product_id, ts desc
  )
  select a.product_id, r.data, a.friend_count::int, coalesce(fl.friends, '[]'::jsonb)
  from agg a
  join rep r on r.product_id = a.product_id
  left join fr_list fl on fl.product_id = a.product_id
  order by a.friend_count desc, r.ts desc
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

-- Every registered user (superuser only). Mirrors list_friends' shape (+ email)
-- so the Admin panel can reuse the friend-row UI. Empty for non-superusers.
create or replace function public.admin_list_users()
returns table (user_id uuid, display_name text, avatar_url text, email text, wishlist_count integer)
language sql security definer set search_path = public as $$
  select p.user_id, p.display_name, p.avatar_url, p.email,
    (select count(*)::int from public.selections s where s.user_id = p.user_id) as wishlist_count
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

-- A user's conversation history (superuser only).
create or replace function public.admin_user_conversations(target uuid)
returns table (id text, data jsonb, updated_at timestamptz)
language sql security definer set search_path = public as $$
  select c.id, c.data, c.updated_at from public.conversations c
  where public.is_superuser() and c.user_id = target
  order by c.updated_at desc;
$$;
grant execute on function public.admin_user_conversations(uuid) to authenticated;

-- ── Admin metrics (BestBuys dashboard, superuser only) ──────────────────────
-- One round-trip of aggregate database stats. Returns {} for non-superusers.
-- Reads auth.users for true signup counts (profiles has no created_at).
create or replace function public.admin_metrics()
returns jsonb
language sql stable security definer set search_path = public, auth as $$
  select case when not public.is_superuser() then '{}'::jsonb else jsonb_build_object(
    'users',            (select count(*) from auth.users),
    'new_users_7d',     (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'new_users_30d',    (select count(*) from auth.users where created_at > now() - interval '30 days'),
    'active_users_7d',  (select count(distinct user_id) from public.link_clicks where clicked_at > now() - interval '7 days'),
    'selections',       (select count(*) from public.selections),
    'owned',            (select count(*) from public.owned),
    'conversations',    (select count(*) from public.conversations),
    'convos_7d',        (select count(*) from public.conversations where updated_at > now() - interval '7 days'),
    'link_clicks',      (select count(*) from public.link_clicks),
    'clicks_7d',        (select count(*) from public.link_clicks where clicked_at > now() - interval '7 days'),
    'friendships',      (select count(*) from public.friend_requests where status = 'accepted'),
    'pending_requests', (select count(*) from public.friend_requests where status = 'pending'),
    'lists',            (select count(*) from public.lists),
    'public_lists',     (select count(*) from public.lists where visibility = 'public'),
    'polls',            (select count(*) from public.polls),
    'occasions',        (select count(*) from public.occasions)
  ) end;
$$;
grant execute on function public.admin_metrics() to authenticated;

-- Most popular products across ALL users: saved (selections) + clicked
-- (link_clicks) counts, with one representative snapshot each (superuser only).
create or replace function public.admin_top_products(max_items int default 12)
returns table (product_id text, data jsonb, saves int, clicks int)
language sql security definer set search_path = public as $$
  with sav as (
    select product_id, count(*)::int as saves from public.selections group by product_id
  ),
  clk as (
    select product_id, count(*)::int as clicks from public.link_clicks group by product_id
  ),
  ids as (
    select product_id from sav union select product_id from clk
  ),
  rep as (
    -- one representative snapshot per product: the most recent signal
    select distinct on (product_id) product_id, data from (
      select product_id, data, added_at as ts from public.selections
      union all
      select product_id, data, clicked_at as ts from public.link_clicks
    ) s order by product_id, ts desc
  )
  select i.product_id, rep.data, coalesce(sav.saves, 0), coalesce(clk.clicks, 0)
  from ids i
  left join sav on sav.product_id = i.product_id
  left join clk on clk.product_id = i.product_id
  left join rep on rep.product_id = i.product_id
  where public.is_superuser()
  order by (coalesce(sav.saves, 0) + coalesce(clk.clicks, 0)) desc, rep.data->>'model'
  limit greatest(1, least(max_items, 50));
$$;
grant execute on function public.admin_top_products(int) to authenticated;
