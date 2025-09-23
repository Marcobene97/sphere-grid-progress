import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Target,
  TrendingUp,
  Zap
} from 'lucide-react';
import { SphereNode, Task } from '@/types/new-index';

interface ProgressConnectorProps {
  nodes: SphereNode[];
  tasks: Task[];
}

export const ProgressConnector: React.FC<ProgressConnectorProps> = ({ nodes, tasks }) => {
  const [progressFlow, setProgressFlow] = useState({
    tasksCompleted: 0,
    xpEarned: 0,
    nodesAdvanced: 0,
    pathsUnlocked: 0
  });

  useEffect(() => {
    calculateProgressFlow();
  }, [nodes, tasks]);

  const calculateProgressFlow = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const advancedNodes = nodes.filter(n => (n.progress || 0) > 0);
    const totalXP = nodes.reduce((sum, node) => sum + (node.metadata?.xp || 0), 0);
    
    // Simulate path unlocking based on node completion
    const unlockedPaths = nodes.filter(n => n.status === 'completed').length * 2;

    setProgressFlow({
      tasksCompleted: completedTasks.length,
      xpEarned: totalXP,
      nodesAdvanced: advancedNodes.length,
      pathsUnlocked: unlockedPaths
    });
  };

  const getCompletionRate = () => {
    if (tasks.length === 0) return 0;
    return Math.round((progressFlow.tasksCompleted / tasks.length) * 100);
  };

  const getNodeProgressRate = () => {
    if (nodes.length === 0) return 0;
    const totalProgress = nodes.reduce((sum, node) => sum + (node.progress || 0), 0);
    return Math.round(totalProgress / nodes.length);
  };

  return (
    <Card className="bg-gradient-to-r from-card to-muted border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progress Flow Visualization
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Progress Flow Chain */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-full">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{progressFlow.tasksCompleted}</div>
              <div className="text-xs text-muted-foreground">Tasks Completed</div>
            </div>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          
          <div className="flex items-center gap-2">
            <div className="bg-green-500/20 p-2 rounded-full">
              <Zap className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{progressFlow.xpEarned}</div>
              <div className="text-xs text-muted-foreground">XP Earned</div>
            </div>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          
          <div className="flex items-center gap-2">
            <div className="bg-purple-500/20 p-2 rounded-full">
              <Target className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{progressFlow.nodesAdvanced}</div>
              <div className="text-xs text-muted-foreground">Nodes Advanced</div>
            </div>
          </div>
          
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          
          <div className="flex items-center gap-2">
            <div className="bg-orange-500/20 p-2 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">{progressFlow.pathsUnlocked}</div>
              <div className="text-xs text-muted-foreground">Paths Unlocked</div>
            </div>
          </div>
        </div>

        {/* Overall Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Task Completion Rate</span>
              <Badge variant="outline">{getCompletionRate()}%</Badge>
            </div>
            <Progress value={getCompletionRate()} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Node Advancement</span>
              <Badge variant="outline">{getNodeProgressRate()}%</Badge>
            </div>
            <Progress value={getNodeProgressRate()} className="h-2" />
          </div>
        </div>

        {/* Connection Status */}
        <div className="mt-4 p-3 bg-card/80 backdrop-blur-sm rounded-lg border-border border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">System Integration Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-green-600 font-medium">All Connected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};