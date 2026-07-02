// Backend call-volume counters (Gemini / Amazon / Supabase) for the admin
// dashboard. Best-effort: a logging failure must never affect the real
// request, and writes go through the service role directly (api_call_logs
// has no RLS policy, so anon/authenticated get neither read nor write).
import { AsyncLocalStorage } from 'node:async_hooks';

const SUPA_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Per-request signed-in user id, so logged API calls can be attributed (and
// tester accounts excluded from the dashboard's API-volume stats). The handler
// seeds it once the token is verified; logApiCalls() reads it. Best-effort:
// when unset (anonymous / suggestions), calls log with user_id = null.
export const userContext = new AsyncLocalStorage();
export function setRequestUser(userId) {
  const cur = userContext.getStore() || {};
  userContext.enterWith({ ...cur, userId: userId || null });
}
// Anonymous-usage tracking: the conversation id groups a visitor's advisor
// session, so counting distinct anon conversation ids ≈ distinct anonymous
// sessions in the dashboard. Best-effort; null for suggestions / non-advisor.
export function setRequestConversation(conversationId) {
  const cur = userContext.getStore() || {};
  userContext.enterWith({ ...cur, conversationId: conversationId || null });
}

let _client; // undefined = not yet resolved, null = unavailable
async function adminClient() {
  if (_client !== undefined) return _client;
  if (!SUPA_URL || !SUPA_SERVICE) { _client = null; return _client; }
  const { createClient } = await import('@supabase/supabase-js');
  _client = createClient(SUPA_URL, SUPA_SERVICE, { auth: { persistSession: false } });
  return _client;
}

// Records `count` calls to `service` ('gemini' | 'amazon' | 'supabase') as one
// row. Callers batch their own counters (e.g. all the Supabase reads made
// during one /api/chat request) so this stays a single extra round-trip
// instead of one per underlying call.
export async function logApiCalls(service, count = 1) {
  if (!count) return;
  try {
    const c = await adminClient();
    if (!c) return;
    const store = userContext.getStore() || {};
    await c.from('api_call_logs').insert({
      service,
      count,
      user_id: store.userId ?? null,
      conversation_id: store.conversationId ?? null,
    });
  } catch { /* analytics is best-effort */ }
}
