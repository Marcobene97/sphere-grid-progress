import { User, Task } from '@/types';
import { EnhancedTask } from './taskStateMachine';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  category: 'completion' | 'streak' | 'focus' | 'resilience' | 'mastery' | 'special';
  conditions: AchievementCondition[];
  repeatable?: boolean;
  hidden?: boolean;
}

export interface AchievementCondition {
  type: 'tasks_completed' | 'streak_days' | 'focus_minutes' | 'xp_earned' | 'level_reached' | 'comeback_days' | 'branch_mastery' | 'efficiency_ratio';
  value: number;
  category?: 'programming' | 'finance' | 'music' | 'general';
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
  progress?: number;
}

export const ACHIEVEMENT_REGISTRY: Achievement[] = [
  // Completion Achievements
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Complete your first task',
    icon: '⚔️',
    rarity: 'common',
    xpReward: 50,
    category: 'completion',
    conditions: [{ type: 'tasks_completed', value: 1 }]
  },
  {
    id: 'task_slayer_10',
    title: 'Task Slayer',
    description: 'Complete 10 tasks',
    icon: '🗡️',
    rarity: 'common',
    xpReward: 100,
    category: 'completion',
    conditions: [{ type: 'tasks_completed', value: 10 }]
  },
  {
    id: 'task_master_50',
    title: 'Task Master',
    description: 'Complete 50 tasks',
    icon: '⚔️',
    rarity: 'rare',
    xpReward: 500,
    category: 'completion',
    conditions: [{ type: 'tasks_completed', value: 50 }]
  },
  {
    id: 'task_legend_100',
    title: 'Task Legend',
    description: 'Complete 100 tasks',
    icon: '🏆',
    rarity: 'epic',
    xpReward: 1000,
    category: 'completion',
    conditions: [{ type: 'tasks_completed', value: 100 }]
  },

  // Streak Achievements
  {
    id: 'streak_week',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    rarity: 'common',
    xpReward: 200,
    category: 'streak',
    conditions: [{ type: 'streak_days', value: 7 }]
  },
  {
    id: 'streak_month',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🌟',
    rarity: 'rare',
    xpReward: 1000,
    category: 'streak',
    conditions: [{ type: 'streak_days', value: 30 }]
  },
  {
    id: 'streak_century',
    title: 'Centurion',
    description: 'Maintain a 100-day streak',
    icon: '👑',
    rarity: 'legendary',
    xpReward: 5000,
    category: 'streak',
    conditions: [{ type: 'streak_days', value: 100 }]
  },

  // Focus Achievements
  {
    id: 'focus_marathon',
    title: 'Focus Marathon',
    description: 'Complete 240 minutes of focused work in one day',
    icon: '🎯',
    rarity: 'rare',
    xpReward: 300,
    category: 'focus',
    conditions: [{ type: 'focus_minutes', value: 240, timeframe: 'daily' }]
  },
  {
    id: 'deep_worker',
    title: 'Deep Worker',
    description: 'Accumulate 1000 minutes of focused work',
    icon: '🧠',
    rarity: 'epic',
    xpReward: 750,
    category: 'focus',
    conditions: [{ type: 'focus_minutes', value: 1000 }]
  },

  // Resilience Achievements
  {
    id: 'comeback_kid',
    title: 'Comeback Kid',
    description: 'Return to productivity after a 7+ day break',
    icon: '💪',
    rarity: 'rare',
    xpReward: 400,
    category: 'resilience',
    conditions: [{ type: 'comeback_days', value: 7 }],
    repeatable: true
  },
  {
    id: 'phoenix_rising',
    title: 'Phoenix Rising',
    description: 'Return to productivity after a 30+ day break',
    icon: '🔥',
    rarity: 'epic',
    xpReward: 1500,
    category: 'resilience',
    conditions: [{ type: 'comeback_days', value: 30 }],
    repeatable: true
  },

  // Branch Mastery Achievements
  {
    id: 'code_warrior',
    title: 'Code Warrior',
    description: 'Complete 25 programming tasks',
    icon: '💻',
    rarity: 'rare',
    xpReward: 500,
    category: 'mastery',
    conditions: [{ type: 'tasks_completed', value: 25, category: 'programming' }]
  },
  {
    id: 'finance_guru',
    title: 'Finance Guru',
    description: 'Complete 25 finance tasks',
    icon: '💰',
    rarity: 'rare',
    xpReward: 500,
    category: 'mastery',
    conditions: [{ type: 'tasks_completed', value: 25, category: 'finance' }]
  },
  {
    id: 'music_maestro',
    title: 'Music Maestro',
    description: 'Complete 25 music tasks',
    icon: '🎵',
    rarity: 'rare',
    xpReward: 500,
    category: 'mastery',
    conditions: [{ type: 'tasks_completed', value: 25, category: 'music' }]
  },

  // Level Achievements
  {
    id: 'level_10',
    title: 'Rising Star',
    description: 'Reach level 10',
    icon: '⭐',
    rarity: 'common',
    xpReward: 300,
    category: 'mastery',
    conditions: [{ type: 'level_reached', value: 10 }]
  },
  {
    id: 'level_25',
    title: 'Elite Warrior',
    description: 'Reach level 25',
    icon: '🌟',
    rarity: 'rare',
    xpReward: 1000,
    category: 'mastery',
    conditions: [{ type: 'level_reached', value: 25 }]
  },
  {
    id: 'level_50',
    title: 'Legendary Master',
    description: 'Reach level 50',
    icon: '👑',
    rarity: 'legendary',
    xpReward: 5000,
    category: 'mastery',
    conditions: [{ type: 'level_reached', value: 50 }]
  },

  // Efficiency Achievements
  {
    id: 'efficiency_expert',
    title: 'Efficiency Expert',
    description: 'Complete 10 tasks with 90%+ efficiency',
    icon: '⚡',
    rarity: 'rare',
    xpReward: 400,
    category: 'special',
    conditions: [{ type: 'efficiency_ratio', value: 0.9 }]
  }
];

