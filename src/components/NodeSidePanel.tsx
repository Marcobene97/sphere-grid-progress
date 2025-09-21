import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Plus, 
  Wand2, 
  CheckCircle, 
  Circle, 
  Clock, 
  Target,
  Zap
} from 'lucide-react';
import { SphereNode, Task, Subtask } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { useActionCounsellor } from '@/hooks/useActionCounsellor';

interface NodeSidePanelProps {
  node: SphereNode;
  tasks: Task[];
  subtasks: Subtask[];
  onClose: () => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onSubtasksUpdate: () => void;
}

export const NodeSidePanel = ({ 
  node, 
  tasks, 
  subtasks, 
  onClose, 
  onTaskUpdate,
  onSubtasksUpdate 
}: NodeSidePanelProps) => {
  const { isGenerating, breakdownTask, buildDayPlan } = useActionCounsellor();
  const { toast } = useToast();

  const nodeTasks = tasks.filter(task => task.nodeId === node.id);
  const nodeSubtasks = subtasks.filter(subtask => 
    nodeTasks.some(task => task.id === subtask.taskId)
  );

  const completedTasks = nodeTasks.filter(task => task.status === 'completed').length;
  const completedSubtasks = nodeSubtasks.filter(subtask => subtask.status === 'done').length;

  const generateSubtasks = async (taskId: string) => {
    const result = await breakdownTask(taskId, node.id);
    if (result) {
      onSubtasksUpdate();
    }
  };

  const addTaskToToday = async (taskId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // First trigger subtask generation if not already done
      const taskSubtasks = subtasks.filter(s => 
        nodeTasks.find(t => t.id === s.taskId)?.id === taskId
      );
      
      if (taskSubtasks.length === 0) {
        await generateSubtasks(taskId);
      }

      // Then build day plan
      const result = await buildDayPlan(today);
      if (result) {
        toast({
          title: "Added to Today!",
          description: "Task has been scheduled in your daily plan.",
        });
      }
    } catch (error) {
      console.error('Failed to add task to today:', error);
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'programming': return 'bg-gaming-info text-white';
      case 'reading': return 'bg-gaming-warning text-white';
      case 'health': return 'bg-gaming-success text-white';
      case 'admin': return 'bg-gaming-rare text-white';
      case 'business': return 'bg-gaming-legendary text-white';
      case 'music': return 'bg-gaming-epic text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'done':
        return <CheckCircle className="w-4 h-4 text-gaming-success" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-gaming-warning animate-spin" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="w-96 h-full border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getDomainColor(node.domain)}>
                {node.domain}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {node.branch}
              </Badge>
            </div>
            <CardTitle className="text-lg">{node.title}</CardTitle>
            <CardDescription className="mt-1">
              {node.description}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{node.progress}%</span>
          </div>
          <Progress value={node.progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completedTasks}/{nodeTasks.length} tasks</span>
            <span>{completedSubtasks}/{nodeSubtasks.length} subtasks</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Tasks & Subtasks
          </h4>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
        </div>

        <ScrollArea className="h-64">
          <div className="space-y-3">
            {nodeTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks linked to this node yet.</p>
              </div>
            ) : (
              nodeTasks.map(task => {
                const taskSubtasks = subtasks.filter(s => s.taskId === task.id);
                
                return (
                  <Card key={task.id} className="border-l-2 border-l-primary/30">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(task.status)}
                        <div className="flex-1">
                          <h5 className="font-medium text-sm mb-1">{task.title}</h5>
                          
                          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{task.estimatedTime}m</span>
                            <Badge variant="outline" className="text-xs">
                              {task.difficulty}
                            </Badge>
                          </div>

                          {taskSubtasks.length > 0 ? (
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground mb-1">
                                Subtasks ({taskSubtasks.filter(s => s.status === 'done').length}/{taskSubtasks.length}):
                              </div>
                              {taskSubtasks.slice(0, 3).map(subtask => (
                                <div key={subtask.id} className="flex items-center gap-2 text-xs pl-2">
                                  {getStatusIcon(subtask.status)}
                                  <span className={subtask.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                                    {subtask.title}
                                  </span>
                                  <span className="text-muted-foreground">({subtask.estMinutes}m)</span>
                                </div>
                              ))}
                              {taskSubtasks.length > 3 && (
                                <div className="text-xs text-muted-foreground pl-6">
                                  +{taskSubtasks.length - 3} more subtasks
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6"
                                onClick={() => generateSubtasks(task.id)}
                                disabled={isGenerating}
                              >
                                <Wand2 className="w-3 h-3 mr-1" />
                                Generate Plan
                              </Button>
                            </div>
                          )}

                          <div className="flex gap-1 mt-2">
                            <Button
                              size="sm"
                              className="text-xs h-6"
                              onClick={() => addTaskToToday(task.id)}
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Add to Today
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};