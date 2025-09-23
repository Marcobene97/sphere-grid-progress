// Updated types for the rebuilt Sphere Grid app

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
  domain: string;
  goalType: 'habit' | 'project' | 'one-off';
  status: NodeStatus;
  position: { x: number; y: number };
  prerequisites: string[];
  unlocks: string[];
  deadline?: string;
  estTotalMinutes?: number;
  timeSpent: number;
  progress: number;
  metadata: {
    xp: number;
    color: string;
    [key: string]: any;
  };
  completedAt?: string;
  masteredAt?: string;
}

export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  priority: number; // 1-5
  estimatedTime: number;
  actualTime?: number;
  xpReward: number;
  nodeId?: string;
  status: TaskStatus;
  context: 'desk' | 'gym' | 'errand' | 'reading' | 'quiet';
  energy: 'low' | 'medium' | 'high';
  valueScore: number; // 1-5
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
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

export type TaskCategory = 'programming' | 'health' | 'finance' | 'learning' | 'general';
export type TaskDifficulty = 'basic' | 'intermediate' | 'advanced';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface XPEvent {
  id: string;
  amount: number;
  source: string;
  meta?: Record<string, any>;
  createdAt: string;
}

export interface AppState {
  user: User;
  nodes: SphereNode[];
  tasks: Task[];
  subtasks: Subtask[];
  dayPlanSlots: DayPlanSlot[];
  xpEvents: XPEvent[];
  isLoading: boolean;
}