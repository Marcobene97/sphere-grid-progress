import { Task } from '@/types';

export type TaskState = 'CREATED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'FAILED';

export interface TaskStateTransition {
  from: TaskState;
  to: TaskState;
  timestamp: string;
  metadata?: {
    pauseReason?: 'manual' | 'idle' | 'tab_hidden';
    completionTime?: number;
    xpAwarded?: number;
  };
}

export interface EnhancedTask extends Omit<Task, 'status'> {
  state: TaskState;
  stateHistory: TaskStateTransition[];
  startedAt?: string;
  pausedAt?: string;
  resumedAt?: string;
  totalPausedTime: number; // milliseconds
  activeTime: number; // milliseconds actually worked
}

export class TaskStateMachine {
  private static validateTransition(from: TaskState, to: TaskState): boolean {
    const validTransitions: Record<TaskState, TaskState[]> = {
      CREATED: ['IN_PROGRESS', 'FAILED'],
      IN_PROGRESS: ['PAUSED', 'COMPLETED', 'FAILED'],
      PAUSED: ['IN_PROGRESS', 'COMPLETED', 'FAILED'],
      COMPLETED: [], // Terminal state
      FAILED: ['CREATED'] // Can be restarted
    };

    return validTransitions[from].includes(to);
  }

  static transition(
    task: EnhancedTask, 
    newState: TaskState, 
    metadata?: TaskStateTransition['metadata']
  ): EnhancedTask {
    if (!this.validateTransition(task.state, newState)) {
      throw new Error(`Invalid transition from ${task.state} to ${newState}`);
    }

    const now = new Date().toISOString();
    const transition: TaskStateTransition = {
      from: task.state,
      to: newState,
      timestamp: now,
      metadata
    };

    let updatedTask: EnhancedTask = {
      ...task,
      state: newState,
      stateHistory: [...task.stateHistory, transition],
      updatedAt: now
    };

    // Handle state-specific logic
    switch (newState) {
      case 'IN_PROGRESS':
        updatedTask = {
          ...updatedTask,
          startedAt: updatedTask.startedAt || now,
          resumedAt: now
        };
        break;

      case 'PAUSED':
        if (task.resumedAt || task.startedAt) {
          const activeStart = task.resumedAt || task.startedAt!;
          const pauseDuration = Date.now() - new Date(activeStart).getTime();
          updatedTask = {
            ...updatedTask,
            pausedAt: now,
            activeTime: task.activeTime + pauseDuration
          };
        }
        break;

      case 'COMPLETED':
        if (task.resumedAt || task.startedAt) {
          const activeStart = task.resumedAt || task.startedAt!;
          const finalDuration = Date.now() - new Date(activeStart).getTime();
          updatedTask = {
            ...updatedTask,
            completedAt: now,
            activeTime: task.activeTime + finalDuration,
            actualTime: Math.round((task.activeTime + finalDuration) / (1000 * 60)) // Convert to minutes
          };
        }
        break;

      case 'FAILED':
        updatedTask = {
          ...updatedTask,
          actualTime: Math.round(task.activeTime / (1000 * 60))
        };
        break;
    }

    return updatedTask;
  }

  static start(task: EnhancedTask): EnhancedTask {
    return this.transition(task, 'IN_PROGRESS');
  }

  static pause(task: EnhancedTask, reason: 'manual' | 'idle' | 'tab_hidden' = 'manual'): EnhancedTask {
    return this.transition(task, 'PAUSED', { pauseReason: reason });
  }

  static resume(task: EnhancedTask): EnhancedTask {
    return this.transition(task, 'IN_PROGRESS');
  }

  static complete(task: EnhancedTask, xpAwarded: number): EnhancedTask {
    const completionTime = Math.round(task.activeTime / (1000 * 60));
    return this.transition(task, 'COMPLETED', { 
      completionTime, 
      xpAwarded 
    });
  }

  static fail(task: EnhancedTask): EnhancedTask {
    return this.transition(task, 'FAILED');
  }

  static restart(task: EnhancedTask): EnhancedTask {
    if (task.state !== 'FAILED') {
      throw new Error('Can only restart failed tasks');
    }
    
    return {
      ...this.transition(task, 'CREATED'),
      activeTime: 0,
      totalPausedTime: 0,
      startedAt: undefined,
      pausedAt: undefined,
      resumedAt: undefined,
      actualTime: undefined,
      completedAt: undefined
    };
  }

  static isActive(task: EnhancedTask): boolean {
    return task.state === 'IN_PROGRESS';
  }

  static isPaused(task: EnhancedTask): boolean {
    return task.state === 'PAUSED';
  }

  static isCompleted(task: EnhancedTask): boolean {
    return task.state === 'COMPLETED';
  }

  static getActiveTime(task: EnhancedTask): number {
    let activeTime = task.activeTime;
    
    // Add current session time if in progress
    if (task.state === 'IN_PROGRESS' && (task.resumedAt || task.startedAt)) {
      const sessionStart = task.resumedAt || task.startedAt!;
      activeTime += Date.now() - new Date(sessionStart).getTime();
    }
    
    return Math.round(activeTime / (1000 * 60)); // Return in minutes
  }

  static getEfficiency(task: EnhancedTask): number | null {
    if (!task.actualTime || !task.estimatedTime) return null;
    return task.actualTime / task.estimatedTime;
  }
}

// Helper function to convert legacy Task to EnhancedTask
export const convertToEnhancedTask = (task: Task): EnhancedTask => {
  const state: TaskState = 
    task.status === 'pending' ? 'CREATED' :
    task.status === 'in_progress' ? 'IN_PROGRESS' :
    task.status === 'completed' ? 'COMPLETED' :
    task.status === 'cancelled' ? 'FAILED' : 'CREATED';

  return {
    ...task,
    state,
    stateHistory: [{
      from: 'CREATED' as TaskState,
      to: state,
      timestamp: task.createdAt
    }],
    activeTime: (task.actualTime || 0) * 60 * 1000, // Convert minutes to milliseconds
    totalPausedTime: 0
  };
};