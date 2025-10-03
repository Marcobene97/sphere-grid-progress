import { format } from 'date-fns';
import { useTasks } from '@/hooks/useTasks';
import { useAppStore } from '@/hooks/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PlannerBoard() {
  const { selectedNodeId } = useAppStore();
  const { tasks, updateTask } = useTasks(selectedNodeId);
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    return format(new Date(t.due_date), 'yyyy-MM-dd') === today;
  });

  const unscheduledTasks = tasks.filter((t) => !t.due_date && t.status !== 'completed');

  const handleStartSession = (taskId: string) => {
    // Navigate to sessions view with this task
    window.location.hash = `#session-${taskId}`;
  };

  const toggleComplete = (task: any) => {
    updateTask({
      id: task.id,
      updates: {
        status: task.status === 'completed' ? 'pending' : 'completed',
        completed_at: task.status === 'completed' ? null : new Date().toISOString(),
      },
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Daily Planner</h1>
        <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {todayTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No tasks scheduled for today. Drag from unscheduled or create new tasks.
            </p>
          ) : (
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    task.status === 'completed' && 'opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => toggleComplete(task)}>
                      <CheckCircle2
                        className={cn(
                          'h-5 w-5',
                          task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground'
                        )}
                      />
                    </button>
                    <div className="flex-1">
                      <div className={cn('font-medium', task.status === 'completed' && 'line-through')}>
                        {task.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {task.estimated_time} min · {task.xp_reward} XP
                      </div>
                    </div>
                  </div>
                  {task.status !== 'completed' && (
                    <Button size="sm" variant="outline" onClick={() => handleStartSession(task.id)}>
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unscheduled</CardTitle>
        </CardHeader>
        <CardContent>
          {unscheduledTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">All tasks are scheduled</p>
          ) : (
            <div className="space-y-2">
              {unscheduledTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {task.estimated_time} min · {task.xp_reward} XP
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      updateTask({ id: task.id, updates: { due_date: new Date().toISOString() } })
                    }
                  >
                    Schedule Today
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
