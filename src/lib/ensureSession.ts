import { supabase } from '@/integrations/supabase/client';

export async function ensureSession() {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('[ensureSession] Session error:', sessionError);
    }
    if (session?.user) return session.user;

    // anonymous sign-in to get a user id for RLS and persistence
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('[ensureSession] Anonymous sign-in error:', error);
      throw error;
    }
    return data.user;
  } catch (error) {
    console.error('[ensureSession] Fatal error:', error);
    throw error;
  }
}