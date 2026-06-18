// Remote CRUD for selections and conversations, backed by Supabase.
// All access is scoped to the signed-in user by Row Level Security
// (policies filter on user_id = auth.uid()), so we never trust the client.
//
// Dependency layering (no cycles): supabase.js  ←  cloud.js  ←  {selections,
// history}.js  ←  cloudSync.js. Mutations in the local stores call into here
// best-effort; cloudSync orchestrates the pull/merge.
import { supabase } from './supabase.js';

// Cached synchronously so fire-and-forget writes from the local stores can
// cheaply check "are we signed in to the cloud?" without an async hop.
let session = null;

export function setCloudSession(s) {
  session = s || null;
}

export function hasCloudSession() {
  return Boolean(supabase && session);
}

function uid() {
  return session?.user?.id || null;
}

// Current access token, sent to /api/chat so the server can resolve a friend's
// (private) profile on the user's behalf. Null when not signed in to the cloud.
export function getAccessToken() {
  return session?.access_token || null;
}

// ─── Selections ──────────────────────────────────────────────────────────
export async function cloudUpsertSelection(item) {
  if (!hasCloudSession() || item?.id == null) return;
  await supabase.from('selections').upsert(
    {
      user_id: uid(),
      product_id: String(item.id),
      data: item,
      added_at: new Date(item.addedAt || Date.now()).toISOString(),
    },
    { onConflict: 'user_id,product_id' },
  );
}

export async function cloudDeleteSelection(productId) {
  if (!hasCloudSession() || productId == null) return;
  await supabase
    .from('selections')
    .delete()
    .eq('user_id', uid())
    .eq('product_id', String(productId));
}

export async function cloudClearSelections() {
  if (!hasCloudSession()) return;
  await supabase.from('selections').delete().eq('user_id', uid());
}

export async function cloudFetchSelections() {
  if (!hasCloudSession()) return null;
  const { data, error } = await supabase
    .from('selections')
    .select('data, added_at')
    .order('added_at', { ascending: false });
  if (error) return null;
  return (data || []).map((r) => r.data).filter(Boolean);
}

// ─── Recipients (saved gift profiles) ──────────────────────────────────────
export async function cloudUpsertRecipient(item) {
  if (!hasCloudSession() || item?.id == null) return;
  await supabase.from('recipients').upsert(
    {
      user_id: uid(),
      recipient_id: String(item.id),
      data: item,
      added_at: new Date(item.addedAt || Date.now()).toISOString(),
    },
    { onConflict: 'user_id,recipient_id' },
  );
}

export async function cloudDeleteRecipient(recipientId) {
  if (!hasCloudSession() || recipientId == null) return;
  await supabase
    .from('recipients')
    .delete()
    .eq('user_id', uid())
    .eq('recipient_id', String(recipientId));
}

export async function cloudClearRecipients() {
  if (!hasCloudSession()) return;
  await supabase.from('recipients').delete().eq('user_id', uid());
}

export async function cloudFetchRecipients() {
  if (!hasCloudSession()) return null;
  const { data, error } = await supabase
    .from('recipients')
    .select('data, added_at')
    .order('added_at', { ascending: false });
  if (error) return null;
  return (data || []).map((r) => r.data).filter(Boolean);
}

