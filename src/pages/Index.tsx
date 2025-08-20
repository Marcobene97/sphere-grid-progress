import { useState } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { Dashboard } from '@/components/Dashboard';
import { SphereNode, Task } from '@/types';

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
        onTaskComplete={completeTask}
        onTaskUpdate={handleTaskUpdate}
        onNodeClick={handleNodeClick}
        onNodeUpdate={updateNode}
        onStartWorkSession={startWorkSession}
        onEndWorkSession={endWorkSession}
      />
    </div>
  );
};

export default Index;
