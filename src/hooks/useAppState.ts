import { useState, useEffect, useCallback } from 'react';
import { AppState, User, SphereNode, Task, WorkSession } from '@/types';
import { loadState, saveState } from '@/lib/storage';
import { updateUserProgress, calculateTaskXP, calculateFocusXP } from '@/lib/xp-system';
import { ensureSession } from '@/lib/ensureSession';
import { awardXP, loadTotalXP } from '@/lib/xp';
import { useXP } from './useXP';

export const useAppState = () => {
  const [state, setState] = useState<AppState>(() => loadState());
  const [isInitialized, setIsInitialized] = useState(false);
  const { xp, setXP, addXP } = useXP();

  // Initialize session and load XP on boot
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await ensureSession(); // Ensure anonymous user exists
        const totalXP = await loadTotalXP(); // Load XP from Supabase
        setXP(totalXP); // Update local store
        
        // Update user in state with loaded XP
        setState(prev => ({
          ...prev,
          user: { ...prev.user, totalXP }
        }));
      } catch (error) {
        console.error('Failed to initialize session or load XP:', error);
        // Fallback to localStorage XP
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [setXP]);

  // Auto-save state whenever it changes
  useEffect(() => {
    if (isInitialized) {
      saveState(state);
    }
  }, [state, isInitialized]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, ...updates }
    }));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<SphereNode>) => {
    setState(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }));
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));

    return newTask;
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updatedAt: new Date().toISOString() } 
          : task
      )
    }));
  }, []);

  const completeTask = useCallback(async (taskId: string, actualTime: number, focusScore: number) => {
    setState(prev => {
      const task = prev.tasks.find(t => t.id === taskId);
      if (!task) return prev;

      const xpGained = calculateTaskXP(task, actualTime, focusScore, prev.user);
      const updatedUser = updateUserProgress(
        prev.user,
        xpGained,
        task.category as any,
        {
          consistency: task.category === 'general' ? 1 : 2,
          focus: Math.floor(focusScore / 2),
          resilience: actualTime > task.estimatedTime ? 1 : 0
        }
      );

      // Award XP to Supabase (async, non-blocking)
      awardXP(xpGained, 'task', { 
        taskId, 
        category: task.category, 
        difficulty: task.difficulty,
        actualTime,
        focusScore
      }).then(() => {
        addXP(xpGained); // Update local XP store
      }).catch(error => {
        console.error('Failed to award XP to Supabase:', error);
        addXP(xpGained); // Still update local store as fallback
      });

      // Update task
      const updatedTasks = prev.tasks.map(t => 
        t.id === taskId 
          ? { 
              ...t, 
              status: 'completed' as const,
              completedAt: new Date().toISOString(),
              actualTime,
              updatedAt: new Date().toISOString()
            }
          : t
      );

      // Update associated node progress if exists
      let updatedNodes = prev.nodes;
      if (task.nodeId) {
        updatedNodes = prev.nodes.map(node => {
          if (node.id === task.nodeId) {
            const newProgress = Math.min(100, node.progress + 20);
            const newStatus = newProgress >= 100 ? 'completed' : 'in_progress';
            
            return {
              ...node,
              progress: newProgress,
              status: newStatus as any,
              timeSpent: node.timeSpent + actualTime,
              ...(newProgress >= 100 ? { completedAt: new Date().toISOString() } : {})
            };
          }
          return node;
        });

        // Check for node unlocks
        const completedNode = updatedNodes.find(n => n.id === task.nodeId && n.status === 'completed');
        if (completedNode) {
          updatedNodes = updatedNodes.map(node => {
            if (completedNode.unlocks.includes(node.id) && node.status === 'locked') {
              return { ...node, status: 'available' as any };
            }
            return node;
          });
        }
      }

      return {
        ...prev,
        user: updatedUser,
        tasks: updatedTasks,
        nodes: updatedNodes
      };
    });
  }, []);

  const startWorkSession = useCallback((taskId?: string, nodeId?: string, category: 'programming' | 'finance' | 'music' | 'general' = 'general') => {
    const session: WorkSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId,
      nodeId,
      category,
      startTime: new Date().toISOString(),
      duration: 0,
      focusScore: 8, // Default focus score
      xpEarned: 0,
      type: 'deep_work'
    };

    setState(prev => ({
      ...prev,
      workSessions: [...prev.workSessions, session]
    }));

    return session;
  }, []);

  const endWorkSession = useCallback(async (sessionId: string, focusScore: number, notes?: string, analysis?: any) => {
    setState(prev => {
      const sessionIndex = prev.workSessions.findIndex(s => s.id === sessionId);
      if (sessionIndex === -1) return prev;

      const session = prev.workSessions[sessionIndex];
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - new Date(session.startTime).getTime()) / (1000 * 60));
      
      let focusXP = calculateFocusXP({ ...session, duration, focusScore });
      
      // Apply AI analysis bonuses
      if (analysis?.bonusXP) {
        focusXP += analysis.bonusXP;
      }

      const updatedUser = updateUserProgress(
        prev.user,
        focusXP,
        session.category,
        { 
          focus: Math.floor(focusScore / 2),
          consistency: 1,
          resilience: analysis ? 1 : 0
        }
      );

      // Award XP to Supabase (async, non-blocking)
      awardXP(focusXP, 'session', {
        sessionId,
        category: session.category,
        duration,
        focusScore,
        analysis: analysis ? {
          bonusXP: analysis.bonusXP,
          feedback: analysis.feedback
        } : undefined
      }).then(() => {
        addXP(focusXP); // Update local XP store
      }).catch(error => {
        console.error('Failed to award session XP to Supabase:', error);
        addXP(focusXP); // Still update local store as fallback
      });

      const updatedSession = {
        ...session,
        endTime: endTime.toISOString(),
        duration,
        focusScore,
        xpEarned: focusXP,
        notes,
        analysis: analysis ? {
          feedback: analysis.feedback,
          nextSuggestions: analysis.nextSuggestions,
          bonusXP: analysis.bonusXP
        } : undefined
      };

      const updatedSessions = [...prev.workSessions];
      updatedSessions[sessionIndex] = updatedSession;

      return {
        ...prev,
        user: updatedUser,
        workSessions: updatedSessions
      };
    });
  }, []);

  const unlockAchievement = useCallback((achievementId: string) => {
    setState(prev => ({
      ...prev,
      achievements: prev.achievements.map(achievement => 
        achievement.id === achievementId 
          ? { ...achievement, unlockedAt: new Date().toISOString() }
          : achievement
      )
    }));
  }, []);

  return {
    state,
    isInitialized,
    updateUser,
    updateNode,
    addTask,
    updateTask,
    completeTask,
    startWorkSession,
    endWorkSession,
    unlockAchievement
  };
};