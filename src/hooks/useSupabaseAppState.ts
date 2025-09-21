import { useState, useEffect, useCallback } from 'react';
import { AppState, User, SphereNode, Task, WorkSession } from '@/types';
import { dataLayer } from '@/lib/supabase-data';
import { supabase } from '@/integrations/supabase/client';
import { updateUserProgress, calculateTaskXP, calculateFocusXP } from '@/lib/xp-system';
import { calcTaskXP } from '@/core/xpEngine';
import { useToast } from '@/hooks/use-toast';

const defaultUser: User = {
  id: '',
  name: 'New User',
  level: 1,
  totalXP: 0,
  currentXP: 0,
  xpToNextLevel: 100,
  rank: 'E',
  streaks: { current: 0, longest: 0, lastCompletionDate: '' },
  pillars: { resilience: 0, consistency: 0, focus: 0 },
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString()
};

const defaultSettings = {
  dailyXPGoal: 200,
  workSessionLength: 25,
  reminderTime: '09:00',
  soundEnabled: true,
  theme: 'dark' as const,
  dayStart: '06:00',
  dayEnd: '19:00',
  sprintDuration: 45,
  breakDuration: 15,
};

export const useSupabaseAppState = () => {
  const [state, setState] = useState<AppState>({
    user: defaultUser,
    nodes: [],
    tasks: [],
    subtasks: [],
    dayPlanSlots: [],
    workSessions: [],
    achievements: [],
    analytics: {
      dailyXP: [],
      weeklyXP: [],
      categoryProgress: [],
      streakHistory: [],
      focusData: [],
      completionRates: []
    },
    settings: defaultSettings
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Initialize auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setState(prev => ({ ...prev, user: defaultUser }));
      }
      setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      setLoading(true);
      
      // Load user profile (create if doesn't exist)
      let profile = await dataLayer.getUserProfile(userId);
      if (!profile) {
        profile = await dataLayer.createUserProfile(userId, defaultUser);
      }

      // Load tasks, nodes, and settings in parallel
      const [tasks, nodes, settings] = await Promise.all([
        dataLayer.getTasks(userId),
        dataLayer.getNodes(userId),
        dataLayer.getUserSettings(userId)
      ]);

      setState(prev => ({
        ...prev,
        user: profile || defaultUser,
        tasks,
        nodes,
        settings: settings || defaultSettings
      }));

    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please refresh and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user?.id) return;

    try {
      const updatedUser = await dataLayer.updateUserProfile(user.id, updates);
      if (updatedUser) {
        setState(prev => ({ ...prev, user: updatedUser }));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error", 
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  }, [user?.id, toast]);

  const updateNode = useCallback(async (nodeId: string, updates: Partial<SphereNode>) => {
    if (!user?.id) return;

    try {
      const updatedNode = await dataLayer.updateNode(nodeId, updates);
      if (updatedNode) {
        setState(prev => ({
          ...prev,
          nodes: prev.nodes.map(node => 
            node.id === nodeId ? updatedNode : node
          )
        }));
      }
    } catch (error) {
      console.error('Error updating node:', error);
      toast({
        title: "Error",
        description: "Failed to update node",
        variant: "destructive",
      });
    }
  }, [user?.id, toast]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user?.id) return null;

    try {
      const newTask = await dataLayer.createTask(user.id, task);
      if (newTask) {
        setState(prev => ({
          ...prev,
          tasks: [newTask, ...prev.tasks]
        }));
        return newTask;
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
    return null;
  }, [user?.id, toast]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    if (!user?.id) return;

    try {
      const updatedTask = await dataLayer.updateTask(taskId, updates);
      if (updatedTask) {
        setState(prev => ({
          ...prev,
          tasks: prev.tasks.map(task => 
            task.id === taskId ? updatedTask : task
          )
        }));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  }, [user?.id, toast]);

  const completeTask = useCallback(async (taskId: string, actualTime: number, focusScore: number) => {
    if (!user?.id) return;

    try {
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      // Calculate XP using the new XP engine
      const xpBreakdown = calcTaskXP({
        difficulty: task.difficulty,
        priority: task.priority,
        estMinutes: task.estimatedTime,
        actualMinutes: actualTime,
        focusScore: focusScore * 10, // Convert to 0-100 scale
        returnedAfterGap: false, // Could be calculated based on user activity
        streakDays: state.user.streaks.current,
        dungeonMode: false // From settings
      });

      // Update task as completed
      const completedTask = await dataLayer.updateTask(taskId, {
        status: 'completed',
        actualTime,
        completedAt: new Date().toISOString()
      });

      if (!completedTask) return;

      // Update user progress
      const updatedUser = updateUserProgress(
        state.user,
        xpBreakdown.cappedXP,
        task.category,
        {
          consistency: task.category === 'general' ? 1 : 2,
          focus: Math.floor(focusScore / 2),
          resilience: actualTime > task.estimatedTime ? 1 : 0
        }
      );

      await dataLayer.updateUserProfile(user.id, updatedUser);

      // Analyze task completion with AI
      try {
        const analysis = await dataLayer.analyzeTaskOutcome({
          estMinutes: task.estimatedTime,
          actualMinutes: actualTime,
          taskTitle: task.title,
          difficulty: task.difficulty,
          focusScore: focusScore
        });

        toast({
          title: "Task Completed!",
          description: `+${xpBreakdown.cappedXP} XP earned. ${analysis.reflection}`,
        });
      } catch (aiError) {
        console.warn('AI analysis failed:', aiError);
        toast({
          title: "Task Completed!",
          description: `+${xpBreakdown.cappedXP} XP earned`,
        });
      }

      // Update state
      setState(prev => ({
        ...prev,
        user: updatedUser,
        tasks: prev.tasks.map(t => t.id === taskId ? completedTask : t)
      }));

    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    }
  }, [user?.id, state.tasks, state.user, toast]);

  const startWorkSession = useCallback(async (taskId?: string, nodeId?: string, category: 'programming' | 'finance' | 'music' | 'general' = 'general') => {
    if (!user?.id) return null;

    try {
      const session: Omit<WorkSession, 'id'> = {
        taskId,
        nodeId,
        category,
        startTime: new Date().toISOString(),
        duration: 0,
        focusScore: 8,
        xpEarned: 0,
        type: 'deep_work'
      };

      const newSession = await dataLayer.createSession(user.id, session);
      if (newSession) {
        setState(prev => ({
          ...prev,
          workSessions: [newSession, ...prev.workSessions]
        }));
        return newSession;
      }
    } catch (error) {
      console.error('Error starting work session:', error);
      toast({
        title: "Error",
        description: "Failed to start work session",
        variant: "destructive",
      });
    }
    return null;
  }, [user?.id, toast]);

  const endWorkSession = useCallback(async (sessionId: string, focusScore: number, notes?: string) => {
    if (!user?.id) return;

    try {
      const session = state.workSessions.find(s => s.id === sessionId);
      if (!session) return;

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - new Date(session.startTime).getTime()) / (1000 * 60));
      const focusXP = calculateFocusXP({ ...session, duration, focusScore });

      const updatedSession = await dataLayer.updateSession(sessionId, {
        endTime: endTime.toISOString(),
        duration,
        focusScore,
        xpEarned: focusXP,
        notes
      });

      if (!updatedSession) return;

      // Update user with focus XP
      const updatedUser = updateUserProgress(
        state.user,
        focusXP,
        session.category,
        { focus: Math.floor(focusScore / 2), consistency: 1, resilience: 0 }
      );

      await dataLayer.updateUserProfile(user.id, updatedUser);

      setState(prev => ({
        ...prev,
        user: updatedUser,
        workSessions: prev.workSessions.map(s => s.id === sessionId ? updatedSession : s)
      }));

      toast({
        title: "Session Completed!",
        description: `+${focusXP} XP earned from ${duration} minute session`,
      });

    } catch (error) {
      console.error('Error ending work session:', error);
      toast({
        title: "Error",
        description: "Failed to end work session",
        variant: "destructive",
      });
    }
  }, [user?.id, state.workSessions, state.user, toast]);

  const generateTasks = useCallback(async (params: {
    goals: string[];
    availableMinutes: number;
    category?: string;
  }) => {
    if (!user?.id) return [];

    try {
      const suggestions = await dataLayer.suggestTasks({
        goals: params.goals,
        currentGridState: {
          unlockedNodes: state.nodes.filter(n => n.status === 'available'),
          completedNodes: state.nodes.filter(n => n.status === 'completed'),
          currentBranch: params.category
        },
        availableMinutes: params.availableMinutes,
        difficultyMix: { basic: 30, intermediate: 50, advanced: 20 }
      });

      return suggestions;
    } catch (error) {
      console.error('Error generating tasks:', error);
      toast({
        title: "Error",
        description: "Failed to generate task suggestions",
        variant: "destructive",
      });
      return [];
    }
  }, [user?.id, state.nodes, toast]);

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
    loading,
    isAuthenticated: !!user,
    updateUser,
    updateNode,
    addTask,
    updateTask,
    completeTask,
    startWorkSession,
    endWorkSession,
    generateTasks,
    unlockAchievement
  };
};