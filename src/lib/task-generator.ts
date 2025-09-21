import { supabase } from '@/integrations/supabase/client';

export async function generateSubtasks(description: string) {
  const { data, error } = await supabase.functions.invoke('task-generator', {
    body: { description },
  });

  if (error) throw error;
  return data?.subtasks ?? [];
}
