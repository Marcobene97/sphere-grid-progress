import { supabase } from './supabase';
import { ensureSession } from './ensureSession';

export async function awardXP(amount: number, source = 'session', meta?: any) {
  const user = await ensureSession();
  const { error } = await supabase.from('xp_events').insert({
    user_id: user.id, 
    amount, 
    source, 
    meta
  });
  if (error) throw error;
}

export async function loadTotalXP(): Promise<number> {
  const user = await ensureSession();
  const { data, error } = await supabase.rpc('get_user_total_xp', { user_uuid: user.id });
  if (error) throw error;
  return data ?? 0;
}