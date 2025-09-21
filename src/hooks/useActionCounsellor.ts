import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useActionCounsellor = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const breakdownTask = useCallback(async (taskId: string, nodeId?: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('action-counsellor', {
        body: { 
          action: 'breakdown_task',
          taskId,
          nodeId
        }
      });

      if (error) throw error;

      toast({
        title: "Task Breakdown Complete!",
        description: `Generated ${data.subtasks.length} subtasks (${data.totalMinutes} minutes total).`,
      });

      return data;
    } catch (error) {
      console.error('Failed to breakdown task:', error);
      toast({
        title: "Breakdown Failed",
        description: "Failed to generate task breakdown. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const buildDayPlan = useCallback(async (date: string, constraints?: any) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('action-counsellor', {
        body: { 
          action: 'build_day_plan',
          date,
          constraints: constraints || {
            dayStart: '06:00',
            dayEnd: '19:00',
            sprintDuration: 45,
            breakDuration: 15
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Day Plan Generated!",
        description: `Created ${data.slotsCreated} time slots for ${new Date(date).toLocaleDateString()}.`,
      });

      return data;
    } catch (error) {
      console.error('Failed to build day plan:', error);
      toast({
        title: "Planning Failed", 
        description: "Failed to generate day plan. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  const seedMindmap = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('action-counsellor', {
        body: { 
          action: 'seed_mindmap'
        }
      });

      if (error) throw error;

      toast({
        title: "Mindmap Seeded!",
        description: `Created ${data.nodesCreated} nodes from your mind-map structure.`,
      });

      return data;
    } catch (error) {
      console.error('Failed to seed mindmap:', error);
      toast({
        title: "Seeding Failed",
        description: "Failed to seed mindmap. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast]);

  return {
    isGenerating,
    breakdownTask,
    buildDayPlan,
    seedMindmap
  };
};