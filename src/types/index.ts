// Core data types for the Personal Mastery Grid

export interface User {
  id: string;
  name: string;
  level: number;
  totalXP: number;
  currentXP: number;
  xpToNextLevel: number;
  rank: UserRank;
  streaks: {
    current: number;
    longest: number;
    lastCompletionDate: string;
  };
  pillars: {
    resilience: number;
    consistency: number;
    focus: number;
  };
  createdAt: string;
  lastActiveAt: string;
}

export type UserRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface SphereNode {
  id: string;
  title: string;
  description: string;
  category: NodeCategory;
  branch: NodeBranch;
  type: NodeType;
  status: NodeStatus;
  position: { x: number; y: number };
  prerequisites: string[];
  unlocks: string[];
  rewards: {
    xp: number;
    skills: string[];
  };
  progress: number; // 0-100
  timeSpent: number; // minutes
  completedAt?: string;
  masteredAt?: string;
  // Action Counsellor fields
  parentId?: string;
  domain: string;
  goalType: 'habit' | 'project' | 'one-off';
  deadline?: string;
  estTotalMinutes?: number;
  metadata?: Record<string, any>;
}

export type NodeCategory = 'skill' | 'habit' | 'milestone' | 'project';
export type NodeBranch = 'programming' | 'finance' | 'music';
export type NodeType = 'basic' | 'intermediate' | 'advanced' | 'master';
export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  priority: 1 | 2 | 3 | 4 | 5;
  xpReward: number;
  estimatedTime: number; // minutes
  actualTime?: number; // minutes
  nodeId?: string;
  status: TaskStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  dueDate?: string;
  // Action Counsellor fields
  context: 'desk' | 'gym' | 'errand' | 'reading' | 'quiet';
  energy: 'low' | 'medium' | 'high';
  valueScore: number; // 1-5 perceived impact
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  estMinutes: number;
  earliestStart?: string;
  hardWindow?: { start: string; end: string };
  tags: string[];
  seq: number;
  createdAt: string;
  updatedAt: string;
}

export interface DayPlanSlot {
  id: string;
  date: string;
  slotStart: string;
  slotEnd: string;
  subtaskId?: string;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaskCategory = 'programming' | 'finance' | 'music' | 'general';
export type TaskDifficulty = 'basic' | 'intermediate' | 'advanced';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkSession {
  id: string;
  taskId?: string;
  nodeId?: string;
  category: TaskCategory;
  startTime: string;
  endTime?: string;
  duration: number; // minutes
  focusScore: number; // 1-10
  xpEarned: number;
  type: 'deep_work' | 'practice' | 'learning' | 'review';
  notes?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  unlockedAt?: string;
  conditions: {
    type: 'streak' | 'xp_total' | 'nodes_completed' | 'time_spent' | 'level_reached';
    value: number;
    category?: TaskCategory;
  }[];
}

export interface Analytics {
  dailyXP: { date: string; xp: number }[];
  weeklyXP: { week: string; xp: number }[];
  categoryProgress: { category: TaskCategory; completed: number; total: number }[];
  streakHistory: { date: string; streak: number }[];
  focusData: { date: string; sessions: number; totalMinutes: number; avgFocus: number }[];
  completionRates: { date: string; completed: number; total: number }[];
}

export interface AppState {
  user: User;
  nodes: SphereNode[];
  tasks: Task[];
  subtasks: Subtask[];
  dayPlanSlots: DayPlanSlot[];
  workSessions: WorkSession[];
  achievements: Achievement[];
  analytics: Analytics;
  settings: {
    dailyXPGoal: number;
    workSessionLength: number;
    reminderTime: string;
    soundEnabled: boolean;
    theme: 'dark' | 'light';
    // Action Counsellor settings
    dayStart: string;
    dayEnd: string;
    sprintDuration: number;
    breakDuration: number;
  };
}

// XP Level calculation constants
export const XP_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000,
  13000, 16500, 20500, 25000, 30000, 35500, 41500, 48000, 55000, 62500
];

export const DIFFICULTY_XP = {
  basic: { min: 10, max: 25 },
  intermediate: { min: 50, max: 100 },
  advanced: { min: 150, max: 300 }
};

export const RANK_THRESHOLDS = {
  E: 0,
  D: 1000,
  C: 5000,
  B: 15000,
  A: 35000,
  S: 75000,
  SS: 150000,
  SSS: 300000
};