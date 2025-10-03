import { useState, useEffect } from 'react';
import { useSessions } from '@/hooks/useSessions';
import { useTasks } from '@/hooks/useTasks';
import { useAppStore } from '@/hooks/useAppStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Square, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function SessionView() {
  const { runningSessionId, setRunningSessionId } = useAppStore();
  const { tasks } = useTasks();
  const { startSession, endSession } = useSessions();
  
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [reflectionQ1, setReflectionQ1] = useState('');
  const [reflectionQ2, setReflectionQ2] = useState('');

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const currentTask = tasks.find((t) => t.id === selectedTaskId);

  useEffect(() => {
    if (!runningSessionId) return;
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [runningSessionId]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!selectedTaskId) return;
    const session = await startSession({
      task_id: selectedTaskId,
      node_id: currentTask?.node_id || undefined,
    });
    setRunningSessionId(session.id);
    setElapsedSeconds(0);
    setSessionNotes('');
  };

  const handleEnd = () => {
    setIsEnding(true);
  };

  const handleConfirmEnd = async () => {
    if (!runningSessionId) return;
    
    const xpEarned = Math.floor(elapsedSeconds / 60) * 10; // 10 XP per minute

    await endSession({
      id: runningSessionId,
      notes: sessionNotes,
      reflection: {
        q1: reflectionQ1,
        q2: reflectionQ2,
      },
      xpEarned,
    });

    // Reset state
    setRunningSessionId(null);
    setElapsedSeconds(0);
    setSessionNotes('');
    setIsEnding(false);
    setReflectionQ1('');
    setReflectionQ2('');
    setSelectedTaskId('');
  };

  if (isEnding && runningSessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 space-y-6">
            <h2 className="text-2xl font-bold">Session Reflection</h2>
            <p className="text-muted-foreground">
              You worked for {formatTime(elapsedSeconds)}. Quick reflection:
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="q1">What did you accomplish?</Label>
                <Textarea
                  id="q1"
                  value={reflectionQ1}
                  onChange={(e) => setReflectionQ1(e.target.value)}
                  rows={3}
                  placeholder="Key wins and progress..."
                />
              </div>

              <div>
                <Label htmlFor="q2">What blocked you or could be improved?</Label>
                <Textarea
                  id="q2"
                  value={reflectionQ2}
                  onChange={(e) => setReflectionQ2(e.target.value)}
                  rows={3}
                  placeholder="Blockers, distractions, lessons..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleConfirmEnd} className="flex-1">
                Complete Session (+{Math.floor(elapsedSeconds / 60) * 10} XP)
              </Button>
              <Button variant="outline" onClick={() => setIsEnding(false)}>
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (runningSessionId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-12 space-y-8">
            <div className="text-center space-y-2">
              <div className="text-6xl font-mono font-bold">{formatTime(elapsedSeconds)}</div>
              <div className="text-lg text-muted-foreground">{currentTask?.title}</div>
            </div>

            <div>
              <Label htmlFor="notes">Session Notes</Label>
              <Textarea
                id="notes"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={6}
                placeholder="Thoughts, progress, blockers..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleEnd} variant="default" className="flex-1 gap-2">
                <Square className="h-4 w-4" />
                End Session
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Est. XP: {Math.floor(elapsedSeconds / 60) * 10}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          <h2 className="text-2xl font-bold">Start Focus Session</h2>

          <div>
            <Label htmlFor="task">Select Task</Label>
            <select
              id="task"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            >
              <option value="">Choose a task...</option>
              {pendingTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.estimated_time} min)
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={handleStart}
            disabled={!selectedTaskId}
            className="w-full gap-2"
          >
            <Play className="h-4 w-4" />
            Start Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
