import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BrainDumpInput } from '@/components/BrainDumpInput';
import { WorkflowProcessor } from '@/components/WorkflowProcessor';
import { SystemOverview } from '@/components/SystemOverview';
import { ProgressConnector } from '@/components/ProgressConnector';
import { NodeCreationTest } from '@/components/NodeCreationTest';
import { UnifiedProgressSystem } from '@/components/UnifiedProgressSystem';
import { XPSystem } from '@/components/XPSystem';
import { QuickActions } from '@/components/QuickActions';
import { NodeSidePanel } from '@/components/NodeSidePanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Target, Zap, Brain, Activity, RefreshCw, BarChart3 } from 'lucide-react';
import { SphereNode, Task } from '@/types/new-index';
import { aiService } from '@/lib/ai-service';
import { MobileSync } from '@/components/MobileSync';
import { SphereGridDebug } from '@/components/SphereGridDebug';
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
      console.log('[NewIndex] Loading app data...');
      const { data: nodesData, error: nodesError } = await supabase.from('nodes').select('*');
      const { data: tasksData, error: tasksError } = await supabase.from('tasks').select('*');
      
      if (nodesError) {
        console.error('[NewIndex] Error loading nodes:', nodesError);
        throw nodesError;
      }
      if (tasksError) {
        console.error('[NewIndex] Error loading tasks:', tasksError);
        throw tasksError;
      }
      
      console.log('[NewIndex] Raw data loaded:', { 
        nodes: nodesData?.length || 0, 
        tasks: tasksData?.length || 0,
        sampleNode: nodesData?.[0]
      });
      
      const mappedNodes = nodesData?.map(mapDbNodeToSphereNode) || [];
      const mappedTasks = tasksData?.map(mapDbTaskToTask) || [];
      
      setNodes(mappedNodes);
      setTasks(mappedTasks);
      
      console.log('[NewIndex] Data processed and set in state:', {
        nodes: mappedNodes.length,
        tasks: mappedTasks.length,
        sampleMappedNode: mappedNodes[0]
      });
    } catch (error) {
      console.error('[NewIndex] Error loading data:', error);
      toast({
        title: "Data Loading Error",
        description: "Failed to load app data",
        variant: "destructive"
      });
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
    title: dbNode.title || 'Untitled Node',
    description: dbNode.description || '',
    domain: dbNode.domain || 'general',
    goalType: dbNode.goal_type || 'project',
    status: dbNode.status || 'available',
    position: { x: dbNode.position_x ?? 400, y: dbNode.position_y ?? 300 },
    prerequisites: dbNode.prerequisites || [],
    unlocks: dbNode.unlocks || [],
    timeSpent: dbNode.time_spent || 0,
    progress: Math.min(100, Math.max(0, dbNode.progress || 0)),
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
        description: "Successfully restored your data from local backup",
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
        <div className="text-center space-y-4">
          <Brain className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-xl text-foreground font-semibold">Loading Sphere Grid...</p>
          <p className="text-sm text-muted-foreground">Initializing your progress system</p>
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <SystemOverview />
        
        {/* Empty state when no data */}
        {nodes.length === 0 && tasks.length === 0 && (
          <Card className="border-primary/20 bg-card">
            <CardContent className="p-8 text-center space-y-4">
              <Target className="h-16 w-16 text-primary mx-auto opacity-50" />
              <h2 className="text-2xl font-bold text-foreground">Welcome to Your Sphere Grid</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Get started by creating test data or using the Brain Dump feature to generate your personalized skill tree.
              </p>
              <div className="flex gap-3 justify-center pt-4">
                <Button onClick={loadAppData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="braindump" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Brain Dump
            </TabsTrigger>
            <TabsTrigger value="xp" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              XP & Progress
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system">
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

              <div className="space-y-4">
                <ProgressConnector nodes={nodes} tasks={tasks} />
                <QuickActions 
                  onTasksGenerated={handleTasksGenerated}
                  onDayPlanGenerated={() => toast({ title: "Day Plan Generated!", description: "Your schedule has been optimized" })}
                  onMindmapSeeded={loadAppData}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="braindump">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <WorkflowProcessor onWorkflowProcessed={loadAppData} />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BrainDumpInput onTasksGenerated={handleTasksGenerated} />
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Nodes:</span>
                          <Badge>{nodes.length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Tasks:</span>
                          <Badge>{tasks.length}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <Badge variant="outline">
                            {tasks.filter(t => t.status === 'completed').length}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="xp">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <XPSystem />
                      <div className="space-y-4">
                        <MobileSync 
                          nodes={nodes} 
                          tasks={tasks} 
                          onDataRestore={handleDataRestore}
                        />
                        
                        <Card>
                          <CardHeader>
                            <CardTitle>Visual Test</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Button 
                              onClick={() => {
                                console.log('=== MANUAL DEBUG ===');
                                console.log('Nodes received by NewIndex:', nodes.length);
                                console.log('First 3 nodes:', nodes.slice(0, 3));
                                console.log('Tasks received by NewIndex:', tasks.length);
                                console.log('==================');
                              }}
                              className="w-full"
                            >
                              Log Debug Info
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
            </div>
          </TabsContent>

          <TabsContent value="debug">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={loadAppData} size="sm" variant="outline">
                        Refresh All Data
                      </Button>
                      <NodeCreationTest onDataRefresh={loadAppData} />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded">
                      <p><strong>Debug Info:</strong></p>
                      <p>• Nodes: {nodes.length} loaded</p>
                      <p>• Tasks: {tasks.length} loaded</p>
                      <p>• Status: {loading ? 'Loading...' : 'Ready'}</p>
                      <p>• User: {user ? 'Authenticated' : 'Not authenticated'}</p>
                      <Button 
                        onClick={() => {
                          console.log('=== MANUAL DEBUG ===');
                          console.log('Nodes received by NewIndex:', nodes.length);
                          console.log('Sample nodes:', nodes.slice(0, 2));
                          console.log('Tasks received by NewIndex:', tasks.length);
                          console.log('==================');
                        }}
                        size="sm"
                        className="mt-2 w-full"
                      >
                        Log All Data to Console
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <SphereGridDebug />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 text-xs">
                      <div>
                        <h4 className="font-medium mb-2">First 2 Nodes:</h4>
                        <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(nodes.slice(0, 2), null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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