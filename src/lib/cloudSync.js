// Orchestrates cloud <-> local sync for selections and conversations.
//
// Two entry points, deliberately different to keep deletions converging:
//
//  • linkAndSync(userId)  — run ONCE on a fresh interactive sign-in. Pushes the
//    local + anonymous data up (so favorites saved before logging in aren't
//    lost), then pulls the server state down and overwrites the local cache.
//
//  • pullOnly(userId)     — run on session restore / app open. Only pulls the
//    server down and overwrites local. Never pushes, so an item deleted on
//    another device stays deleted (no resurrection from a stale local copy).
//
// While signed in, every mutation already mirrors to the server (see
// selections.js / history.js), so the server is authoritative and pullOnly
// makes every device converge on next open.
import {
  hasCloudSession,
  cloudFetchSelections,
  cloudFetchConversations,
  cloudFetchRecipients,
  cloudFetchProfileData,
  cloudFetchLists,
  cloudFetchOccasions,
  cloudFetchOwned,
  cloudUpsertSelection,
  cloudUpsertConversation,
  cloudUpsertRecipient,
  cloudUpsertProfileData,
  cloudUpsertList,
  cloudUpsertOccasion,
  cloudUpsertOwned,
} from './cloud.js';
import { listSelections, replaceSelections } from './selections.js';
import { listOwned, replaceOwned } from './owned.js';
import { listConversations, replaceConversations } from './history.js';
import { listRecipients, replaceRecipients } from './recipients.js';
import { getProfile, replaceProfile, hasProfile } from './profile.js';
import { listLists, replaceLists } from './lists.js';
import { listOccasions, replaceOccasions } from './occasions.js';

async function pullSelections(userId) {
  const server = await cloudFetchSelections();
  if (server) replaceSelections(userId, server);
}

async function pullConversations(userId) {
  const server = await cloudFetchConversations();
  if (server) replaceConversations(userId, server);
}

async function pullRecipients(userId) {
  const server = await cloudFetchRecipients();
  if (server) replaceRecipients(userId, server);
}

async function pullProfile(userId) {
  const server = await cloudFetchProfileData();
  if (server) replaceProfile(userId, server);
}

async function pullLists(userId) {
  const server = await cloudFetchLists();
  if (server) replaceLists(userId, server);
}

async function pullOccasions(userId) {
  const server = await cloudFetchOccasions();
  if (server) replaceOccasions(userId, server.map((o) => ({ ...o, recurring: o.recurring !== false })));
}

async function pullOwned(userId) {
  const server = await cloudFetchOwned();
  if (server) replaceOwned(userId, server);
}

export async function pullOnly(userId) {
  if (!hasCloudSession()) return;
  await Promise.all([
    pullSelections(userId),
    pullConversations(userId),
    pullRecipients(userId),
    pullProfile(userId),
    pullLists(userId),
    pullOccasions(userId),
    pullOwned(userId),
  ]);
}

export async function linkAndSync(userId) {
  if (!hasCloudSession()) return;

  // 1. Merge up ONLY the anonymous bucket — data created while logged out, which
  //    the server doesn't have yet. We deliberately do NOT push the per-user
  //    bucket: it's just a local cache of the server, and re-uploading it would
  //    RESURRECT items deleted on another device (the per-user cache here may be
  //    stale because this device's session lapsed and pullOnly never refreshed
  //    it). The server is authoritative for account data; step 2 pulls it down.
  //    On a first-ever sign-in the per-user bucket is empty anyway, so nothing
  //    legitimate is lost.
  const localSel = dedupeById(listSelections(null));
  for (const item of localSel) {
    await cloudUpsertSelection(item).catch(() => {});
  }
  const localConv = dedupeById(listConversations(null));
  for (const convo of localConv) {
    await cloudUpsertConversation(convo).catch(() => {});
  }
  const localRec = dedupeById(listRecipients(null));
  for (const rec of localRec) {
    await cloudUpsertRecipient(rec).catch(() => {});
  }
  // Push the anonymous profile up only (a profile edited while logged out). The
  // per-user profile is a cache and gets overwritten by the pull below.
  if (hasProfile(null)) {
    await cloudUpsertProfileData(getProfile(null)).catch(() => {});
  }
  const localLists = listLists(null);
  for (const l of localLists) {
    await cloudUpsertList(l).catch(() => {});
  }
  const localOccasions = listOccasions(null);
  for (const o of localOccasions) {
    await cloudUpsertOccasion(o).catch(() => {});
  }
  const localOwned = dedupeById(listOwned(null));
  for (const item of localOwned) {
    await cloudUpsertOwned(item).catch(() => {});
  }

  // 2. Pull the merged server state back down, overwriting the local cache.
  await pullOnly(userId);

  // 3. The anonymous bucket has been merged into the account — drop it so it
  //    doesn't re-merge on a future login by a different account.
  clearAnonLocal();
}

function dedupeById(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    if (it?.id == null || seen.has(it.id)) continue;
    seen.add(it.id);
    out.push(it);
  }
  return out;
}

// Clear only the anonymous local buckets, without touching the cloud (the
// signed-in user's cloud session is active, so a cloud-clear would wipe the
// account). We bypass the cloud-aware clear helpers by writing empties for the
// anon key only.
function clearAnonLocal() {
  // replaceSelections/replaceConversations/replaceRecipients are local-only writers.
  replaceSelections(null, []);
  replaceConversations(null, []);
  replaceRecipients(null, []);
  replaceOwned(null, []);
}
