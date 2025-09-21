import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL!;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// IMPORTANT: create once, at module scope, so the same client (and session) is reused.
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,         // default is true; keep explicit for clarity
    autoRefreshToken: true,
    storage: window.localStorage, // make it explicit for Vite SPA
  },
});