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

// ─── Owned ("Déjà acheté") ─────────────────────────────────────────────────
export async function cloudUpsertOwned(item) {
  if (!hasCloudSession() || item?.id == null) return;
  await supabase.from('owned').upsert(
    {
      user_id: uid(),
      product_id: String(item.id),
      data: item,
      added_at: new Date(item.addedAt || Date.now()).toISOString(),
    },
    { onConflict: 'user_id,product_id' },
  );
}

export async function cloudDeleteOwned(productId) {
  if (!hasCloudSession() || productId == null) return;
  await supabase
    .from('owned')
    .delete()
    .eq('user_id', uid())
    .eq('product_id', String(productId));
}

export async function cloudClearOwned() {
  if (!hasCloudSession()) return;
  await supabase.from('owned').delete().eq('user_id', uid());
}

export async function cloudFetchOwned() {
  if (!hasCloudSession()) return null;
  const { data, error } = await supabase
    .from('owned')
    .select('data, added_at')
    .order('added_at', { ascending: false });
  if (error) return null;
  return (data || []).map((r) => r.data).filter(Boolean);
}

// ─── Link clicks ("Consultés" — products the user clicked through to Amazon)
// link_clicks is an append-only log (see logLinkClick below): the same
// product can have many rows, so we dedupe client-side, keeping the most
// recent click per product_id.
export async function cloudFetchLinkClicks(limit = 200) {
  if (!hasCloudSession()) return null;
  const { data, error } = await supabase
    .from('link_clicks')
    .select('product_id, data, clicked_at')
    .order('clicked_at', { ascending: false })
    .limit(limit);
  if (error) return null;
  const seen = new Set();
  const out = [];
  for (const r of data || []) {
    if (!r?.data || seen.has(r.product_id)) continue;
    seen.add(r.product_id);
    out.push({ ...r.data, clickedAt: r.clicked_at });
  }
  return out;
}

