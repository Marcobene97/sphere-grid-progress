import { Target, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function GoalAligner() {
  const goals = [
    { name: 'Complete Project', progress: 65, status: 'on-track' },
    { name: 'Learn New Skill', progress: 40, status: 'on-track' },
    { name: 'Health Goals', progress: 20, status: 'behind' },
  ];

  return (
    <Card className="border-indigo-200 dark:border-indigo-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-500" />
          <CardTitle>Goal Aligner</CardTitle>
        </div>
        <CardDescription>
          Ensures your daily tasks connect to your bigger life goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {goals.map((goal) => (
          <div key={goal.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{goal.name}</span>
              <div className="flex items-center gap-1">
                {goal.status === 'on-track' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
                <span className="text-muted-foreground">{goal.progress}%</span>
              </div>
            </div>
            <Progress value={goal.progress} className="h-1" />
          </div>
        ))}
        
        <div className="mt-4 p-3 bg-muted rounded-lg text-xs">
          <div className="font-medium mb-1">💡 Today's Alignment</div>
          <p className="text-muted-foreground">
            3 of your tasks support "Complete Project" • Consider adding health-related activities
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
