import { AppState, User, SphereNode, Task, WorkSession, Achievement, Analytics } from '@/types';

const STORAGE_KEY = 'personal-mastery-grid';

// Default initial state
const getInitialState = (): AppState => ({
  user: {
    id: 'user-1',
    name: 'Adventurer',
    level: 1,
    totalXP: 0,
    currentXP: 0,
    xpToNextLevel: 100,
    rank: 'E',
    streaks: {
      current: 0,
      longest: 0,
      lastCompletionDate: '',
    },
    pillars: {
      resilience: 0,
      consistency: 0,
      focus: 0,
    },
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  },
  nodes: getInitialNodes(),
  tasks: [],
  subtasks: [],
  dayPlanSlots: [],
  workSessions: [],
  achievements: getInitialAchievements(),
  analytics: {
    dailyXP: [],
    weeklyXP: [],
    categoryProgress: [],
    streakHistory: [],
    focusData: [],
    completionRates: [],
  },
  settings: {
    dailyXPGoal: 100,
    workSessionLength: 25,
    reminderTime: '09:00',
    soundEnabled: true,
    theme: 'dark',
    dayStart: '06:00',
    dayEnd: '19:00',
    sprintDuration: 45,
    breakDuration: 15,
  },
});

export const DEFAULT_SETTINGS = {
  dailyXPGoal: 200,
  workSessionLength: 25,
  reminderTime: '09:00',
  soundEnabled: true,
  theme: 'dark',
  dayStart: '06:00',
  dayEnd: '19:00',
  sprintDuration: 45,
  breakDuration: 15,
};

const getInitialNodes = (): SphereNode[] => [
  {
    id: 'node-start',
    title: 'Personal Mastery Grid',
    description: 'Your gateway to systematic personal development',
    category: 'milestone' as const,
    branch: 'programming' as const,
    type: 'basic' as const,
    status: 'available' as const,
    position: { x: 0, y: 0 },
    prerequisites: [],
    unlocks: ['foundations', 'finance-basics', 'creative-basics'],
    rewards: {
      xp: 100,
      skills: ['goal-setting', 'planning'],
    },
    progress: 0,
    timeSpent: 0,
    domain: 'general',
    goalType: 'project' as const,
  },
];

const getInitialAchievements = (): Achievement[] => [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Complete your first task',
    icon: '👶',
    rarity: 'common',
    xpReward: 25,
    conditions: [{ type: 'nodes_completed', value: 1 }],
  },
];

export const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...getInitialState(), ...parsed };
    }
  } catch (error) {
    console.error('Failed to load state:', error);
  }
  return getInitialState();
};

export const saveState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};

export const exportData = (): string => {
  const state = loadState();
  return JSON.stringify(state, null, 2);
};

export const importData = (data: string): boolean => {
  try {
    const parsed = JSON.parse(data);
    saveState(parsed);
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};

export const resetData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};