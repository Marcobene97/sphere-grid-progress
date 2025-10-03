import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useInbox() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['inbox'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('processed', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addItem = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('inbox_items')
        .insert({ content })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      toast({ title: 'Captured to inbox' });
    },
    onError: (error) => {
      toast({ title: 'Failed to capture', description: error.message, variant: 'destructive' });
    },
  });

  const markProcessed = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inbox_items')
        .update({ processed: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inbox_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    addItem: addItem.mutate,
    markProcessed: markProcessed.mutate,
    deleteItem: deleteItem.mutate,
  };
}
