import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2, Clock, Star } from 'lucide-react';
import { openaiService } from '@/lib/openai-service';
import { TaskCategory, TaskDifficulty, Task } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface TaskGeneratorProps {
  userLevel: number;
  currentSkills: string[];
  onTaskGenerated: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const TaskGenerator = ({ userLevel, currentSkills, onTaskGenerated }: TaskGeneratorProps) => {
  const [category, setCategory] = useState<TaskCategory>('programming');
  const [timeAvailable, setTimeAvailable] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);
  const { toast } = useToast();

  const generateTasks = async () => {
    setIsGenerating(true);
    try {
      const tasks = await openaiService.generateTasks({
        category,
        userLevel,
        currentSkills,
        timeAvailable,
        goals: [`Improve ${category} skills`, 'Build productive habits']
      });

      setGeneratedTasks(tasks);
      toast({
        title: "Tasks Generated!",
        description: `Generated ${tasks.length} personalized tasks for you.`,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate tasks. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addTask = (generatedTask: any) => {
    const newTask = {
      title: generatedTask.title,
      description: generatedTask.description,
      category,
      difficulty: generatedTask.difficulty,
      priority: 3 as const, // Default priority
      xpReward: 0, // Will be calculated on completion
      estimatedTime: generatedTask.estMinutes,
      status: 'pending' as const,
      tags: generatedTask.tags || [],
    };

    onTaskGenerated(newTask);
    toast({
      title: "Task Added!",
      description: `"${generatedTask.title}" has been added to your task list.`,
    });
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'basic': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          AI Task Generator
        </CardTitle>
        <CardDescription>
          Generate personalized tasks based on your level and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(value: TaskCategory) => setCategory(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="programming">Programming</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="music">Music</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Time Available (minutes)</Label>
            <Input
              type="number"
              value={timeAvailable}
              onChange={(e) => setTimeAvailable(Number(e.target.value))}
              min="5"
              max="480"
            />
          </div>
        </div>

        <Button 
          onClick={generateTasks} 
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Tasks...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate Tasks
            </>
          )}
        </Button>

        {generatedTasks.length > 0 && (
          <div className="space-y-3 mt-6">
            <h4 className="font-semibold">Generated Tasks:</h4>
            {generatedTasks.map((task, index) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h5 className="font-medium mb-2">{task.title}</h5>
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getDifficultyColor(task.difficulty)}>
                          {task.difficulty}
                        </Badge>
                        
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {task.estMinutes}m
                        </div>

                        {task.tags?.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => addTask(task)}
                      size="sm"
                    >
                      Add Task
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};