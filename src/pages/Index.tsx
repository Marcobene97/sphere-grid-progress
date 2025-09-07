import { useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { Dashboard } from '@/components/Dashboard';
import { SphereNode, Task } from '@/types';
import { RewardNotification } from '@/components/RewardNotification';

const Index = () => {
  const { 
    state, 
    updateNode, 
    addTask, 
    updateTask, 
    completeTask, 
    startWorkSession, 
    endWorkSession 
  } = useAppState();
  
  const [rewards, setRewards] = useState<any[]>([]);

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

      // Check for level up (simplified simulation)
      if (Math.random() > 0.7) {
        newRewards.push({
          id: `level-${Date.now()}`,
          type: 'level_up',
          title: 'Level Up!',
          description: 'Your skills have grown stronger!',
          value: state.user.level + 1,
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
