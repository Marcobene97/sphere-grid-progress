import { AppState } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Target, Award } from 'lucide-react';

interface AnalyticsProps {
  state: AppState;
}

export const Analytics = ({ state }: AnalyticsProps) => {
  const { user, tasks, nodes, achievements } = state;

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const completedNodes = nodes.filter(n => n.status === 'completed' || n.status === 'mastered');
  const unlockedAchievements = achievements.filter(a => a.unlockedAt);

  const categoryStats = ['programming', 'finance', 'music', 'general'].map(category => {
    const categoryTasks = tasks.filter(t => t.category === category);
    const completedCategoryTasks = categoryTasks.filter(t => t.status === 'completed');
    return {
      category,
      total: categoryTasks.length,
      completed: completedCategoryTasks.length,
      percentage: categoryTasks.length > 0 ? (completedCategoryTasks.length / categoryTasks.length) * 100 : 0
    };
  });

  const recentActivity = completedTasks
    .filter(t => t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.totalXP.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Level {user.level} • {user.rank} Rank
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.length - completedTasks.length} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.streaks.current}</div>
            <p className="text-xs text-muted-foreground">
              Best: {user.streaks.longest} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="w-4 h-4" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
            <p className="text-xs text-muted-foreground">
              Of {achievements.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Category Progress</CardTitle>
          <CardDescription>Your progress across different skill branches</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryStats.map(stat => (
            <div key={stat.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium capitalize">{stat.category}</span>
                <span className="text-sm text-muted-foreground">
                  {stat.completed} / {stat.total} tasks
                </span>
              </div>
              <Progress value={stat.percentage} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest completed tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No completed tasks yet
              </p>
            ) : (
              recentActivity.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Completed {new Date(task.completedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">+{task.xpReward} XP</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};