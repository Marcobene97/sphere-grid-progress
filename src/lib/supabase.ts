import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration - using direct values as per Lovable guidelines
const supabaseUrl = 'https://bujbbvcexwscnhgrcezn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1amJidmNleHdzY25oZ3JjZXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MzA1NjksImV4cCI6MjA3MzEwNjU2OX0.Wt9jqx64hYBr9apVpYy47QZiCio3rEwI8raY55x8hoY';

export function envCheck() {
  return 'ok';
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
