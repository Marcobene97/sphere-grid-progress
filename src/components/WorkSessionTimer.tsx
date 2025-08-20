import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Square, Timer } from 'lucide-react';

interface WorkSessionTimerProps {
  onStart: (taskId?: string, nodeId?: string) => any;
  onEnd: (sessionId: string, focusScore: number, notes?: string) => void;
  isDungeonMode: boolean;
}

export const WorkSessionTimer = ({ onStart, onEnd, isDungeonMode }: WorkSessionTimerProps) => {
  const [isActive, setIsActive] = useState(false);
  const [time, setTime] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [targetTime] = useState(25 * 60); // 25 minutes in seconds

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

  const handleStop = () => {
    if (sessionId) {
      onEnd(sessionId, 8); // Default focus score
    }
    setIsActive(false);
    setTime(0);
    setSessionId('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = Math.min((time / targetTime) * 100, 100);

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
        <div className="text-center">
          <div className="text-4xl font-bold font-mono">
            {formatTime(time)}
          </div>
          <div className="text-sm text-muted-foreground">
            Target: {formatTime(targetTime)}
          </div>
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
            <Button variant="destructive" onClick={handleStop}>
              <Square className="w-4 h-4 mr-2" />
              End Session
            </Button>
          )}
        </div>

        {isDungeonMode && (
          <div className="text-center text-sm text-destructive font-medium">
            🔥 Dungeon Mode Active: +50% XP Bonus
          </div>
        )}
      </CardContent>
    </Card>
  );
};