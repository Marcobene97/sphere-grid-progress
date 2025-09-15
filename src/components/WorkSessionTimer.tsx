import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, Timer, Brain, Zap } from 'lucide-react';
import { openaiService } from '@/lib/openai-service';

interface WorkSessionTimerProps {
  onStart: (taskId?: string, nodeId?: string) => any;
  onEnd: (sessionId: string, focusScore: number, notes?: string, analysis?: any) => void;
  isDungeonMode: boolean;
  currentTask?: any;
}

export const WorkSessionTimer = ({ onStart, onEnd, isDungeonMode, currentTask }: WorkSessionTimerProps) => {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [targetTime] = useState(25 * 60); // 25 minutes in seconds
  const [focusNotes, setFocusNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showEfficiency, setShowEfficiency] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleStart = () => {
    const session = onStart();
    setSessionId(session.id);
    setIsActive(true);
    setTime(0);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleStop = async () => {
    if (sessionId) {
      setIsAnalyzing(true);
      
      let analysis = null;
      if (currentTask) {
        try {
          analysis = await openaiService.analyzeTaskCompletion(
            currentTask,
            Math.floor(time / 60), // Convert to minutes
            focusNotes
          );
        } catch (error) {
          console.error('Failed to analyze task completion:', error);
        }
      }
      
      const focusScore = analysis?.focusScore || 8;
      onEnd(sessionId, focusScore, focusNotes, analysis);
      setIsAnalyzing(false);
    }
    setIsActive(false);
    setTime(0);
    setSessionId('');
    setFocusNotes('');
    setShowEfficiency(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((time / targetTime) * 100, 100);
  
  // Calculate efficiency indicators
  const estimatedTime = currentTask?.estimatedTime ? currentTask.estimatedTime * 60 : targetTime;
  const efficiencyRatio = time > 0 ? estimatedTime / time : 1;
  const isAheadOfSchedule = time < estimatedTime && time > 0;
  const isBehindSchedule = time > estimatedTime * 1.2;

  return (
    <Card className={isDungeonMode ? 'border-destructive bg-gradient-to-br from-destructive/5 to-destructive/10' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          {isDungeonMode ? 'Dungeon Session' : 'Focus Session'}
        </CardTitle>
        <CardDescription>
          {isDungeonMode ? 'Intensive focus mode with bonus XP' : 'Deep work timer for maximum productivity'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className="text-4xl font-bold font-mono">
            {formatTime(time)}
          </div>
          <div className="text-sm text-muted-foreground">
            Target: {formatTime(targetTime)}
          </div>
          
          {currentTask && time > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              {isAheadOfSchedule && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Zap className="w-3 h-3" />
                  <span>Ahead of schedule!</span>
                </div>
              )}
              {isBehindSchedule && (
                <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                  <Brain className="w-3 h-3" />
                  <span>Take your time</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEfficiency(!showEfficiency)}
                className="text-xs h-6 px-2"
              >
                Efficiency: {(efficiencyRatio * 100).toFixed(0)}%
              </Button>
            </div>
          )}
        </div>

        <Progress value={progress} className="h-2" />

        <div className="flex justify-center gap-2">
          {!isActive && time === 0 && (
            <Button onClick={handleStart} className={isDungeonMode ? 'bg-destructive hover:bg-destructive/90' : ''}>
              <Play className="w-4 h-4 mr-2" />
              Start Session
            </Button>
          )}
          
          {isActive && (
            <Button variant="outline" onClick={handlePause}>
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          {!isActive && time > 0 && (
            <Button onClick={() => setIsActive(true)}>
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}
          
          {time > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleStop}
              disabled={isAnalyzing}
            >
              <Square className="w-4 h-4 mr-2" />
              {isAnalyzing ? 'Analyzing...' : 'End Session'}
            </Button>
          )}
        </div>

        {time > 0 && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="focusNotes" className="text-sm font-medium">
                Focus Notes (Optional)
              </Label>
              <Textarea
                id="focusNotes"
                placeholder="How was your focus? Any distractions or insights?"
                value={focusNotes}
                onChange={(e) => setFocusNotes(e.target.value)}
                className="min-h-[60px]"
              />
            </div>
          </div>
        )}

        {isDungeonMode && (
          <div className="text-center text-sm text-destructive font-medium">
            🔥 Dungeon Mode Active: +50% XP Bonus
          </div>
        )}
      </CardContent>
    </Card>
  );
};