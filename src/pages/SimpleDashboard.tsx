import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Target,
  Sparkles,
  Loader2
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  created_at: string;
}

interface Node {
  id: string;
  title: string;
  description?: string;
  domain: string;
  progress: number;
}

export default function SimpleDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [brainDumpText, setBrainDumpText] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksResult, nodesResult] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('nodes').select('*').order('created_at', { ascending: false })
      ]);

      if (tasksResult.data) setTasks(tasksResult.data);
      if (nodesResult.data) setNodes(nodesResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addQuickTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const { error } = await supabase.from('tasks').insert({
        title: newTaskTitle.trim(),
        status: 'pending' as const,
        priority: 3,
        category: 'general' as const,
        difficulty: 'basic' as const,
        estimated_time: 30
      });

      if (error) throw error;

      setNewTaskTitle('');
      await loadData();
      toast({ title: "Task added!" });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive"
      });
    }
  };

  const toggleTask = async (task: Task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', task.id);

      if (error) throw error;

      await loadData();
      toast({ 
        title: newStatus === 'completed' ? "Task completed! 🎉" : "Task reopened" 
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive"
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;

      await loadData();
      toast({ title: "Task deleted" });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive"
      });
    }
  };

  const processBrainDump = async () => {
    if (!brainDumpText.trim()) return;

    setProcessing(true);
    try {
      // Simple parsing - just create tasks directly
      const lines = brainDumpText.split('\n').filter(line => line.trim());
      
      const tasksToCreate = lines.map(line => ({
        title: line.trim(),
        status: 'pending' as const,
        priority: 3,
        category: 'general' as const,
        difficulty: 'basic' as const,
        estimated_time: 30
      }));

      const { error } = await supabase.from('tasks').insert(tasksToCreate);
      
      if (error) throw error;

      setBrainDumpText('');
      await loadData();
      toast({ 
        title: "Success!",
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Your Tasks</h1>
          <p className="text-muted-foreground">
            {pendingTasks.length} pending · {completedTasks.length} completed
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Tasks Column */}
          <div className="md:col-span-2 space-y-4">
            {/* Quick Add */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addQuickTask()}
                  />
                  <Button onClick={addQuickTask} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Circle className="h-5 w-5" />
                  To Do
                  <Badge variant="secondary">{pendingTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending tasks. Add one above or use Brain Dump!
                  </p>
                ) : (
                  pendingTasks.map(task => (
                    <div 
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => toggleTask(task)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {task.description}
                          </p>
                        )}
                      </div>
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
                        <p className="font-medium line-through truncate">{task.title}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                      Add All
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Goals/Nodes */}
            {nodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nodes.slice(0, 5).map(node => (
                    <div key={node.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{node.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {node.domain}
                        </Badge>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${node.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
