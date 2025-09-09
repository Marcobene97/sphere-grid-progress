import { Task, WorkSession, User } from '@/types';

export interface XPBreakdown {
  baseXP: number;
  priorityMultiplier: number;
  efficiencyMultiplier: number;
  focusBonus: number;
  streakMultiplier: number;
  resilienceBonus: number;
  dungeonBonus: number;
  totalXP: number;
  cappedXP: number;
}

export interface LevelInfo {
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
  totalXP: number;
}

// Base XP by difficulty
const BASE_XP = {
  basic: 20,
  intermediate: 75,
  advanced: 200
} as const;

// Level thresholds (cumulative)
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1700, 2600, 3800, 5400, 7500
];

// Generate higher levels dynamically: next = prev + 250*level
const generateLevelThreshold = (level: number): number => {
  if (level < LEVEL_THRESHOLDS.length) {
    return LEVEL_THRESHOLDS[level];
  }
  
  let threshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  for (let i = LEVEL_THRESHOLDS.length; i <= level; i++) {
    threshold += 250 * i;
  }
  return threshold;
};

// Rank thresholds by level
export const RANK_THRESHOLDS = {
  E: 0, D: 5, C: 10, B: 15, A: 20, S: 25, SS: 30, SSS: 35
} as const;

export const calcTaskXP = (params: {
  difficulty: 'basic' | 'intermediate' | 'advanced';
  priority: 1 | 2 | 3 | 4 | 5;
  estMinutes: number;
  actualMinutes: number;
  focusScore: number; // 0-100
  returnedAfterGap: boolean;
  streakDays: number;
  dungeonMode?: boolean;
}): XPBreakdown => {
  const {
    difficulty,
    priority,
    estMinutes,
    actualMinutes,
    focusScore,
    returnedAfterGap,
    streakDays,
    dungeonMode = false
  } = params;

  // Base XP
  const baseXP = BASE_XP[difficulty];

  // Priority multiplier: 1.00 to 1.20
  const priorityMultiplier = 1 + (priority - 1) * 0.05;

  // Efficiency multiplier: clamp actual/est to [0.5, 2.0] -> map to [1.20, 0.80]
  const timeRatio = actualMinutes / estMinutes;
  const clampedRatio = Math.max(0.5, Math.min(2.0, timeRatio));
  // Linear mapping: 0.5 -> 1.20, 2.0 -> 0.80
  const efficiencyMultiplier = 1.20 - (clampedRatio - 0.5) * (0.40 / 1.5);

  // Focus bonus: up to +15%
  const focusBonus = 1 + (focusScore / 100) * 0.15;

  // Consistency streak: max +30%
  const streakMultiplier = 1 + Math.min(streakDays, 10) * 0.03;

  // Resilience bonus: +10% once per comeback day
  const resilienceBonus = returnedAfterGap ? 1.10 : 1.0;

  // Dungeon mode bonus: +25%
  const dungeonBonus = dungeonMode ? 1.25 : 1.0;

  // Calculate total before capping
  const totalXP = baseXP * priorityMultiplier * efficiencyMultiplier * focusBonus * streakMultiplier * resilienceBonus * dungeonBonus;

  // Apply hard caps: min 50% of base, max 200% of base
  const cappedXP = Math.max(baseXP * 0.5, Math.min(baseXP * 2.0, totalXP));

  return {
    baseXP,
    priorityMultiplier: Math.round((priorityMultiplier - 1) * 1000) / 10, // Show as percentage
    efficiencyMultiplier: Math.round((efficiencyMultiplier - 1) * 1000) / 10,
    focusBonus: Math.round((focusBonus - 1) * 1000) / 10,
    streakMultiplier: Math.round((streakMultiplier - 1) * 1000) / 10,
    resilienceBonus: Math.round((resilienceBonus - 1) * 1000) / 10,
    dungeonBonus: Math.round((dungeonBonus - 1) * 1000) / 10,
    totalXP: Math.round(totalXP * 10) / 10,
    cappedXP: Math.round(cappedXP)
  };
};

export const calcLevel = (totalXP: number): LevelInfo => {
  let level = 1;
  
  // Find current level
  while (generateLevelThreshold(level) <= totalXP) {
    level++;
  }
  level--; // Adjust back to actual level
  
  const currentLevelXP = generateLevelThreshold(level);
  const nextLevelXP = generateLevelThreshold(level + 1);
  
  return {
    level: level + 1, // Display as 1-based
    xpIntoLevel: totalXP - currentLevelXP,
    xpToNext: nextLevelXP - totalXP,
    totalXP
  };
};

export const calcRank = (level: number): keyof typeof RANK_THRESHOLDS => {
  const ranks = Object.entries(RANK_THRESHOLDS)
    .sort(([,a], [,b]) => b - a) // Sort descending
    .map(([rank]) => rank as keyof typeof RANK_THRESHOLDS);
  
  for (const rank of ranks) {
    if (level >= RANK_THRESHOLDS[rank]) {
      return rank;
    }
  }
  
  return 'E';
};

export const applyPillars = (pillars: {
  resilience: number;
  consistency: number;
  focus: number;
}): number => {
  // Each pillar contributes a small multiplier
  const resilienceMultiplier = 1 + (pillars.resilience / 1000) * 0.1; // Max +10% at 1000 points
  const consistencyMultiplier = 1 + (pillars.consistency / 1000) * 0.1;
  const focusMultiplier = 1 + (pillars.focus / 1000) * 0.1;
  
  return resilienceMultiplier * consistencyMultiplier * focusMultiplier;
};

// Validation functions
export const validateXPCalculation = (breakdown: XPBreakdown): boolean => {
  const recalculated = breakdown.baseXP * 
    (1 + breakdown.priorityMultiplier/100) *
    (1 + breakdown.efficiencyMultiplier/100) *
    (1 + breakdown.focusBonus/100) *
    (1 + breakdown.streakMultiplier/100) *
    (1 + breakdown.resilienceBonus/100) *
    (1 + breakdown.dungeonBonus/100);
    
  return Math.abs(recalculated - breakdown.totalXP) < 0.1;
};