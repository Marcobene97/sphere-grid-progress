import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { awardXP } from '@/lib/xp';

export function useSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const startSession = useMutation({
    mutationFn: async (session: { task_id?: string; node_id?: string }) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert(session)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error) => {
      toast({ title: 'Failed to start session', description: error.message, variant: 'destructive' });
    },
  });

  const endSession = useMutation({
    mutationFn: async ({ 
      id, 
      notes, 
      reflection, 
      xpEarned 
    }: { 
      id: string; 
      notes?: string; 
      reflection?: any; 
      xpEarned: number;
    }) => {
      const endedAt = new Date().toISOString();
      const { data: session } = await supabase
        .from('sessions')
        .select('started_at')
        .eq('id', id)
        .single();
      
      const durationMinutes = session 
        ? Math.round((new Date(endedAt).getTime() - new Date(session.started_at).getTime()) / 60000)
        : 0;

      const { data, error } = await supabase
        .from('sessions')
        .update({ 
          ended_at: endedAt, 
          duration_minutes: durationMinutes,
          notes, 
          reflection,
          xp_earned: xpEarned 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;

      // Award XP
      await awardXP(xpEarned, 'session', { sessionId: id, duration: durationMinutes });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['xp_events'] });
      toast({ title: 'Session completed! XP awarded.' });
    },
    onError: (error) => {
      toast({ title: 'Failed to end session', description: error.message, variant: 'destructive' });
    },
  });

  return {
    sessions: query.data || [],
    isLoading: query.isLoading,
    startSession: startSession.mutateAsync,
    endSession: endSession.mutateAsync,
  };
}
