import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const viteEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env ?? {} : {};
const nodeEnv = typeof process !== 'undefined' ? process.env ?? {} : {};

const supabaseUrl = viteEnv.VITE_SUPABASE_URL ?? nodeEnv.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY ?? nodeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const envStatus = supabaseUrl && supabaseAnonKey ? 'ok' : 'missing';

export function envCheck() {
  return envStatus;
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[Supabase] Missing Supabase URL or anon key at runtime. Ensure VITE_SUPABASE_* or NEXT_PUBLIC_SUPABASE_* are set.');
}

const storage =
  typeof window !== 'undefined' && 'localStorage' in window
    ? window.localStorage
    : undefined;

let client: SupabaseClient | null = null;

export const supabase = (() => {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage,
      },
    });
  }

  return client;
})();
