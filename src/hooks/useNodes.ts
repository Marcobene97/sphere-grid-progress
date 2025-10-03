import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useNodes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nodes')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const updateNode = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('nodes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
    onError: (error) => {
      toast({ title: 'Failed to update node', description: error.message, variant: 'destructive' });
    },
  });

  return {
    nodes: query.data || [],
    isLoading: query.isLoading,
    updateNode: updateNode.mutate,
  };
}
