import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, TestTube, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NodeCreationTestProps {
  onDataRefresh: () => void;
}

export const NodeCreationTest: React.FC<NodeCreationTestProps> = ({ onDataRefresh }) => {
  const { toast } = useToast();

  const createTestNodes = async () => {
    try {
      const testNodes = [
        {
          title: 'Programming Mastery',
          description: 'Core programming and software development skills',
          domain: 'programming',
          goal_type: 'project',
          position_x: 400,
          position_y: 300,
          status: 'available' as const,
          progress: 25,
          metadata: { color: '#3b82f6', xp: 150 }
        },
        {
          title: 'Daily Fitness',
          description: 'Regular exercise and physical health maintenance',
          domain: 'health',
          goal_type: 'habit',
          position_x: 250,
          position_y: 200,
          status: 'available' as const,
          progress: 60,
          metadata: { color: '#ef4444', xp: 300 }
        },
        {
          title: 'Financial Planning',
          description: 'Budget management and investment strategies',
          domain: 'finance',
          goal_type: 'project',
          position_x: 550,
          position_y: 400,
          status: 'available' as const,
          progress: 40,
          metadata: { color: '#22c55e', xp: 200 }
        }
      ];

      console.log('[NodeTest] Creating test nodes:', testNodes);

      const { data: createdNodes, error } = await supabase
        .from('nodes')
        .insert(testNodes)
        .select();

      if (error) {
        console.error('[NodeTest] Error creating nodes:', error);
        throw error;
      }

      console.log('[NodeTest] Successfully created nodes:', createdNodes);

      // Also create some test tasks
      const testTasks = [
        {
          title: 'Complete React Tutorial',
          description: 'Finish the advanced React hooks tutorial series',
          category: 'programming' as const,
          difficulty: 'intermediate' as const,
          priority: 4,
          estimated_time: 90,
          context: 'desk',
          energy: 'medium',
          value_score: 4,
          node_id: createdNodes?.[0]?.id
        },
        {
          title: '30-minute Morning Workout',
          description: 'High-intensity interval training session',
          category: 'health' as const,
          difficulty: 'basic' as const,
          priority: 5,
          estimated_time: 30,
          context: 'gym',
          energy: 'high',
          value_score: 5,
          node_id: createdNodes?.[1]?.id
        }
      ];

      const { data: createdTasks, error: taskError } = await supabase
        .from('tasks')
        .insert(testTasks)
        .select();

      if (taskError) {
        console.error('[NodeTest] Error creating tasks:', taskError);
      } else {
        console.log('[NodeTest] Successfully created tasks:', createdTasks);
      }

      toast({
        title: "Test Data Created!",
        description: `Created ${createdNodes?.length || 0} nodes and ${createdTasks?.length || 0} tasks`,
      });

      onDataRefresh();
    } catch (error) {
      console.error('Test creation error:', error);
      toast({
        title: "Test Creation Failed",
        description: String(error),
        variant: "destructive"
      });
    }
  };

  const clearAllData = async () => {
    try {
      // Delete tasks first (due to foreign key constraints)
      await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('nodes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('day_plan_slots').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('subtasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast({
        title: "Data Cleared!",
        description: "All test data has been removed",
      });

      onDataRefresh();
    } catch (error) {
      console.error('Clear data error:', error);
      toast({
        title: "Clear Failed",
        description: String(error),
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Development Tools
          <Badge variant="outline" className="bg-orange-100">
            Testing
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={createTestNodes}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Test Data
          </Button>
          
          <Button 
            onClick={clearAllData}
            variant="destructive"
          >
            <Database className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground bg-orange-100/50 p-2 rounded">
          <strong>Test Data:</strong> Creates 3 sample nodes (Programming, Fitness, Finance) with connections and 2 sample tasks to verify the sphere grid rendering.
        </div>
      </CardContent>
    </Card>
  );
};