import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Award,
  Zap
} from 'lucide-react';

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  totalXP: number;
  weeklyXP: number;
  avgTaskXP: number;
  completionRate: number;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalTasks: 0,
    completedTasks: 0,
    totalXP: 0,
    weeklyXP: 0,
    avgTaskXP: 0,
    completionRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();

    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadAnalytics)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'xp_events' }, loadAnalytics)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status, xp_reward')
        .eq('user_id', user.id);

      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Get total XP
      const { data: totalXPData } = await supabase.rpc('get_user_total_xp');
      const totalXP = totalXPData || 0;

      // Get weekly XP (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weeklyXPData } = await supabase
        .from('xp_events')
        .select('amount')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      const weeklyXP = weeklyXPData?.reduce((sum, event) => sum + event.amount, 0) || 0;

      // Calculate average task XP
      const completedTasksData = tasks?.filter(t => t.status === 'completed') || [];
      const avgTaskXP = completedTasksData.length > 0
        ? completedTasksData.reduce((sum, t) => sum + t.xp_reward, 0) / completedTasksData.length
        : 0;

      setData({
        totalTasks,
        completedTasks,
        totalXP,
        weeklyXP,
        avgTaskXP: Math.round(avgTaskXP),
        completionRate: Math.round(completionRate)
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completion Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">Completion Rate</span>
            </div>
            <span className="font-bold text-lg">{data.completionRate}%</span>
          </div>
          <Progress value={data.completionRate} className="h-2" />
        </div>

        {/* Weekly XP */}
        <div className="flex items-center justify-between py-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-green-500" />
            <span>This Week</span>
          </div>
          <span className="font-bold text-lg text-green-600">
            +{data.weeklyXP} XP
          </span>
        </div>

        {/* Average Task XP */}
        <div className="flex items-center justify-between py-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Avg Task XP</span>
          </div>
          <span className="font-bold text-lg">{data.avgTaskXP}</span>
        </div>

        {/* Total Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="text-2xl font-bold">{data.totalTasks}</div>
            <div className="text-xs text-muted-foreground">Total Tasks</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-background/50">
            <div className="text-2xl font-bold text-green-600">{data.completedTasks}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div className="flex items-center gap-2 pt-2 border-t text-sm">
          <TrendingUp className={`h-4 w-4 ${data.weeklyXP > 0 ? 'text-green-500' : 'text-muted-foreground'}`} />
          <span className="text-muted-foreground">
            {data.weeklyXP > 100 ? 'Great momentum! 🔥' : 
             data.weeklyXP > 50 ? 'Keep it up! 💪' : 
             'Time to complete some quests! 🎯'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
