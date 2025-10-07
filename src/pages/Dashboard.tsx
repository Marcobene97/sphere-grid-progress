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
import BrainDump from '@/components/BrainDump';
import Analytics from '@/components/Analytics';
import { QuestDetailsModal } from '@/components/quests/QuestDetailsModal';
import { getRemainingXp } from '@/lib/xp';
import { 
  Plus, 
  Zap, 
  Trophy,
  Sparkles,
  Loader2,
  LogOut,
  Target,
  Trash2,
  ArrowUpDown,
  Calculator,
  Info
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
  const [xpData, setXpData] = useState({ totalXP: 0, level: 1, progress: 0, xpToNext: 100 });
  const [sorting, setSorting] = useState(false);
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
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
    const { level, progressPercent, xpToNextLevel } = getRemainingXp(totalXP);
    
    setXpData({ totalXP, level, progress: progressPercent, xpToNext: xpToNextLevel });
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

    // Optimistic update - immediately update UI
    const newXP = xpData.totalXP + task.xp_reward;
    const { level, progressPercent, xpToNextLevel } = getRemainingXp(newXP);
    setXpData({ totalXP: newXP, level, progress: progressPercent, xpToNext: xpToNextLevel });
    
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: 'completed' } : t
    ));

    try {
      // Background DB updates
      await Promise.all([
        supabase.from('tasks').update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        }).eq('id', task.id),
        supabase.from('xp_events').insert({
          user_id: user.id,
          amount: task.xp_reward,
          source: 'task_completion',
          meta: { task_id: task.id, task_title: task.title }
        })
      ]);

      toast({ 
        title: `+${task.xp_reward} XP! 🎉`,
        description: level > xpData.level ? `Level Up! Now Level ${level}! 🎊` : "Quest completed!",
      });
    } catch (error) {
      // Rollback on error
      setXpData({ totalXP: xpData.totalXP, level: xpData.level, progress: xpData.progress, xpToNext: xpData.xpToNext });
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'pending' } : t
      ));
      toast({ 
        title: "Error",
        description: "Failed to complete quest. Try again.",
        variant: "destructive"
      });
    }
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

  const calculateXP = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-xp-calculator');
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "XP Calculated! ⚡",
        description: `Updated ${data.count} tasks with dynamic XP`,
      });
    } catch (error: any) {
      toast({
        title: "Calculation Failed",
        description: error.message,
        variant: "destructive"
      });
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
                  {xpData.xpToNext} XP to Level {xpData.level + 1}
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
                        onClick={() => {
                          setSelectedQuestId(task.id);
                          setModalOpen(true);
                        }}
                        title="View details"
                      >
                        <Info className="h-4 w-4" />
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
            {/* Brain Dump */}
            <BrainDump />

            {/* Analytics */}
            <Analytics />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">⚡ Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={calculateXP}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Recalculate All XP
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">💡 Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Use Brain Dump to batch-create tasks</p>
                <p>• AI calculates XP based on difficulty & time</p>
                <p>• Complete quests to earn XP and level up</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Quest Details Modal */}
      <QuestDetailsModal 
        questId={selectedQuestId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
