import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('[Config] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY (Preview/Prod envs).');
}

const storage =
  typeof window !== 'undefined' && 'localStorage' in window
    ? window.localStorage
    : undefined;

let client: SupabaseClient | null = null;

export const supabase = (() => {
  if (!client) {
    client = createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage,
      },
    });
  }

  return client;
})();
