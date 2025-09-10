import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { User, Task, SphereNode, WorkSession, Achievement, Analytics, AppState } from '@/types';

type DbTask = Database['public']['Tables']['tasks']['Row'];
type DbProfile = Database['public']['Tables']['profiles']['Row'];
type DbNode = Database['public']['Tables']['nodes']['Row'];
type DbSession = Database['public']['Tables']['sessions']['Row'];
type DbAchievement = Database['public']['Tables']['achievements']['Row'];
type DbSettings = Database['public']['Tables']['settings']['Row'];

// Data layer for Supabase integration
export class SupabaseDataLayer {
  
  // Profile/User methods
  async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return this.mapDbProfileToUser(data);
  }

  async createUserProfile(userId: string, userData: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        name: userData.name || 'New User',
        level: userData.level || 1,
        total_xp: userData.totalXP || 0,
        current_xp: userData.currentXP || 0,
        xp_to_next_level: userData.xpToNextLevel || 100,
        rank: userData.rank || 'E',
        current_streak: userData.streaks?.current || 0,
        longest_streak: userData.streaks?.longest || 0,
        resilience_pillar: userData.pillars?.resilience || 0,
        consistency_pillar: userData.pillars?.consistency || 0,
        focus_pillar: userData.pillars?.focus || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    return this.mapDbProfileToUser(data);
  }

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    const updateData: any = {};
    
    if (updates.name) updateData.name = updates.name;
    if (updates.level) updateData.level = updates.level;
    if (updates.totalXP !== undefined) updateData.total_xp = updates.totalXP;
    if (updates.currentXP !== undefined) updateData.current_xp = updates.currentXP;
    if (updates.xpToNextLevel !== undefined) updateData.xp_to_next_level = updates.xpToNextLevel;
    if (updates.rank) updateData.rank = updates.rank;
    if (updates.streaks?.current !== undefined) updateData.current_streak = updates.streaks.current;
    if (updates.streaks?.longest !== undefined) updateData.longest_streak = updates.streaks.longest;
    if (updates.streaks?.lastCompletionDate) updateData.last_completion_date = updates.streaks.lastCompletionDate;
    if (updates.pillars?.resilience !== undefined) updateData.resilience_pillar = updates.pillars.resilience;
    if (updates.pillars?.consistency !== undefined) updateData.consistency_pillar = updates.pillars.consistency;
    if (updates.pillars?.focus !== undefined) updateData.focus_pillar = updates.pillars.focus;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return this.mapDbProfileToUser(data);
  }

  // Task methods
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data.map(this.mapDbTaskToTask);
  }

  async createTask(userId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task | null> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        node_id: task.nodeId || null,
        title: task.title,
        description: task.description,
        category: task.category,
        difficulty: task.difficulty,
        priority: task.priority,
        xp_reward: task.xpReward,
        estimated_time: task.estimatedTime,
        status: task.status,
        tags: task.tags,
        due_date: task.dueDate || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return this.mapDbTaskToTask(data);
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const updateData: any = {};
    
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;
    if (updates.actualTime !== undefined) updateData.actual_time = updates.actualTime;
    if (updates.completedAt) updateData.completed_at = updates.completedAt;
    if (updates.priority !== undefined) updateData.priority = updates.priority;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }

    return this.mapDbTaskToTask(data);
  }

  // Node methods
  async getNodes(userId: string): Promise<SphereNode[]> {
    const { data, error } = await supabase
      .from('nodes')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching nodes:', error);
      return [];
    }

    return data.map(this.mapDbNodeToSphereNode);
  }

  async updateNode(nodeId: string, updates: Partial<SphereNode>): Promise<SphereNode | null> {
    const updateData: any = {};
    
    if (updates.status) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.timeSpent !== undefined) updateData.time_spent = updates.timeSpent;
    if (updates.completedAt) updateData.completed_at = updates.completedAt;
    if (updates.masteredAt) updateData.mastered_at = updates.masteredAt;

    const { data, error } = await supabase
      .from('nodes')
      .update(updateData)
      .eq('id', nodeId)
      .select()
      .single();

    if (error) {
      console.error('Error updating node:', error);
      return null;
    }

    return this.mapDbNodeToSphereNode(data);
  }

  // Session methods
  async createSession(userId: string, session: Omit<WorkSession, 'id'>): Promise<WorkSession | null> {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        task_id: session.taskId || null,
        node_id: session.nodeId || null,
        category: session.category,
        type: session.type,
        start_time: session.startTime,
        end_time: session.endTime || null,
        duration: session.duration,
        focus_score: session.focusScore,
        xp_earned: session.xpEarned,
        notes: session.notes || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return this.mapDbSessionToWorkSession(data);
  }

  async updateSession(sessionId: string, updates: Partial<WorkSession>): Promise<WorkSession | null> {
    const updateData: any = {};
    
    if (updates.endTime) updateData.end_time = updates.endTime;
    if (updates.duration !== undefined) updateData.duration = updates.duration;
    if (updates.focusScore !== undefined) updateData.focus_score = updates.focusScore;
    if (updates.xpEarned !== undefined) updateData.xp_earned = updates.xpEarned;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return null;
    }

    return this.mapDbSessionToWorkSession(data);
  }

  // Settings methods
  async getUserSettings(userId: string): Promise<AppState['settings'] | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return null;
    }

    return {
      dailyXPGoal: data.daily_xp_goal,
      workSessionLength: data.work_session_length,
      reminderTime: data.reminder_time,
      soundEnabled: data.sound_enabled,
      theme: data.theme as 'dark' | 'light'
    };
  }

  async updateUserSettings(userId: string, settings: Partial<AppState['settings']>): Promise<AppState['settings'] | null> {
    const updateData: any = {};
    
    if (settings.dailyXPGoal !== undefined) updateData.daily_xp_goal = settings.dailyXPGoal;
    if (settings.workSessionLength !== undefined) updateData.work_session_length = settings.workSessionLength;
    if (settings.reminderTime !== undefined) updateData.reminder_time = settings.reminderTime;
    if (settings.soundEnabled !== undefined) updateData.sound_enabled = settings.soundEnabled;
    if (settings.theme) updateData.theme = settings.theme;

    const { data, error } = await supabase
      .from('settings')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return null;
    }

    return {
      dailyXPGoal: data.daily_xp_goal,
      workSessionLength: data.work_session_length,
      reminderTime: data.reminder_time,
      soundEnabled: data.sound_enabled,
      theme: data.theme as 'dark' | 'light'
    };
  }

  // AI Integration methods
  async suggestTasks(request: {
    goals: string[];
    currentGridState: any;
    availableMinutes: number;
    difficultyMix: any;
  }): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke('ai-tasks', {
      body: {
        action: 'suggestTasks',
        ...request
      }
    });

    if (error) {
      console.error('Error suggesting tasks:', error);
      throw error;
    }

    return data || [];
  }

  async analyzeTaskOutcome(request: {
    estMinutes: number;
    actualMinutes: number;
    notes?: string;
    taskTitle?: string;
    difficulty?: string;
    focusScore?: number;
  }): Promise<{ reflection: string; tweak: string }> {
    const { data, error } = await supabase.functions.invoke('ai-tasks', {
      body: {
        action: 'analyzeOutcome',
        ...request
      }
    });

    if (error) {
      console.error('Error analyzing task outcome:', error);
      throw error;
    }

    return data;
  }

  // Mapping functions
  private mapDbProfileToUser(profile: DbProfile): User {
    return {
      id: profile.user_id,
      name: profile.name,
      level: profile.level,
      totalXP: profile.total_xp,
      currentXP: profile.current_xp,
      xpToNextLevel: profile.xp_to_next_level,
      rank: profile.rank as any,
      streaks: {
        current: profile.current_streak,
        longest: profile.longest_streak,
        lastCompletionDate: profile.last_completion_date || ''
      },
      pillars: {
        resilience: profile.resilience_pillar,
        consistency: profile.consistency_pillar,
        focus: profile.focus_pillar
      },
      createdAt: profile.created_at,
      lastActiveAt: profile.last_active_at
    };
  }

  private mapDbTaskToTask(task: DbTask): Task {
    return {
      id: task.id,
      title: task.title,
      description: task.description || '',
      category: task.category as any,
      difficulty: task.difficulty as any,
      priority: task.priority as any,
      xpReward: task.xp_reward,
      estimatedTime: task.estimated_time,
      actualTime: task.actual_time || undefined,
      nodeId: task.node_id || undefined,
      status: task.status as any,
      tags: task.tags || [],
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      completedAt: task.completed_at || undefined,
      dueDate: task.due_date || undefined
    };
  }

  private mapDbNodeToSphereNode(node: DbNode): SphereNode {
    return {
      id: node.id,
      title: node.title,
      description: node.description || '',
      category: node.category as any,
      branch: node.branch as any,
      type: node.type as any,
      status: node.status as any,
      position: { x: node.position_x, y: node.position_y },
      prerequisites: node.prerequisites || [],
      unlocks: node.unlocks || [],
      rewards: {
        xp: node.reward_xp,
        skills: node.reward_skills || []
      },
      progress: node.progress,
      timeSpent: node.time_spent,
      completedAt: node.completed_at || undefined,
      masteredAt: node.mastered_at || undefined
    };
  }

  private mapDbSessionToWorkSession(session: DbSession): WorkSession {
    return {
      id: session.id,
      taskId: session.task_id || undefined,
      nodeId: session.node_id || undefined,
      category: session.category as any,
      startTime: session.start_time,
      endTime: session.end_time || undefined,
      duration: session.duration,
      focusScore: session.focus_score,
      xpEarned: session.xp_earned,
      type: session.type as any,
      notes: session.notes || undefined
    };
  }
}

export const dataLayer = new SupabaseDataLayer();