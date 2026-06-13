import { createClient } from '@supabase/supabase-js';

// Supabase is optional: when the env vars are absent the whole cloud-sync
// layer stays inert and the app runs on localStorage only (current behaviour).
const URL = import.meta.env.VITE_SUPABASE_URL || '';
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase =
  URL && ANON
    ? createClient(URL, ANON, {
        auth: { persistSession: true, autoRefreshToken: true },
      })
    : null;

export const isSupabaseConfigured = Boolean(supabase);
