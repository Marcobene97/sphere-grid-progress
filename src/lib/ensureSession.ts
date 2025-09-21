import { supabase } from './supabase';

export async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user;

  // anonymous sign-in to get a user id for RLS and persistence
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}