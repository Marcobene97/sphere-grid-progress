import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, ArrowUpDown } from 'lucide-react';

export const AITaskSorter: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [sorting, setSorting] = useState(false);
  const { toast } = useToast();

  const handleSort = async () => {
    setSorting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-task-sorter');

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Tasks Sorted! ✨",
        description: `Automatically prioritized and calculated XP for ${data.count} tasks`,
      });

      onComplete?.();
    } catch (error: any) {
      console.error('AI sorting error:', error);
      toast({
        title: "Sorting Failed",
        description: error.message || "Could not sort tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSorting(false);
    }
  };

  return (
    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Task Optimizer
        </CardTitle>
        <CardDescription>
          Let AI automatically prioritize, estimate time, and calculate XP for all your tasks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleSort} 
          disabled={sorting}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {sorting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort & Calculate XP
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
