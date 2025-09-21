import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Zap, Clock, Target } from 'lucide-react';
import { SphereNode, Task, Subtask } from '@/types';

interface ActionCounsellorStatusProps {
  nodes: SphereNode[];
  tasks: Task[];
  subtasks: Subtask[];
  isActive?: boolean;
}

export const ActionCounsellorStatus = ({ 
  nodes, 
  tasks, 
  subtasks, 
  isActive = true 
}: ActionCounsellorStatusProps) => {
  const activeNodes = nodes.filter(n => n.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const todoSubtasks = subtasks.filter(s => s.status === 'todo').length;
  const avgTaskTime = tasks.length > 0 ? 
    Math.round(tasks.reduce((sum, t) => sum + t.estimatedTime, 0) / tasks.length) : 0;

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className={`w-4 h-4 ${isActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium">Action Counsellor</span>
            <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
              {isActive ? 'Active' : 'Idle'}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            Background AI
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-3 h-3 text-gaming-info" />
              <span className="font-mono">{activeNodes}</span>
            </div>
            <div className="text-muted-foreground">Active Nodes</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="w-3 h-3 text-gaming-warning" />
              <span className="font-mono">{pendingTasks}</span>
            </div>
            <div className="text-muted-foreground">Tasks</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-gaming-success" />
              <span className="font-mono">{todoSubtasks}</span>
            </div>
            <div className="text-muted-foreground">Subtasks</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-gaming-rare" />
              <span className="font-mono">{avgTaskTime}m</span>
            </div>
            <div className="text-muted-foreground">Avg Time</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};