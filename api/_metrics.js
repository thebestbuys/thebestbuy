// Backend call-volume counters (Gemini / Amazon / Supabase) for the admin
// dashboard. Best-effort: a logging failure must never affect the real
// request, and writes go through the service role directly (api_call_logs
// has no RLS policy, so anon/authenticated get neither read nor write).
const SUPA_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPA_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
    await c.from('api_call_logs').insert({ service, count });
  } catch { /* analytics is best-effort */ }
}
