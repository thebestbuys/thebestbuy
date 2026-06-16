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
