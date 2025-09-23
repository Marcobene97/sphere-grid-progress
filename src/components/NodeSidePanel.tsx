import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  X, Target, Clock, Trophy, Zap, 
  Play, CheckCircle, BookOpen, Settings 
} from 'lucide-react';
import { SphereNode } from '@/types/new-index';
import { Task } from '@/types/new-index';
import { aiService } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

interface NodeSidePanelProps {
  node: SphereNode | null;
  tasks: Task[];
  onClose: () => void;
  onTaskBreakdown: (taskId: string) => void;
  onNodeUpdate: (nodeId: string, updates: Partial<SphereNode>) => void;
}

export function NodeSidePanel({ 
  node, 
  tasks, 
  onClose, 
  onTaskBreakdown,
  onNodeUpdate 
}: NodeSidePanelProps) {
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const { toast } = useToast();

  if (!node) return null;

  const nodeTasks = tasks.filter(task => task.nodeId === node.id);
  const completedTasks = nodeTasks.filter(task => task.status === 'completed');

  const handleBreakdownAllTasks = async () => {
    if (nodeTasks.length === 0) {
      toast({
        title: "No Tasks",
        description: "Add some tasks to this node first",
        variant: "destructive",
      });
      return;
    }

    setIsBreakingDown(true);
    try {
      for (const task of nodeTasks) {
        if (task.status !== 'completed') {
          await onTaskBreakdown(task.id);
        }
      }
      
      toast({
        title: "Tasks Broken Down!",
        description: `Generated subtasks for ${nodeTasks.length} tasks`,
      });
    } catch (error) {
      console.error('Error breaking down tasks:', error);
      toast({
        title: "Error",
        description: "Failed to break down tasks",
        variant: "destructive",
      });
    } finally {
      setIsBreakingDown(false);
    }
  };

  const handleStatusUpdate = (newStatus: SphereNode['status']) => {
    onNodeUpdate(node.id, { status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'locked': return 'bg-gray-500';
      case 'available': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-purple-500';
      case 'mastered': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'programming': return 'text-cyan-400';
      case 'health': return 'text-green-400';
      case 'finance': return 'text-yellow-400';
      case 'learning': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-50 overflow-y-auto">
      <Card className="h-full rounded-none border-0">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`} />
                {node.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getDomainColor(node.domain)}>
                  {node.domain}
                </Badge>
                <Badge variant="outline">
                  {node.goalType}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          {/* Description */}
          {node.description && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">{node.description}</p>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Progress</Label>
              <span className="text-sm text-muted-foreground">{node.progress}%</span>
            </div>
            <Progress value={node.progress} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span>{node.metadata.xp || 0} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>{node.timeSpent || 0}h</span>
              </div>
            </div>
          </div>

          {/* Status Management */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Status</Label>
            <div className="flex gap-2 flex-wrap">
              {['available', 'in_progress', 'completed', 'mastered'].map((status) => (
                <Button
                  key={status}
                  variant={node.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusUpdate(status as SphereNode['status'])}
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Tasks</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAddTask(!showAddTask)}
              >
                Add Task
              </Button>
            </div>

            {showAddTask && (
              <div className="space-y-2 p-3 border rounded-lg">
                <Input
                  placeholder="Enter task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button size="sm" disabled={!newTaskTitle.trim()}>
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowAddTask(false);
                      setNewTaskTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {nodeTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks assigned to this node
                </p>
              ) : (
                <>
                  {nodeTasks.map((task) => (
                    <div 
                      key={task.id}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <Badge 
                          variant={task.status === 'completed' ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {task.status}
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimatedTime}min</span>
                        <Badge variant="outline" className="text-xs">
                          {task.context}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleBreakdownAllTasks}
                    disabled={isBreakingDown}
                  >
                    {isBreakingDown ? (
                      <>
                        <Settings className="h-4 w-4 mr-2 animate-spin" />
                        Breaking Down...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        AI Breakdown All Tasks
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Statistics */}
          {nodeTasks.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Statistics</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="font-semibold">{completedTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="font-semibold">{nodeTasks.length - completedTasks.length}</div>
                  <div className="text-xs text-muted-foreground">Remaining</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}