// User-initiated "remove from Consultés" — deletes every row for that
// product (there can be several, one per click) so it doesn't reappear.
export async function cloudDeleteLinkClicks(productId) {
  if (!hasCloudSession() || productId == null) return;
  await supabase
    .from('link_clicks')
    .delete()
    .eq('user_id', uid())
    .eq('product_id', String(productId));
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
export async function createPoll(items, recipientIds, title = '') {
  if (!hasCloudSession() || !items?.length || !recipientIds?.length) return { ok: false };
  const id = `poll_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await supabase.rpc('create_poll', {
    p_id: id,
    p_items: items,
    p_recipients: recipientIds,
    p_title: title?.trim() ? title.trim().slice(0, 120) : null,
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

// Owner deletes one of their own polls ("Mes sondages").
export async function deletePoll(pollId) {
  if (!hasCloudSession() || !pollId) return { ok: false };
  const { error } = await supabase.rpc('delete_poll', { p_id: pollId });
  return { ok: !error, error };
}

// Recipient dismisses a poll they were asked to vote on ("On te demande ton avis").
export async function dismissPoll(pollId) {
  if (!hasCloudSession() || !pollId) return { ok: false };
  const { error } = await supabase.rpc('dismiss_poll', { p_id: pollId });
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

// ─── Account deletion (RGPD) ────────────────────────────────────────────────
// Permanently delete the signed-in user's account and all their server data.
// The delete_account() RPC removes the auth.users row; every user-owned table
// cascades from it. Returns { ok } so the UI can decide whether to also clear
// local data + sign out.
export async function cloudDeleteAccount() {
  if (!hasCloudSession()) return { ok: false };
  const { error } = await supabase.rpc('delete_account');
  return { ok: !error, error };
}

// ─── Superuser ("god mode" / SU) ───────────────────────────────────────────
// The hard-wired admin accounts. This list is used ONLY to decide whether to
// SHOW the Admin entry in the UI — it grants no real privilege. Every admin_*
// RPC below re-checks is_superuser() server-side (resolved from auth.uid()), so
// a tampered client flag returns an empty set. Keep this in sync with the emails
// inside is_superuser() in supabase/schema.sql AND SUPERUSER_EMAILS in
// api/chat.js (AI-quota exemption). All entries must be lowercase.
export const SUPERUSER_EMAILS = ['thebestbuyersclub@gmail.com', 'darknortar@gmail.com'];

export function isSuperuserEmail(email) {
  return SUPERUSER_EMAILS.includes(String(email || '').trim().toLowerCase());
}

// Every registered user (server returns [] unless the caller is the superuser).
export async function adminListUsers() {
  if (!hasCloudSession()) return [];
  const { data, error } = await supabase.rpc('admin_list_users');
  if (error) return [];
  return data || [];
}

// Toggle a user's "tester" flag (superuser only). Tester users are excluded
// from the admin dashboard aggregates. Returns true on success.
export async function adminSetTester(targetId, tester) {
  if (!hasCloudSession() || !targetId) return false;
  const { error } = await supabase.rpc('admin_set_tester', { target: targetId, p_tester: !!tester });
  return !error;
}

// All of a user's lists (private included), with item counts.
export async function adminUserLists(targetId) {
  if (!hasCloudSession() || !targetId) return [];
  const { data, error } = await supabase.rpc('admin_user_lists', { target: targetId });
  if (error) return [];
  return data || [];
}

// Product snapshots of one of a user's lists.
export async function adminListItems(listId) {
  if (!hasCloudSession() || !listId) return [];
  const { data, error } = await supabase.rpc('admin_list_items', { list: listId });
  if (error) return [];
  return (data || []).map((r) => r.data).filter(Boolean);
}

// A user's full wishlist (every selection).
export async function adminUserSelections(targetId) {
  if (!hasCloudSession() || !targetId) return [];
  const { data, error } = await supabase.rpc('admin_user_selections', { target: targetId });
  if (error) return [];
  return (data || []).map((r) => r.data).filter(Boolean);
}

// A user's "Déjà acheté" (owned) products.
export async function adminUserOwned(targetId) {
  if (!hasCloudSession() || !targetId) return [];
  const { data, error } = await supabase.rpc('admin_user_owned', { target: targetId });
  if (error) return [];
  return (data || []).map((r) => r.data).filter(Boolean);
}

// A user's "Consultés" (link clicks), deduped to the most recent click per product.
export async function adminUserClicks(targetId) {
  if (!hasCloudSession() || !targetId) return [];
  const { data, error } = await supabase.rpc('admin_user_clicks', { target: targetId });
  if (error) return [];
  const seen = new Set();
  const out = [];
  for (const r of data || []) {
    if (!r?.data || seen.has(r.product_id)) continue;
    seen.add(r.product_id);
    out.push({ ...r.data, clickedAt: r.clicked_at });
  }
  return out;
}

// A user's profile (public identity + private profile data). {} when none.
export async function adminUserProfile(targetId) {
  if (!hasCloudSession() || !targetId) return {};
  const { data, error } = await supabase.rpc('admin_user_profile', { target: targetId });
  if (error) return {};
  const row = Array.isArray(data) ? data[0] : data;
  return row || {};
}

// A user's conversation history (the saved convo objects).
export async function adminUserConversations(targetId) {
  if (!hasCloudSession() || !targetId) return [];
  const { data, error } = await supabase.rpc('admin_user_conversations', { target: targetId });
  if (error) return [];
  return (data || []).map((r) => r.data).filter(Boolean);
}

// Aggregate database metrics (BestBuys dashboard). {} for non-superusers.
export async function adminMetrics(includeTesters = false) {
  if (!hasCloudSession()) return {};
  const { data, error } = await supabase.rpc('admin_metrics', { p_include_testers: includeTesters });
  if (error) return {};
  return data || {};
}

// Daily activity series for the dashboard charts (superuser only). Returns one
// row per day ({ d, new_users, active_users, conversations, link_clicks,
// selections }); [] for non-superusers / on error.
export async function adminDailySeries(days = 90, includeTesters = false) {
  if (!hasCloudSession()) return [];
  const { data, error } = await supabase.rpc('admin_daily_series', { days, p_include_testers: includeTesters });
  if (error) return [];
  return data || [];
}

// Most popular products (saves + clicks), each with a snapshot. saves/clicks are
// counted within [from, to] (ISO 'YYYY-MM-DD') when given, else all-time.
export async function adminTopProducts(max = 12, from = null, to = null, includeTesters = false) {
  if (!hasCloudSession()) return [];
  const { data, error } = await supabase.rpc('admin_top_products', {
    max_items: max,
    p_from: from,
    p_to: to,
    p_include_testers: includeTesters,
  });
  if (error) return [];
  return (data || [])
    .map((r) => (r?.data ? { ...r.data, saves: r.saves, clicks: r.clicks, trend: r.trend } : null))
    .filter(Boolean);
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

// ─── Trends in my circle ───────────────────────────────────────────────────
// Light product snapshot stored with a click — same shape as a selection (incl.
// amazon_verified, so the trending UI can honour the verified-vs-estimate rules).
function trendingSnapshot(p) {
  return {
    id: p.id,
    brand: p.brand,
    model: p.model,
    price: p.price ?? null,
    image_url: p.image_url || null,
    // Full gallery + descriptive fields so the "Consultés" detail sheet is as
    // complete as a favorite's (specs, why, thumbnails). Mirrors selections.js.
    images: Array.isArray(p.images) ? p.images : [],
    specs: Array.isArray(p.specs) ? p.specs : [],
    why: p.why || null,
    color: p.color || null,
    rating: p.rating ?? null,
    reviews: p.reviews ?? null,
    score: p.score ?? null,
    amazon_url: p.amazon_url || null,
    category: p.category || null,
    amazon_verified: !!p.amazon_verified,
  };
}

// Record an outbound Amazon click as a popularity signal (best-effort).
export async function logLinkClick(product) {
  if (!hasCloudSession() || product?.id == null) return;
  await supabase.from('link_clicks').insert({
    user_id: uid(),
    product_id: String(product.id),
    data: trendingSnapshot(product),
  });
}

// Top products across consenting friends (selections ∪ clicks). Each item is a
// product snapshot with anonymized aggregate signals: `friend_count` (distinct
// friends behind it), `save_count` (distinct friends who favourited it) and
// `view_count` (Amazon views). No friend identities are returned.
export async function circleTrending(max = 12) {
  if (!hasCloudSession()) return [];
  const { data, error } = await supabase.rpc('circle_trending', { max_items: max });
  if (error) return [];
  return (data || [])
    .map((r) =>
      r?.data
        ? {
            ...r.data,
            friend_count: r.friend_count,
            save_count: r.save_count ?? r.friend_count,
            view_count: r.view_count ?? 0,
          }
        : null,
    )
    .filter(Boolean);
}