// ─── Profile (cloud "Mon profil" + public identity) ────────────────────────
// PostgREST upserts only update the columns present in the payload on conflict,
// so identity and data can be written independently without clobbering.
export async function cloudUpsertProfileIdentity({ displayName, avatarUrl, email }) {
  if (!hasCloudSession()) return;
  await supabase.from('profiles').upsert(
    {
      user_id: uid(),
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
      email: email || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

export async function cloudUpsertProfileData(data) {
  if (!hasCloudSession()) return;
  await supabase.from('profiles').upsert(
    { user_id: uid(), data: data || {}, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  );
}

export async function cloudFetchProfileData() {
  if (!hasCloudSession()) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('data')
    .eq('user_id', uid())
    .maybeSingle();
  if (error) return null;
  return data?.data ?? null;
}

// ─── Polls (ask a friend's opinion) ─────────────────────────────────────────
export async function createPoll(items, recipientIds) {
  if (!hasCloudSession() || !items?.length || !recipientIds?.length) return { ok: false };
  const id = `poll_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await supabase.rpc('create_poll', {
    p_id: id,
    p_items: items,
    p_recipients: recipientIds,
  });
  return { ok: !error, id, error };
}

export async function incomingPolls() {
  if (!hasCloudSession()) return [];
  const { data, error } = await supabase.rpc('incoming_polls');
  if (error) return [];
  return data || [];
}

export async function outgoingPolls() {
  if (!hasCloudSession()) return [];
  const { data, error } = await supabase.rpc('outgoing_polls');
  if (error) return [];
  return data || [];
}

export async function votePoll(pollId, choice) {
  if (!hasCloudSession() || !pollId) return { ok: false };
  const { error } = await supabase.rpc('vote_poll', { p_id: pollId, p_choice: choice });
  return { ok: !error, error };
}

// ─── Occasions (reminders) ──────────────────────────────────────────────────
export async function cloudUpsertOccasion(o) {
  if (!hasCloudSession() || !o?.id) return;
  await supabase.from('occasions').upsert(
    {
      id: String(o.id),
      user_id: uid(),
      label: o.label || '',
      date: o.date || '',
      recurring: o.recurring !== false,
    },
    { onConflict: 'id' },
  );
}

export async function cloudDeleteOccasion(id) {
  if (!hasCloudSession() || id == null) return;
  await supabase.from('occasions').delete().eq('user_id', uid()).eq('id', String(id));
}

export async function cloudFetchOccasions() {
  if (!hasCloudSession()) return null;
  const { data, error } = await supabase
    .from('occasions')
    .select('id, label, date, recurring')
    .order('created_at', { ascending: true });
  if (error) return null;
  return data || [];
}

// ─── Lists (named collections) ──────────────────────────────────────────────
export async function cloudUpsertList(list) {
  if (!hasCloudSession() || !list?.id) return;
  await supabase.from('lists').upsert(
    {
      id: String(list.id),
      user_id: uid(),
      name: list.name || '',
      visibility: list.visibility === 'public' ? 'public' : 'private',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
}

export async function cloudDeleteList(listId) {
  if (!hasCloudSession() || listId == null) return;
  await supabase.from('lists').delete().eq('user_id', uid()).eq('id', String(listId));
}

export async function cloudFetchLists() {
  if (!hasCloudSession()) return null;
  const { data, error } = await supabase
    .from('lists')
    .select('id, name, visibility, created_at')
    .order('created_at', { ascending: true });
  if (error) return null;
  return data || [];
}

// ─── Shared lists (short share links) ──────────────────────────────────────
function shortId() {
  return (
    Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 4)
  );
}

// Store a share payload under a short id; returns the id (or null when not
// signed in / on failure, so callers can fall back to an inline link).
export async function createShareLink(payload) {
  if (!hasCloudSession()) return null;
  for (let i = 0; i < 3; i++) {
    const id = shortId();
    const { error } = await supabase.from('shared_lists').insert({ id, data: payload });
    if (!error) return id;
    if (error.code !== '23505') return null; // 23505 = unique violation → retry
  }
  return null;
}

// Public read (works for anonymous visitors via the "read shared lists" policy).
export async function fetchSharedList(id) {
  if (!supabase || !id) return null;
  const { data, error } = await supabase
    .from('shared_lists')
    .select('data')
    .eq('id', id)
    .maybeSingle();
  if (error) return null;
  return data?.data ?? null;
}

// ─── Friends (social graph) ────────────────────────────────────────────────
export async function searchUsers(query) {
  const q = String(query || '').trim();
  if (!hasCloudSession() || q.length < 2) return [];
  const { data, error } = await supabase.rpc('search_users', { q });
  if (error) return [];
  return data || [];
}

export async function sendFriendRequest(addresseeId) {
  if (!hasCloudSession() || !addresseeId) return { ok: false };
  const { error } = await supabase
    .from('friend_requests')
    .insert({ requester_id: uid(), addressee_id: addresseeId, status: 'pending' });
  return { ok: !error, error };
}

export async function listIncomingRequests() {
  if (!hasCloudSession()) return [];
  const { data, error } = await supabase.rpc('list_incoming_requests');
  if (error) return [];
  return data || [];
}

export async function listFriends() {
  if (!hasCloudSession()) return [];
  const { data, error } = await supabase.rpc('list_friends');
  if (error) return [];
  return data || [];
}

// A friend's public lists (id, name, item_count) — only if you're friends.
export async function friendPublicLists(friendId) {
  if (!hasCloudSession() || !friendId) return [];
  const { data, error } = await supabase.rpc('friend_public_lists', { friend: friendId });
  if (error) return [];
  return data || [];
}

// Product snapshots of a friend's public list.
export async function publicListItems(listId) {
  if (!hasCloudSession() || !listId) return [];
  const { data, error } = await supabase.rpc('public_list_items', { list: listId });
  if (error) return [];
  return (data || []).map((r) => r.data).filter(Boolean);
}

// Remove an existing friendship (delete the row in either direction). RLS only
// lets a user delete rows that involve them.
export async function removeFriend(friendUserId) {
  if (!hasCloudSession() || !friendUserId) return { ok: false };
  const me = uid();
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .or(
      `and(requester_id.eq.${me},addressee_id.eq.${friendUserId}),` +
        `and(requester_id.eq.${friendUserId},addressee_id.eq.${me})`,
    );
  return { ok: !error, error };
}

// Accept a request (status -> accepted) or decline/cancel it (delete the row).
export async function respondFriendRequest(requestId, accept) {
  if (!hasCloudSession() || !requestId) return { ok: false };
  if (accept) {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId);
    return { ok: !error, error };
  }
  const { error } = await supabase.from('friend_requests').delete().eq('id', requestId);
  return { ok: !error, error };
}

// ─── Conversations ───────────────────────────────────────────────────────
export async function cloudUpsertConversation(convo) {
  if (!hasCloudSession() || !convo?.id) return;
  await supabase.from('conversations').upsert(
    {
      user_id: uid(),
      id: String(convo.id),
      data: convo,
      updated_at: new Date(convo.updatedAt || Date.now()).toISOString(),
    },
    { onConflict: 'user_id,id' },
  );
}

export async function cloudDeleteConversation(id) {
  if (!hasCloudSession() || id == null) return;
  await supabase
    .from('conversations')
    .delete()
    .eq('user_id', uid())
    .eq('id', String(id));
}

export async function cloudClearConversations() {
  if (!hasCloudSession()) return;
  await supabase.from('conversations').delete().eq('user_id', uid());
}

export async function cloudFetchConversations() {
  if (!hasCloudSession()) return null;
  const { data, error } = await supabase
    .from('conversations')
    .select('data, updated_at')
    .order('updated_at', { ascending: false });
  if (error) return null;
  return (data || []).map((r) => r.data).filter(Boolean);
}
