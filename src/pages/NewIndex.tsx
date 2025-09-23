import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrainDumpInput } from '@/components/BrainDumpInput';
import { SphereGridNew } from '@/components/SphereGridNew';
import { QuickActions } from '@/components/QuickActions';
import { NodeSidePanel } from '@/components/NodeSidePanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Target, Zap, Brain } from 'lucide-react';
import { SphereNode, Task } from '@/types/new-index';
import { aiService } from '@/lib/ai-service';
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
      // Create nodes first
      if (generatedNodes.length > 0) {
        const nodeInserts = generatedNodes.map(node => ({
          title: node.title,
          description: node.description || '',
          domain: node.domain,
          goal_type: node.goalType,
          position_x: Math.random() * 500,
          position_y: Math.random() * 500,
        }));
        
        const { data: newNodes } = await supabase.from('nodes').insert(nodeInserts).select();
        if (newNodes) {
          setNodes(prev => [...prev, ...newNodes.map(mapDbNodeToSphereNode)]);
        }
      }

      // Create tasks
      if (generatedTasks.length > 0) {
        const taskInserts = generatedTasks.map(task => ({
          title: task.title,
          description: task.description || '',
          category: task.category,
          difficulty: task.difficulty || 'basic',
          priority: task.priority || 3,
          estimated_time: task.estimatedTime || 30,
          context: task.context || 'desk',
          energy: task.energy || 'medium',
          value_score: task.valueScore || 3,
        }));

        const { data: newTasks } = await supabase.from('tasks').insert(taskInserts).select();
        if (newTasks) {
          setTasks(prev => [...prev, ...newTasks.map(mapDbTaskToTask)]);
        }
      }
    } catch (error) {
      console.error('Error creating tasks/nodes:', error);
      toast({
        title: "Error",
        description: "Failed to save generated tasks and nodes",
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
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-primary mb-2">AI-Powered Sphere Grid</h1>
          <p className="text-muted-foreground">Personal mastery through intelligent task management and skill progression</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Sphere Grid
                  <Badge variant="outline">{nodes.length} nodes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
              <SphereGridNew 
                nodes={nodes}
                onNodeClick={(node) => setSelectedNode(node)}
                onNodeUpdate={(id, pos) => handleNodeUpdate(id, { position: pos })}
              />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <BrainDumpInput onTasksGenerated={handleTasksGenerated} />
            
            <QuickActions 
              onTasksGenerated={handleTasksGenerated}
              onDayPlanGenerated={() => toast({ title: "Day Plan Generated!", description: "Your schedule has been optimized" })}
              onMindmapSeeded={loadAppData}
            />

            <Card>
              <CardHeader>
                <CardTitle>Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Tasks:</span>
                  <Badge>{tasks.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Active Nodes:</span>
                  <Badge>{nodes.filter(n => n.status === 'available').length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <Badge variant="secondary">
                    {tasks.filter(t => t.status === 'completed').length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
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