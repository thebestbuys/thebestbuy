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
  created_at timestamptz not null default now()
);
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

-- Create a poll and address it to accepted friends only.
create or replace function public.create_poll(p_id text, p_items jsonb, p_recipients uuid[])
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.polls (id, owner_id, items) values (p_id, auth.uid(), p_items);
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
grant execute on function public.create_poll(text, jsonb, uuid[]) to authenticated;

-- Polls addressed to me (with the asker's identity + my current vote).
create or replace function public.incoming_polls()
returns table (id text, owner_id uuid, owner_name text, owner_avatar text, items jsonb, created_at timestamptz, my_vote integer)
language sql security definer set search_path = public as $$
  select pl.id, pl.owner_id, pr.display_name, pr.avatar_url, pl.items, pl.created_at,
    (select v.choice from public.poll_votes v where v.poll_id = pl.id and v.voter_id = auth.uid())
  from public.polls pl
  join public.poll_recipients prr on prr.poll_id = pl.id and prr.recipient_id = auth.uid()
  join public.profiles pr on pr.user_id = pl.owner_id
  order by pl.created_at desc;
$$;
grant execute on function public.incoming_polls() to authenticated;

-- My polls with per-voter results.
create or replace function public.outgoing_polls()
returns table (id text, items jsonb, created_at timestamptz, votes jsonb)
language sql security definer set search_path = public as $$
  select pl.id, pl.items, pl.created_at,
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
create index if not exists conversations_updated_idx
  on public.conversations (user_id, updated_at desc);
create index if not exists recipients_added_idx
  on public.recipients (user_id, added_at desc);