export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  isUnlocked: boolean;
}

export class AchievementEngine {
  static checkAchievements(
    user: User,
    tasks: EnhancedTask[],
    unlockedAchievements: UnlockedAchievement[]
  ): { newAchievements: Achievement[]; progress: AchievementProgress[] } {
    const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId));
    const newAchievements: Achievement[] = [];
    const progress: AchievementProgress[] = [];

    for (const achievement of ACHIEVEMENT_REGISTRY) {
      const isAlreadyUnlocked = unlockedIds.has(achievement.id);
      
      // Skip if already unlocked and not repeatable
      if (isAlreadyUnlocked && !achievement.repeatable) {
        continue;
      }

      const currentProgress = this.calculateProgress(achievement, user, tasks);
      progress.push(currentProgress);

      // Check if achievement should be unlocked
      if (!isAlreadyUnlocked && currentProgress.percentage >= 100) {
        newAchievements.push(achievement);
      }
    }

    return { newAchievements, progress };
  }

  private static calculateProgress(
    achievement: Achievement,
    user: User,
    tasks: EnhancedTask[]
  ): AchievementProgress {
    const condition = achievement.conditions[0]; // Simplified: use first condition
    let currentValue = 0;
    let targetValue = condition.value;

    switch (condition.type) {
      case 'tasks_completed':
        const completedTasks = tasks.filter(t => t.state === 'COMPLETED');
        if (condition.category) {
          currentValue = completedTasks.filter(t => t.category === condition.category).length;
        } else {
          currentValue = completedTasks.length;
        }
        break;

      case 'streak_days':
        currentValue = user.streaks.current;
        break;

      case 'focus_minutes':
        // Would need session data for this - simplified for now
        currentValue = Math.floor(user.pillars.focus / 10); // Rough conversion
        if (condition.timeframe === 'daily') {
          // Would need daily tracking - using total for now
          currentValue = Math.min(currentValue, targetValue);
        }
        break;

      case 'xp_earned':
        currentValue = user.totalXP;
        break;

      case 'level_reached':
        currentValue = user.level;
        break;

      case 'comeback_days':
        // Would need proper comeback tracking - simplified
        const daysSinceLastActive = user.lastActiveAt ? 
          Math.floor((Date.now() - new Date(user.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        currentValue = daysSinceLastActive >= targetValue ? targetValue : 0;
        break;

      case 'efficiency_ratio':
        const efficientTasks = tasks.filter(t => 
          t.state === 'COMPLETED' && 
          t.actualTime && 
          t.estimatedTime &&
          (t.actualTime / t.estimatedTime) <= (1 / condition.value)
        );
        currentValue = efficientTasks.length;
        targetValue = 10; // Default target for efficiency achievements
        break;
    }

    return {
      achievementId: achievement.id,
      currentValue,
      targetValue,
      percentage: Math.min(100, (currentValue / targetValue) * 100),
      isUnlocked: currentValue >= targetValue
    };
  }

  static getAchievementById(id: string): Achievement | undefined {
    return ACHIEVEMENT_REGISTRY.find(a => a.id === id);
  }

  static getAchievementsByCategory(category: Achievement['category']): Achievement[] {
    return ACHIEVEMENT_REGISTRY.filter(a => a.category === category);
  }

  static getUnlockedAchievements(unlockedAchievements: UnlockedAchievement[]): Achievement[] {
    return unlockedAchievements
      .map(ua => this.getAchievementById(ua.achievementId))
      .filter(Boolean) as Achievement[];
  }
}