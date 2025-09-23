import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrainDumpInput } from '@/components/BrainDumpInput';
import { SystemOverview } from '@/components/SystemOverview';
import { ProgressConnector } from '@/components/ProgressConnector';
import { UnifiedProgressSystem } from '@/components/UnifiedProgressSystem';
import { QuickActions } from '@/components/QuickActions';
import { NodeSidePanel } from '@/components/NodeSidePanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, Zap, Brain } from 'lucide-react';
import { SphereNode, Task } from '@/types/new-index';
import { aiService } from '@/lib/ai-service';
import { MobileSync } from '@/components/MobileSync';
import { useToast } from '@/hooks/use-toast';

export default function NewIndex() {
  const [user, setUser] = useState<any>(null);
  const [nodes, setNodes] = useState<SphereNode[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<SphereNode | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize auth and load data
    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: anonData } = await supabase.auth.signInAnonymously();
        setUser(anonData.user);
      } else {
        setUser(session.user);
      }
      
      // Load initial data
      await loadAppData();
      setLoading(false);
    };

    initApp();
  }, []);

  const loadAppData = async () => {
    try {
      const { data: nodesData } = await supabase.from('nodes').select('*');
      const { data: tasksData } = await supabase.from('tasks').select('*');
      
      setNodes(nodesData?.map(mapDbNodeToSphereNode) || []);
      setTasks(tasksData?.map(mapDbTaskToTask) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleTasksGenerated = async (generatedTasks: any[], generatedNodes: any[]) => {
    try {
      console.log('[handleTasksGenerated] Creating nodes and tasks:', { generatedNodes, generatedTasks });
      
      // Create nodes first
      if (generatedNodes.length > 0) {
        const nodeInserts = generatedNodes.map(node => ({
          title: node.title,
          description: node.description || '',
          domain: node.domain,
          goal_type: node.goalType,
          position_x: Math.floor(Math.random() * 500),
          position_y: Math.floor(Math.random() * 500),
          metadata: { color: '#22c55e', xp: 0 }
        }));

        console.log('[handleTasksGenerated] Inserting nodes:', nodeInserts);
        
        const { data: createdNodes, error: nodeError } = await supabase
          .from('nodes')
          .insert(nodeInserts)
          .select();

        if (nodeError) {
          console.error('Error creating nodes:', nodeError);
          throw nodeError;
        }
        
        console.log('[handleTasksGenerated] Created nodes:', createdNodes);
      }

      // Create tasks
      if (generatedTasks.length > 0) {
        const taskInserts = generatedTasks.map(task => ({
          title: task.title,
          description: task.description || '',
          category: task.category,
          difficulty: task.difficulty,
          priority: task.priority,
          estimated_time: task.estimatedTime,
          context: task.context,
          energy: task.energy,
          value_score: task.valueScore,
          tags: task.tags || []
        }));

        console.log('[handleTasksGenerated] Inserting tasks:', taskInserts);
        
        const { data: createdTasks, error: taskError } = await supabase
          .from('tasks')
          .insert(taskInserts)
          .select();

        if (taskError) {
          console.error('Error creating tasks:', taskError);
          throw taskError;
        }
        
        console.log('[handleTasksGenerated] Created tasks:', createdTasks);
      }

      // Reload data to show new items
      await loadAppData();
      
      toast({
        title: "Success!",
        description: `Created ${generatedNodes.length} skill nodes and ${generatedTasks.length} tasks`,
      });
      
    } catch (error) {
      console.error('Error creating nodes and tasks:', error);
      toast({
        title: "Error",
        description: "Failed to create nodes and tasks",
        variant: "destructive"
      });
    }
  };

  const handleTaskBreakdown = async (taskId: string) => {
    try {
      await aiService.breakdownTask(taskId);
      toast({
        title: "Task Broken Down!",
        description: "Subtasks have been generated"
      });
    } catch (error) {
      console.error('Error breaking down task:', error);
      toast({
        title: "Error",
        description: "Failed to break down task",
        variant: "destructive"
      });
    }
  };

  const handleNodeUpdate = async (nodeId: string, updates: Partial<SphereNode>) => {
    try {
      const { error } = await supabase
        .from('nodes')
        .update({
          status: updates.status,
          progress: updates.progress,
          time_spent: updates.timeSpent,
        })
        .eq('id', nodeId);

      if (error) throw error;

      setNodes(prev => prev.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ));
    } catch (error) {
      console.error('Error updating node:', error);
      toast({
        title: "Error",
        description: "Failed to update node",
        variant: "destructive"
      });
    }
  };

  const mapDbNodeToSphereNode = (dbNode: any): SphereNode => ({
    id: dbNode.id,
    title: dbNode.title,
    description: dbNode.description || '',
    domain: dbNode.domain,
    goalType: dbNode.goal_type,
    status: dbNode.status,
    position: { x: dbNode.position_x || 0, y: dbNode.position_y || 0 },
    prerequisites: dbNode.prerequisites || [],
    unlocks: dbNode.unlocks || [],
    timeSpent: dbNode.time_spent || 0,
    progress: dbNode.progress || 0,
    metadata: {
      xp: (dbNode.metadata?.xp || 0),
      color: (dbNode.metadata?.color || '#22c55e'),
      ...(dbNode.metadata || {})
    },
    deadline: dbNode.deadline,
    estTotalMinutes: dbNode.est_total_minutes,
    completedAt: dbNode.completed_at,
    masteredAt: dbNode.mastered_at,
  });

  const mapDbTaskToTask = (dbTask: any): Task => ({
    id: dbTask.id,
    title: dbTask.title,
    description: dbTask.description || '',
    category: dbTask.category,
    difficulty: dbTask.difficulty,
    priority: dbTask.priority || 3,
    estimatedTime: dbTask.estimated_time || 30,
    actualTime: dbTask.actual_time,
    xpReward: dbTask.xp_reward || 25,
    nodeId: dbTask.node_id,
    status: dbTask.status,
    context: dbTask.context || 'desk',
    energy: dbTask.energy || 'medium',
    valueScore: dbTask.value_score || 3,
    tags: dbTask.tags || [],
    dueDate: dbTask.due_date,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
    completedAt: dbTask.completed_at,
  });

  const handleDataRestore = async (restoredData: any) => {
    try {
      // Clear existing data
      setNodes([]);
      setTasks([]);
      
      // Set restored data
      if (restoredData.nodes) {
        setNodes(restoredData.nodes.map(mapDbNodeToSphereNode));
      }
      if (restoredData.tasks) {
        setTasks(restoredData.tasks.map(mapDbTaskToTask));
      }
      
      toast({
        title: "Data Restored!",
        description: "Successfully restored your data from iCloud backup",
      });
    } catch (error) {
      console.error('Error restoring data:', error);
      toast({
        title: "Restore Error",
        description: "Failed to restore data",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading Sphere Grid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <SystemOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <UnifiedProgressSystem
              nodes={nodes}
              tasks={tasks}
              onNodeClick={(node) => setSelectedNode(node)}
              onNodeUpdate={(nodeId, updates) => handleNodeUpdate(nodeId, updates)}
              onDataRefresh={loadAppData}
            />
          </div>

          <div className="space-y-6">
            <BrainDumpInput onTasksGenerated={handleTasksGenerated} />
            
            <QuickActions 
              onTasksGenerated={handleTasksGenerated}
              onDayPlanGenerated={() => toast({ title: "Day Plan Generated!", description: "Your schedule has been optimized" })}
              onMindmapSeeded={loadAppData}
            />
            
            <ProgressConnector 
              nodes={nodes}
              tasks={tasks}
            />

            <MobileSync 
              nodes={nodes} 
              tasks={tasks} 
              onDataRestore={handleDataRestore}
            />
          </div>
        </div>

        {/* Node Side Panel */}
        {selectedNode && (
          <NodeSidePanel
            node={selectedNode}
            tasks={tasks}
            onClose={() => setSelectedNode(null)}
            onTaskBreakdown={handleTaskBreakdown}
            onNodeUpdate={handleNodeUpdate}
          />
        )}
      </div>
    </div>
  );
}