import { useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { Dashboard } from '@/components/Dashboard';
import { SphereNode, Task } from '@/types';
import { RewardNotification } from '@/components/RewardNotification';
import { useXP } from '@/hooks/useXP';
import { levelFromXP } from '@/lib/levels';

const Index = () => {
  const { 
    state, 
    isInitialized,
    updateNode, 
    addTask, 
    updateTask, 
    completeTask, 
    startWorkSession, 
    endWorkSession 
  } = useAppState();
  
  const { xp } = useXP();
  const levelInfo = levelFromXP(xp);
  
  const [rewards, setRewards] = useState<any[]>([]);

  // Show loading state while initializing session and XP
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Initializing your progress...</p>
        </div>
      </div>
    );
  }

  const handleTaskComplete = (taskId: string, actualTime: number, focusScore: number) => {
    const task = state.tasks.find(t => t.id === taskId);
    completeTask(taskId, actualTime, focusScore);
    
    if (task) {
      // Generate rewards for completion
      const newRewards = [
        {
          id: `xp-${Date.now()}`,
          type: 'xp',
          title: 'Task Completed!',
          description: `Great work on "${task.title}"`,
          value: task.xpReward || 50,
          color: 'blue'
        }
      ];

      // Check for level up using synced XP
      const currentLevel = levelInfo.level;
      if (Math.random() > 0.7) { // Simplified level up check
        newRewards.push({
          id: `level-${Date.now()}`,
          type: 'level_up',
          title: 'Level Up!',
          description: `You've reached level ${currentLevel}!`,
          value: currentLevel,
          color: 'gold'
        });
      }

      setRewards(newRewards);
    }
  };

  const handleWorkSessionEnd = (sessionId: string, focusScore: number, notes?: string, analysis?: any) => {
    endWorkSession(sessionId, focusScore, notes, analysis);
    
    if (analysis) {
      // Show AI feedback as rewards
      const newRewards = [
        {
          id: `focus-${Date.now()}`,
          type: 'xp',
          title: 'Focus Session Complete!',
          description: analysis.feedback,
          value: focusScore * 10,
          color: 'purple'
        }
      ];

      if (analysis.bonusXP > 0) {
        newRewards.push({
          id: `bonus-${Date.now()}`,
          type: 'xp',
          title: 'AI Performance Bonus!',
          description: 'Exceptional focus detected',
          value: analysis.bonusXP,
          color: 'green'
        });
      }

      setRewards(newRewards);
    }
  };

  const handleNodeClick = (node: SphereNode) => {
    console.log('Node clicked:', node.title);
    // Could open a detailed view or start working on the node
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    if (taskId === 'new') {
      // Adding a new task
      addTask(updates as any);
    } else {
      updateTask(taskId, updates);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Dashboard
        state={state}
        onTaskComplete={handleTaskComplete}
        onTaskUpdate={handleTaskUpdate}
        onNodeClick={handleNodeClick}
        onNodeUpdate={updateNode}
        onStartWorkSession={startWorkSession}
        onEndWorkSession={handleWorkSessionEnd}
        onAddTask={addTask}
      />
      
      <RewardNotification 
        rewards={rewards}
        onComplete={() => setRewards([])}
      />
    </div>
  );
};

export default Index;
