import { useMemo, useState } from 'react';
import { AppState, Task, SphereNode } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XPBar } from './XPBar';
import { PillarsProgress } from './PillarsProgress';
import { TaskList } from './TaskList';
import { SphereGrid } from './SphereGrid';
import { WorkSessionTimer } from './WorkSessionTimer';
import { Analytics } from './Analytics';
import { ActionCounsellorStatus } from './ActionCounsellorStatus';
import { MindmapSeeder } from './MindmapSeeder';
import { DailyPlan } from './DailyPlan';
import { NodeSidePanel } from './NodeSidePanel';
import { getMotivationalMessage } from '@/lib/xp-system';
import { Play, Target, TrendingUp, Zap, Brain, Eye } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onTaskComplete: (taskId: string, actualTime: number, focusScore: number) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onNodeClick: (node: SphereNode) => void;
  onNodeUpdate: (nodeId: string, updates: Partial<SphereNode>) => void;
  onStartWorkSession: (taskId?: string, nodeId?: string) => any;
  onEndWorkSession: (sessionId: string, focusScore: number, notes?: string, analysis?: any) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSubtasksUpdate?: () => void;
  onDayPlanUpdate?: () => void;
}

export const Dashboard = ({
  state,
  onTaskComplete,
  onTaskUpdate,
  onNodeClick,
  onNodeUpdate,
  onStartWorkSession,
  onEndWorkSession,
  onAddTask,
  onSubtasksUpdate,
  onDayPlanUpdate,
}: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDungeonMode, setIsDungeonMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SphereNode | null>(null);

  const { user, nodes, tasks, achievements, subtasks, dayPlanSlots } = state;

  const activeTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const completedTasksToday = tasks.filter(t =>
    t.status === 'completed' &&
    t.completedAt &&
    new Date(t.completedAt).toDateString() === new Date().toDateString()
  );

  const availableNodes = nodes.filter(n => n.status === 'available' || n.status === 'in_progress');
  const completedNodes = nodes.filter(n => n.status === 'completed' || n.status === 'mastered');

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const motivationalMessage = getMotivationalMessage(user);

  const totalNodesCount = nodes.length;
  const overallProgress = (completedNodes.length / totalNodesCount) * 100;

  const nodeTasks = useMemo(
    () => (selectedNode ? tasks.filter(task => task.nodeId === selectedNode.id) : []),
    [selectedNode, tasks]
  );
  const completedNodeTasks = useMemo(
    () => nodeTasks.filter(task => task.status === 'completed').length,
    [nodeTasks]
  );

  const handleNodeSelect = (node: SphereNode) => {
    setSelectedNode(node);
    onNodeClick(node);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Personal Mastery Grid
          </h1>
          <p className="text-muted-foreground mt-1">{motivationalMessage}</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant={isDungeonMode ? 'destructive' : 'default'}
            onClick={() => setIsDungeonMode(!isDungeonMode)}
            className="glow"
          >
            {isDungeonMode ? <Eye className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            {isDungeonMode ? 'Exit Dungeon' : 'Dungeon Mode'}
          </Button>
        </div>
      </div>

      <ActionCounsellorStatus 
        nodes={nodes}
        tasks={tasks}
        subtasks={subtasks}
        isActive={nodes.length > 0}
      />

      <XPBar user={user} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Today's Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasksToday.length}</div>
            <p className="text-xs text-muted-foreground">
              Tasks completed • {activeTasks.length} remaining
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-gaming-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-gaming-success" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {completedNodes.length} of {totalNodesCount} nodes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-gaming-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-gaming-warning" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.streaks.current}</div>
            <p className="text-xs text-muted-foreground">
              Days • Best: {user.streaks.longest}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-gaming-legendary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="w-4 h-4 text-gaming-legendary" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unlockedAchievements.length}</div>
            <p className="text-xs text-muted-foreground">
              Of {achievements.length} unlocked
            </p>
          </CardContent>
        </Card>
      </div>

      <PillarsProgress user={user} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="sphere">Sphere Grid</TabsTrigger>
          <TabsTrigger value="daily">Daily Plan</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Active Tasks
                </CardTitle>
                <CardDescription>Your current focus areas</CardDescription>
              </CardHeader>
              <CardContent>
                <TaskList
                  tasks={activeTasks.slice(0, 5)}
                  onTaskComplete={onTaskComplete}
                  onTaskUpdate={onTaskUpdate}
                  compact
                />
                {activeTasks.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => setActiveTab('tasks')}
                  >
                    View all {activeTasks.length} tasks
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Available Nodes
                </CardTitle>
                <CardDescription>Ready to be conquered</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableNodes.slice(0, 3).map(node => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setActiveTab('sphere')}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{node.title}</h4>
                      <p className="text-xs text-muted-foreground">{node.branch}</p>
                      {node.progress > 0 && (
                        <Progress value={node.progress} className="h-1 mt-1" />
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      +{node.rewards.xp} XP
                    </Badge>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setActiveTab('sphere')}>
                  View sphere grid
                </Button>
              </CardContent>
            </Card>
          </div>

          <WorkSessionTimer onStart={onStartWorkSession} onEnd={onEndWorkSession} isDungeonMode={isDungeonMode} />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <TaskList
            tasks={activeTasks}
            onTaskComplete={onTaskComplete}
            onTaskUpdate={onTaskUpdate}
          />
        </TabsContent>

        <TabsContent value="sphere" className="space-y-4">
          {nodes.length === 0 ? (
            <MindmapSeeder onSeeded={() => window.location.reload()} />
          ) : (
            <div className="flex gap-4">
              <div className="flex-1">
                <SphereGrid
                  nodes={nodes}
                  tasks={tasks}
                  onNodeClick={handleNodeSelect}
                  onNodeUpdate={onNodeUpdate}
                />
              </div>
              {selectedNode && (
                <NodeSidePanel
                  node={selectedNode}
                  tasks={tasks}
                  subtasks={subtasks}
                  onClose={() => setSelectedNode(null)}
                  onTaskUpdate={onTaskUpdate}
                  onSubtasksUpdate={onSubtasksUpdate || (() => {})}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <DailyPlan
            date={new Date().toISOString().split('T')[0]}
            dayPlanSlots={dayPlanSlots}
            subtasks={subtasks}
            tasks={tasks}
            onSlotsUpdate={onDayPlanUpdate || (() => {})}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <Analytics state={state} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
