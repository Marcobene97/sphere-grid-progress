import { User, Task, WorkSession, XP_THRESHOLDS, DIFFICULTY_XP, RANK_THRESHOLDS, UserRank } from '@/types';

export const calculateLevel = (totalXP: number): { level: number; currentXP: number; xpToNextLevel: number } => {
  let level = 1;
  let currentXP = totalXP;
  
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (totalXP >= XP_THRESHOLDS[i]) {
      level = i;
      currentXP = totalXP - XP_THRESHOLDS[i];
      if (i < XP_THRESHOLDS.length - 1) {
        currentXP = totalXP - XP_THRESHOLDS[i];
      }
    } else {
      break;
    }
  }
  
  const nextLevelXP = level < XP_THRESHOLDS.length - 1 ? XP_THRESHOLDS[level + 1] : XP_THRESHOLDS[XP_THRESHOLDS.length - 1];
  const currentLevelXP = XP_THRESHOLDS[level];
  const xpToNextLevel = nextLevelXP - totalXP;
  const xpInCurrentLevel = totalXP - currentLevelXP;
  
  return {
    level: level + 1, // Display level (1-based)
    currentXP: xpInCurrentLevel,
    xpToNextLevel: Math.max(0, xpToNextLevel)
  };
};

export const calculateRank = (totalXP: number): UserRank => {
  const ranks: UserRank[] = ['SSS', 'SS', 'S', 'A', 'B', 'C', 'D', 'E'];
  
  for (const rank of ranks) {
    if (totalXP >= RANK_THRESHOLDS[rank]) {
      return rank;
    }
  }
  
  return 'E';
};

export const calculateTaskXP = (
  task: Task,
  actualTime: number,
  focusScore: number,
  user: User
): number => {
  const baseXP = DIFFICULTY_XP[task.difficulty];
  let xp = baseXP.min + (baseXP.max - baseXP.min) * (task.priority / 5);
  
  // Priority multiplier (1-5 stars)
  const priorityMultiplier = 1 + (task.priority - 1) * 0.2;
  xp *= priorityMultiplier;
  
  // Focus bonus (1-10 focus score)
  const focusMultiplier = 1 + (focusScore - 5) * 0.1;
  xp *= Math.max(0.5, focusMultiplier);
  
  // Time efficiency bonus/penalty
  const timeRatio = actualTime / task.estimatedTime;
  if (timeRatio < 0.8) {
    xp *= 1.2; // Bonus for completing early
  } else if (timeRatio > 1.5) {
    xp *= 0.8; // Penalty for taking too long
  }
  
  // Consistency streak bonus
  const streakMultiplier = 1 + Math.min(user.streaks.current * 0.05, 0.5);
  xp *= streakMultiplier;
  
  // Resilience bonus (for returning after gaps)
  const daysSinceLastActivity = user.lastActiveAt ? 
    Math.floor((Date.now() - new Date(user.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  if (daysSinceLastActivity > 1) {
    const resilienceBonus = Math.min(daysSinceLastActivity * 0.1, 0.3);
    xp *= (1 + resilienceBonus);
  }
  
  return Math.round(xp);
};

export const calculateFocusXP = (session: WorkSession): number => {
  const baseFocusXP = 2; // Base XP per minute of focused work
  const focusMultiplier = session.focusScore / 10;
  const timeBonus = session.duration >= 25 ? 1.5 : 1; // Pomodoro bonus
  
  return Math.round(session.duration * baseFocusXP * focusMultiplier * timeBonus);
};

export const calculateStreakMultiplier = (currentStreak: number): number => {
  if (currentStreak < 3) return 1;
  if (currentStreak < 7) return 1.1;
  if (currentStreak < 14) return 1.2;
  if (currentStreak < 30) return 1.3;
  return 1.5; // Max multiplier for 30+ days
};

export const updateUserProgress = (
  user: User,
  xpGained: number,
  category: 'programming' | 'finance' | 'music' | 'general',
  pillars?: { resilience?: number; consistency?: number; focus?: number }
): User => {
  const newTotalXP = user.totalXP + xpGained;
  const levelInfo = calculateLevel(newTotalXP);
  const newRank = calculateRank(newTotalXP);
  
  // Update streaks
  const now = new Date();
  const lastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
  const daysSinceLastActive = lastActive ? 
    Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  let newStreaks = { ...user.streaks };
  
  if (daysSinceLastActive === 0) {
    // Same day, no streak change
  } else if (daysSinceLastActive === 1) {
    // Next day, continue streak
    newStreaks.current += 1;
    newStreaks.longest = Math.max(newStreaks.longest, newStreaks.current);
  } else if (daysSinceLastActive > 1) {
    // Streak broken, start new
    newStreaks.current = 1;
  }
  
  newStreaks.lastCompletionDate = now.toISOString();
  
  // Update pillars
  const newPillars = {
    resilience: user.pillars.resilience + (pillars?.resilience || 0),
    consistency: user.pillars.consistency + (pillars?.consistency || 0),
    focus: user.pillars.focus + (pillars?.focus || 0),
  };
  
  return {
    ...user,
    totalXP: newTotalXP,
    level: levelInfo.level,
    currentXP: levelInfo.currentXP,
    xpToNextLevel: levelInfo.xpToNextLevel,
    rank: newRank,
    streaks: newStreaks,
    pillars: newPillars,
    lastActiveAt: now.toISOString(),
  };
};

export const getXPToNextRank = (currentXP: number, currentRank: UserRank): number => {
  const ranks: UserRank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
  const currentIndex = ranks.indexOf(currentRank);
  
  if (currentIndex < ranks.length - 1) {
    const nextRank = ranks[currentIndex + 1];
    return RANK_THRESHOLDS[nextRank] - currentXP;
  }
  
  return 0; // Already at max rank
};

export const getMotivationalMessage = (user: User): string => {
  const messages = {
    levelUp: [
      "🎉 Level Up! You're getting stronger!",
      "⚡ New level achieved! Power increased!",
      "🌟 Congratulations! You've ascended to new heights!",
    ],
    streak: [
      "🔥 Streak master! Consistency is your superpower!",
      "💪 Another day, another victory!",
      "⚡ Your dedication is paying off!",
    ],
    rank: [
      "🏆 Rank promotion! You're climbing the ladder!",
      "👑 Elite status achieved! Keep pushing forward!",
      "🎖️ Your skills have been recognized!",
    ],
    general: [
      "💯 Every step counts towards mastery!",
      "🚀 Progress is progress, no matter how small!",
      "⭐ You're building something amazing!",
    ]
  };
  
  if (user.streaks.current > 0 && user.streaks.current % 7 === 0) {
    return messages.streak[Math.floor(Math.random() * messages.streak.length)];
  }
  
  return messages.general[Math.floor(Math.random() * messages.general.length)];
};