import { useState } from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle, Clock, Star, Play, Plus } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string, actualTime: number, focusScore: number) => void;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  compact?: boolean;
}

export const TaskList = ({ tasks, onTaskComplete, onTaskUpdate, compact = false }: TaskListProps) => {
  const [completingTask, setCompletingTask] = useState<Task | null>(null);
  const [actualTime, setActualTime] = useState(0);
  const [focusScore, setFocusScore] = useState([8]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'general' as Task['category'],
    difficulty: 'basic' as Task['difficulty'],
    priority: 3 as Task['priority'],
    estimatedTime: 30,
    tags: '',
  });

  const handleCompleteTask = () => {
    if (!completingTask) return;
    
    onTaskComplete(completingTask.id, actualTime, focusScore[0]);
    setCompletingTask(null);
    setActualTime(0);
    setFocusScore([8]);
  };

  const handleAddTask = () => {
    const task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      ...newTask,
      tags: newTask.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      xpReward: getXPReward(newTask.difficulty, newTask.priority),
      status: 'pending',
    };

    onTaskUpdate('new', task as any);
    setNewTask({
      title: '',
      description: '',
      category: 'general',
      difficulty: 'basic',
      priority: 3,
      estimatedTime: 30,
      tags: '',
    });
    setIsAddingTask(false);
  };

  const getXPReward = (difficulty: Task['difficulty'], priority: Task['priority']) => {
    const baseXP = {
      basic: 15,
      intermediate: 75,
      advanced: 225,
    }[difficulty];
    return Math.round(baseXP * (1 + (priority - 1) * 0.2));
  };

  const getDifficultyColor = (difficulty: Task['difficulty']) => {
    switch (difficulty) {
      case 'basic': return 'hsl(var(--gaming-success))';
      case 'intermediate': return 'hsl(var(--gaming-warning))';
      case 'advanced': return 'hsl(var(--destructive))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  const getCategoryIcon = (category: Task['category']) => {
    switch (category) {
      case 'programming': return '💻';
      case 'finance': return '💰';
      case 'music': return '🎵';
      default: return '📋';
    }
  };

  const renderStars = (priority: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < priority ? 'text-gaming-warning fill-current' : 'text-muted-foreground'}`}
      />
    ));
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No active tasks. Time to add some challenges!
          </p>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getCategoryIcon(task.category)}</span>
                  <h4 className="font-medium text-sm">{task.title}</h4>
                  <div className="flex">{renderStars(task.priority)}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {task.estimatedTime}min • +{task.xpReward} XP
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setCompletingTask(task);
                  setActualTime(task.estimatedTime);
                }}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Active Tasks
              </CardTitle>
              <CardDescription>
                {tasks.length} tasks ready to be conquered
              </CardDescription>
            </div>
            <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    Add a new challenge to your quest
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Task title..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Task description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newTask.category} onValueChange={(value: any) => setNewTask({ ...newTask, category: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="programming">💻 Programming</SelectItem>
                          <SelectItem value="finance">💰 Finance</SelectItem>
                          <SelectItem value="music">🎵 Music</SelectItem>
                          <SelectItem value="general">📋 General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select value={newTask.difficulty} onValueChange={(value: any) => setNewTask({ ...newTask, difficulty: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">⭐ Basic</SelectItem>
                          <SelectItem value="intermediate">💎 Intermediate</SelectItem>
                          <SelectItem value="advanced">👑 Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority: {newTask.priority} stars</Label>
                      <Slider
                        value={[newTask.priority]}
                        onValueChange={(value) => setNewTask({ ...newTask, priority: value[0] as any })}
                        max={5}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
                      <Input
                        id="estimatedTime"
                        type="number"
                        value={newTask.estimatedTime}
                        onChange={(e) => setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) || 30 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newTask.tags}
                      onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                      placeholder="tag1, tag2, tag3..."
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Estimated XP Reward: +{getXPReward(newTask.difficulty, newTask.priority)} XP
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTask} disabled={!newTask.title.trim()}>
                    Create Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No active tasks</p>
                <Button onClick={() => setIsAddingTask(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Task
                </Button>
              </div>
            ) : (
              tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(task.category)}</span>
                      <h4 className="font-semibold">{task.title}</h4>
                      <div className="flex">{renderStars(task.priority)}</div>
                      <Badge
                        variant="outline"
                        style={{ borderColor: getDifficultyColor(task.difficulty) }}
                        className="text-xs"
                      >
                        {task.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {task.estimatedTime}min
                      </span>
                      <span>+{task.xpReward} XP</span>
                      {task.tags.length > 0 && (
                        <div className="flex gap-1">
                          {task.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTaskUpdate(task.id, { status: task.status === 'in_progress' ? 'pending' : 'in_progress' })}
                    >
                      {task.status === 'in_progress' ? 'Pause' : 'Start'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setCompletingTask(task);
                        setActualTime(task.estimatedTime);
                      }}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complete Task Dialog */}
      <Dialog open={!!completingTask} onOpenChange={() => setCompletingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              How did it go? Let's calculate your XP reward!
            </DialogDescription>
          </DialogHeader>
          {completingTask && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h3 className="font-semibold">{completingTask.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Estimated: {completingTask.estimatedTime} minutes • Base XP: {completingTask.xpReward}
                </p>
              </div>
              
              <div>
                <Label htmlFor="actualTime">Actual Time Spent (minutes)</Label>
                <Input
                  id="actualTime"
                  type="number"
                  value={actualTime}
                  onChange={(e) => setActualTime(parseInt(e.target.value) || 0)}
                />
              </div>
              
              <div>
                <Label htmlFor="focusScore">Focus Score: {focusScore[0]}/10</Label>
                <Slider
                  value={focusScore}
                  onValueChange={setFocusScore}
                  max={10}
                  min={1}
                  step={1}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How focused were you during this task?
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletingTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteTask}>
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};