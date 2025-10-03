import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useTasks(nodeId?: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tasks', nodeId],
    queryFn: async () => {
      let q = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (nodeId) {
        q = q.eq('node_id', nodeId);
      }
      
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: any) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task created' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create task', description: error.message, variant: 'destructive' });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast({ title: 'Failed to update task', description: error.message, variant: 'destructive' });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task deleted' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete task', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    createTask: createTask.mutate,
    updateTask: updateTask.mutate,
    deleteTask: deleteTask.mutate,
  };
}
