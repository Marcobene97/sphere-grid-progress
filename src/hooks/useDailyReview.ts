import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function useDailyReview(date: Date = new Date()) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const dateStr = format(date, 'yyyy-MM-dd');

  const query = useQuery({
    queryKey: ['daily_review', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_reviews')
        .select('*')
        .eq('review_date', dateStr)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const saveReview = useMutation({
    mutationFn: async (review: any) => {
      const { data, error } = await supabase
        .from('daily_reviews')
        .upsert({ ...review, review_date: dateStr })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_review', dateStr] });
      toast({ title: 'Daily review saved' });
    },
    onError: (error) => {
      toast({ title: 'Failed to save review', description: error.message, variant: 'destructive' });
    },
  });

  return {
    review: query.data,
    isLoading: query.isLoading,
    saveReview: saveReview.mutate,
  };
}
