import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  Zap, 
  Trophy,
  Sparkles,
  Loader2,
  LogOut,
  Target,
  Trash2,
  ArrowUpDown
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  xp_reward: number;
  difficulty: string;
  estimated_time: number;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [xpData, setXpData] = useState({ totalXP: 0, level: 1, progress: 0 });
  const [sorting, setSorting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
    loadXP();

    const channel = supabase
      .channel('task-xp-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadTasks)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'xp_events' }, loadXP)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (data) setTasks(data);
    setLoading(false);
  };

  const loadXP = async () => {
    const { data: xpResult } = await supabase.rpc('get_user_total_xp');
    const totalXP = xpResult || 0;
    const level = Math.floor(totalXP / 100) + 1;
    const xpInLevel = totalXP % 100;
    
    setXpData({ totalXP, level, progress: xpInLevel });
  };

  const addTask = async () => {
    if (!newTask.trim()) return;

    const { error } = await supabase.from('tasks').insert({
      title: newTask.trim(),
      description: newDesc.trim() || null,
      status: 'pending',
      priority: 3,
      difficulty: 'basic',
      estimated_time: 30,
      xp_reward: 15
    });

    if (error) {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    } else {
      setNewTask('');
      setNewDesc('');
      toast({ title: "Quest Added! 🎯" });
    }
  };

  const completeTask = async (task: Task) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('tasks').update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', task.id);

    await supabase.from('xp_events').insert({
      user_id: user.id,
      amount: task.xp_reward,
      source: 'task_completion',
      meta: { task_id: task.id, task_title: task.title }
    });

    toast({ 
      title: `+${task.xp_reward} XP! 🎉`,
      description: "Quest completed!",
    });
  };

  const toggleTask = async (task: Task) => {
    if (task.status === 'completed') {
      await supabase.from('tasks').update({ status: 'pending', completed_at: null }).eq('id', task.id);
    } else {
      await completeTask(task);
    }
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
  };

  const sortTasks = async () => {
    setSorting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-task-sorter');
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Tasks Optimized! ✨",
        description: `AI sorted ${data.count} tasks`,
      });
    } catch (error: any) {
      toast({
        title: "Sorting Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSorting(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pending = tasks.filter(t => t.status !== 'completed');
  const completed = tasks.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-purple-500/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              QuestForge
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-base px-4 py-2">
              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
              Level {xpData.level}
            </Badge>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* XP Progress */}
            <Card className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Level {xpData.level}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {xpData.totalXP} XP
                  </span>
                </div>
                <Progress value={xpData.progress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {100 - xpData.progress} XP to Level {xpData.level + 1}
                </p>
              </CardContent>
            </Card>

            {/* Add Quest */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  New Quest
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="What's your next quest?"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && addTask()}
                />
                <Textarea
                  placeholder="Add details (optional)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                />
                <Button onClick={addTask} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quest
                </Button>
              </CardContent>
            </Card>

            {/* Active Quests */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Active Quests
                    <Badge variant="secondary">{pending.length}</Badge>
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={sortTasks}
                    disabled={sorting || pending.length === 0}
                  >
                    {sorting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                    )}
                    AI Sort
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {pending.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No active quests. Create one to start! 🚀
                  </p>
                ) : (
                  pending.map(task => (
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
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 shrink-0">
                        <Zap className="h-3 w-3 mr-1" />
                        {task.xp_reward}
                      </Badge>
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

            {/* Completed */}
            {completed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-5 w-5" />
                    Completed
                    <Badge variant="outline">{completed.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completed.map(task => (
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
                      <Badge variant="secondary" className="shrink-0">
                        +{task.xp_reward}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total XP</span>
                  <span className="font-bold text-xl">{xpData.totalXP}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Level</span>
                  <span className="font-bold text-xl">{xpData.level}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-bold text-xl">{completed.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active</span>
                  <span className="font-bold text-xl">{pending.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">💡 Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Use AI Sort to prioritize tasks intelligently</p>
                <p>• Complete quests to earn XP and level up</p>
                <p>• Higher difficulty = more XP rewards</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
