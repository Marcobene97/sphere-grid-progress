import { TrendingUp, Zap, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useXP } from '@/hooks/useXP';
import { calcLevel } from '@/core/xpEngine';
import { useEffect } from 'react';

export function ProgressVisualizer() {
  const { xp, loadXP } = useXP();
  const levelInfo = calcLevel(xp);

  useEffect(() => {
    loadXP();
  }, []);

  const progress = (levelInfo.xpIntoLevel / (levelInfo.xpIntoLevel + levelInfo.xpToNext)) * 100;

  return (
    <Card className="border-green-200 dark:border-green-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <CardTitle>Progress Visualizer</CardTitle>
        </div>
        <CardDescription>
          Real-time XP tracking and level progression analytics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              Level {levelInfo.level}
            </span>
            <span className="text-muted-foreground">
              {levelInfo.xpIntoLevel} / {levelInfo.xpIntoLevel + levelInfo.xpToNext} XP
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-muted p-3 rounded-lg">
            <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
            <div className="text-2xl font-bold">{xp}</div>
            <div className="text-xs text-muted-foreground">Total XP</div>
          </div>
          <div className="bg-muted p-3 rounded-lg">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="text-2xl font-bold">{levelInfo.xpToNext}</div>
            <div className="text-xs text-muted-foreground">XP to Next</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
