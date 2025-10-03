import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { XPSystemDisplay } from '@/components/XPSystemDisplay';
import { AITaskBreakdown } from '@/components/AITaskBreakdown';
import { AIDailyPlanner } from '@/components/AIDailyPlanner';
import { FocusCoach } from '@/components/ai-modules/FocusCoach';
import { ProgressVisualizer } from '@/components/ai-modules/ProgressVisualizer';
import { SmartBreakGenerator } from '@/components/ai-modules/SmartBreakGenerator';
import { KnowledgeSynthesizer } from '@/components/ai-modules/KnowledgeSynthesizer';
import { EnergyOptimizer } from '@/components/ai-modules/EnergyOptimizer';
import { GoalAligner } from '@/components/ai-modules/GoalAligner';
import { ContextSwitcher } from '@/components/ai-modules/ContextSwitcher';
import { ProductivityInsights } from '@/components/ai-modules/ProductivityInsights';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Target,
  Sparkles,
  Loader2,
  Zap,
  Trophy,
  Calendar
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  xp_reward: number;
  created_at: string;
}

export default function GamefiedDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [brainDumpText, setBrainDumpText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();

    // Subscribe to task changes for real-time updates
    const channel = supabase
      .channel('task-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, () => {
        loadTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTasks = async () => {
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      // Calculate XP based on estimated time
      const estimatedMinutes = 30; // Default
      const xpReward = Math.round(estimatedMinutes / 2); // 1 XP per 2 minutes

      const { error } = await supabase.from('tasks').insert({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        status: 'pending' as const,
        priority: 3,
        category: 'general' as const,
        difficulty: 'basic' as const,
        estimated_time: estimatedMinutes,
        xp_reward: xpReward
      });

      if (error) throw error;

      setNewTaskTitle('');
      setNewTaskDescription('');
      toast({ title: "Task added! 🎯" });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive"
      });
    }
  };

  const completeTask = async (task: Task) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Mark task as completed
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (taskError) throw taskError;

      // Award XP
      const { error: xpError } = await supabase
        .from('xp_events')
        .insert({
          user_id: user.id,
          amount: task.xp_reward || 15,
          source: `Completed: ${task.title}`,
          meta: { task_id: task.id }
        });

      if (xpError) throw xpError;

      toast({ 
        title: `+${task.xp_reward || 15} XP! 🎉`,
        description: "Task completed!",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const toggleTask = async (task: Task) => {
    if (task.status === 'completed') {
      // Reopen task
      try {
        const { error } = await supabase
          .from('tasks')
          .update({ 
            status: 'pending',
            completed_at: null
          })
          .eq('id', task.id);

        if (error) throw error;
        toast({ title: "Task reopened" });
      } catch (error) {
        console.error('Error reopening task:', error);
      }
    } else {
      // Complete task and award XP
      await completeTask(task);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      toast({ title: "Task deleted" });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const processBrainDump = async () => {
    if (!brainDumpText.trim()) return;

    setProcessing(true);
    try {
      // Parse lines and filter out markdown headers and empty lines
      const lines = brainDumpText
        .split('\n')
        .map(line => line.trim())
        .filter(line => {
          // Skip empty lines, markdown headers, and list markers without content
          if (!line) return false;
          if (line.startsWith('#')) return false;
          if (line === '-') return false;
          // Remove list markers
          return true;
        })
        .map(line => {
          // Clean up list markers
          return line.replace(/^[-*]\s*/, '').trim();
        })
        .filter(line => line.length > 0);
      
      if (lines.length === 0) {
        toast({
          title: "No tasks found",
          description: "Please enter some task descriptions",
          variant: "destructive"
        });
        return;
      }

      const tasksToCreate = lines.map(line => ({
        title: line,
        status: 'pending' as const,
        priority: 3,
        category: 'general' as const,
        difficulty: 'basic' as const,
        estimated_time: 30,
        xp_reward: 15
      }));

      const { error } = await supabase.from('tasks').insert(tasksToCreate);
      
      if (error) throw error;

      setBrainDumpText('');
      toast({ 
        title: "Brain dump processed! 🧠",
        description: `Created ${tasksToCreate.length} tasks` 
      });
    } catch (error) {
      console.error('Error processing brain dump:', error);
      toast({
        title: "Error",
        description: "Failed to create tasks",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const totalXPAvailable = pendingTasks.reduce((sum, t) => sum + (t.xp_reward || 0), 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quest Dashboard</h1>
            <p className="text-muted-foreground">
              Complete tasks to earn XP and level up! ⚡
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Trophy className="h-4 w-4 mr-2" />
            {totalXPAvailable} XP Available
          </Badge>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="ai">AI Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Main Tasks Column */}
              <div className="md:col-span-2 space-y-4">
                {/* Quick Add */}
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <Input
                      placeholder="What do you want to accomplish?"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addTask()}
                    />
                    <Textarea
                      placeholder="Add details (optional)..."
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      rows={2}
                    />
                    <Button onClick={addTask} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Quest
                    </Button>
                  </CardContent>
                </Card>

                {/* Pending Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Active Quests
                      <Badge variant="secondary">{pendingTasks.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingTasks.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No active quests. Start your adventure! 🚀
                      </p>
                    ) : (
                      pendingTasks.map(task => (
                        <div 
                          key={task.id}
                          className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            checked={false}
                            onCheckedChange={() => toggleTask(task)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                            <Zap className="h-3 w-3 mr-1" />
                            {task.xp_reward || 15} XP
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedTask(task)}
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        Completed
                        <Badge variant="outline">{completedTasks.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {completedTasks.map(task => (
                        <div 
                          key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg border opacity-60"
                        >
                          <Checkbox
                            checked={true}
                            onCheckedChange={() => toggleTask(task)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium line-through">{task.title}</p>
                          </div>
                          <Badge variant="secondary">
                            +{task.xp_reward || 15} XP
                          </Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Brain Dump */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Brain Dump
                    </CardTitle>
                    <CardDescription>
                      Paste multiple tasks, one per line
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Task 1&#10;Task 2&#10;Task 3"
                      value={brainDumpText}
                      onChange={(e) => setBrainDumpText(e.target.value)}
                      rows={6}
                    />
                    <Button 
                      className="w-full" 
                      onClick={processBrainDump}
                      disabled={processing || !brainDumpText.trim()}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add All Quests
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <XPSystemDisplay />
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            {/* AI Task Tools */}
            <div className="grid md:grid-cols-2 gap-4">
              {selectedTask && (
                <AITaskBreakdown
                  taskId={selectedTask.id}
                  taskTitle={selectedTask.title}
                  taskDescription={selectedTask.description}
                  onBreakdownComplete={() => {
                    loadTasks();
                    setSelectedTask(null);
                  }}
                />
              )}
              <AIDailyPlanner />
            </div>

            {/* AI Productivity Modules */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Your AI Team</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FocusCoach />
                <ProgressVisualizer />
                <SmartBreakGenerator />
                <KnowledgeSynthesizer />
                <EnergyOptimizer />
                <GoalAligner />
                <ContextSwitcher />
                <ProductivityInsights />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
