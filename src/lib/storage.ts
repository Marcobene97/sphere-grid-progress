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
  },
});

const getInitialNodes = (): SphereNode[] => [
  // Programming Branch
  {
    id: 'prog-1',
    title: 'Setup Development Environment',
    description: 'Install and configure your coding environment',
    category: 'milestone',
    branch: 'programming',
    type: 'basic',
    status: 'available',
    position: { x: 100, y: 100 },
    prerequisites: [],
    unlocks: ['prog-2', 'prog-3'],
    rewards: { xp: 50, skills: ['Environment Setup'] },
    progress: 0,
    timeSpent: 0,
  },
  {
    id: 'prog-2',
    title: 'Learn Basic Syntax',
    description: 'Master fundamental programming concepts',
    category: 'skill',
    branch: 'programming',
    type: 'basic',
    status: 'locked',
    position: { x: 200, y: 50 },
    prerequisites: ['prog-1'],
    unlocks: ['prog-4'],
    rewards: { xp: 75, skills: ['Programming Fundamentals'] },
    progress: 0,
    timeSpent: 0,
  },
  {
    id: 'prog-3',
    title: 'Version Control Mastery',
    description: 'Learn Git and collaborative development',
    category: 'skill',
    branch: 'programming',
    type: 'basic',
    status: 'locked',
    position: { x: 200, y: 150 },
    prerequisites: ['prog-1'],
    unlocks: ['prog-4'],
    rewards: { xp: 75, skills: ['Version Control'] },
    progress: 0,
    timeSpent: 0,
  },
  {
    id: 'prog-4',
    title: 'Build First Project',
    description: 'Create a complete application from scratch',
    category: 'project',
    branch: 'programming',
    type: 'intermediate',
    status: 'locked',
    position: { x: 350, y: 100 },
    prerequisites: ['prog-2', 'prog-3'],
    unlocks: ['prog-5'],
    rewards: { xp: 150, skills: ['Project Development'] },
    progress: 0,
    timeSpent: 0,
  },
  {
    id: 'prog-5',
    title: 'Advanced Patterns',
    description: 'Learn design patterns and architecture',
    category: 'skill',
    branch: 'programming',
    type: 'advanced',
    status: 'locked',
    position: { x: 500, y: 100 },
    prerequisites: ['prog-4'],
    unlocks: [],
    rewards: { xp: 250, skills: ['Software Architecture'] },
    progress: 0,
    timeSpent: 0,
  },
  
  // Finance Branch
  {
    id: 'fin-1',
    title: 'Track Monthly Expenses',
    description: 'Monitor and categorize all expenses',
    category: 'habit',
    branch: 'finance',
    type: 'basic',
    status: 'available',
    position: { x: 100, y: 300 },
    prerequisites: [],
    unlocks: ['fin-2'],
    rewards: { xp: 40, skills: ['Budget Tracking'] },
    progress: 0,
    timeSpent: 0,
  },
  {
    id: 'fin-2',
    title: 'Emergency Fund Goal',
    description: 'Build 3-6 months of expenses in savings',
    category: 'milestone',
    branch: 'finance',
    type: 'intermediate',
    status: 'locked',
    position: { x: 250, y: 300 },
    prerequisites: ['fin-1'],
    unlocks: ['fin-3'],
    rewards: { xp: 200, skills: ['Emergency Planning'] },
    progress: 0,
    timeSpent: 0,
  },
  {
    id: 'fin-3',
    title: 'Investment Portfolio',
    description: 'Start investing in diversified assets',
    category: 'milestone',
    branch: 'finance',
    type: 'advanced',
    status: 'locked',
    position: { x: 400, y: 300 },
    prerequisites: ['fin-2'],
    unlocks: [],
    rewards: { xp: 300, skills: ['Investment Strategy'] },
    progress: 0,
    timeSpent: 0,
  },

  // Music Branch
  {
    id: 'mus-1',
    title: 'Daily Practice Routine',
    description: 'Establish consistent music practice',
    category: 'habit',
    branch: 'music',
    type: 'basic',
    status: 'available',
    position: { x: 100, y: 500 },
    prerequisites: [],
    unlocks: ['mus-2'],
    rewards: { xp: 30, skills: ['Music Practice'] },
    progress: 0,
    timeSpent: 0,
  },
  {
    id: 'mus-2',
    title: 'Learn 10 Songs',
    description: 'Master 10 complete songs',
    category: 'milestone',
    branch: 'music',
    type: 'intermediate',
    status: 'locked',
    position: { x: 250, y: 500 },
    prerequisites: ['mus-1'],
    unlocks: ['mus-3'],
    rewards: { xp: 150, skills: ['Song Performance'] },
    progress: 0,
    timeSpent: 0,
  },
  {
    id: 'mus-3',
    title: 'Music Theory Mastery',
    description: 'Understand scales, chords, and composition',
    category: 'skill',
    branch: 'music',
    type: 'advanced',
    status: 'locked',
    position: { x: 400, y: 500 },
    prerequisites: ['mus-2'],
    unlocks: [],
    rewards: { xp: 250, skills: ['Music Theory'] },
    progress: 0,
    timeSpent: 0,
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
  {
    id: 'streak-warrior',
    title: 'Streak Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    rarity: 'rare',
    xpReward: 100,
    conditions: [{ type: 'streak', value: 7 }],
  },
  {
    id: 'level-up',
    title: 'Level Up!',
    description: 'Reach level 5',
    icon: '⭐',
    rarity: 'rare',
    xpReward: 150,
    conditions: [{ type: 'level_reached', value: 5 }],
  },
  {
    id: 'master-programmer',
    title: 'Code Master',
    description: 'Complete all programming nodes',
    icon: '💻',
    rarity: 'legendary',
    xpReward: 500,
    conditions: [{ type: 'nodes_completed', value: 5, category: 'programming' }],
  },
];

export const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with initial state to handle new fields
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