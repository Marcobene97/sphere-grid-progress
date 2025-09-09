import { useState, useCallback } from 'react';
import { User } from '@/types';
import { Achievement, AchievementEngine } from '@/core/achievements';
import { EnhancedTask } from '@/core/taskStateMachine';
import { calcLevel, calcRank } from '@/core/xpEngine';

export interface Reward {
  id: string;
  type: 'xp' | 'level_up' | 'rank_up' | 'streak' | 'achievement';
  title: string;
  description: string;
  value: number;
  icon?: React.ReactNode;
  color: string;
}

export interface RewardState {
  rewards: Reward[];
  isVisible: boolean;
}

export const useRewards = () => {
  const [rewardState, setRewardState] = useState<RewardState>({
    rewards: [],
    isVisible: false
  });

  const checkForRewards = useCallback((
    oldUser: User,
    newUser: User,
    tasks: EnhancedTask[],
    unlockedAchievements: any[]
  ): Reward[] => {
    const rewards: Reward[] = [];

    // Check for XP gain
    if (newUser.totalXP > oldUser.totalXP) {
      const xpGained = newUser.totalXP - oldUser.totalXP;
      rewards.push({
        id: `xp-${Date.now()}`,
        type: 'xp',
        title: 'XP Gained!',
        description: `You earned ${xpGained} experience points`,
        value: xpGained,
        color: 'blue'
      });
    }

    // Check for level up
    if (newUser.level > oldUser.level) {
      rewards.push({
        id: `level-${Date.now()}`,
        type: 'level_up',
        title: 'Level Up!',
        description: `Congratulations! You've reached level ${newUser.level}`,
        value: newUser.level,
        color: 'gold'
      });
    }

    // Check for rank up
    const oldRank = calcRank(oldUser.level);
    const newRank = calcRank(newUser.level);
    if (oldRank !== newRank) {
      rewards.push({
        id: `rank-${Date.now()}`,
        type: 'rank_up',
        title: 'Rank Promotion!',
        description: `You've been promoted to ${newRank} rank!`,
        value: 0,
        color: 'purple'
      });
    }

    // Check for streak milestone
    if (newUser.streaks.current > oldUser.streaks.current && newUser.streaks.current % 7 === 0) {
      rewards.push({
        id: `streak-${Date.now()}`,
        type: 'streak',
        title: 'Streak Milestone!',
        description: `Amazing! You've maintained a ${newUser.streaks.current}-day streak`,
        value: newUser.streaks.current,
        color: 'green'
      });
    }

    // Check for new achievements
    try {
      const { newAchievements } = AchievementEngine.checkAchievements(
        newUser,
        tasks,
        unlockedAchievements
      );

      newAchievements.forEach(achievement => {
        rewards.push({
          id: `achievement-${achievement.id}-${Date.now()}`,
          type: 'achievement',
          title: `Achievement Unlocked!`,
          description: `${achievement.title}: ${achievement.description}`,
          value: achievement.xpReward,
          color: getAchievementColor(achievement.rarity)
        });
      });
    } catch (error) {
      console.warn('Failed to check achievements:', error);
    }

    return rewards;
  }, []);

  const showRewards = useCallback((rewards: Reward[]) => {
    if (rewards.length > 0) {
      setRewardState({
        rewards,
        isVisible: true
      });
    }
  }, []);

  const hideRewards = useCallback(() => {
    setRewardState({
      rewards: [],
      isVisible: false
    });
  }, []);

  const createXPReward = useCallback((xpGained: number): Reward => ({
    id: `xp-${Date.now()}`,
    type: 'xp',
    title: 'XP Gained!',
    description: `You earned ${xpGained} experience points`,
    value: xpGained,
    color: 'blue'
  }), []);

  const createLevelUpReward = useCallback((newLevel: number): Reward => ({
    id: `level-${Date.now()}`,
    type: 'level_up',
    title: 'Level Up!',
    description: `Congratulations! You've reached level ${newLevel}`,
    value: newLevel,
    color: 'gold'
  }), []);

  const createStreakReward = useCallback((streakDays: number): Reward => ({
    id: `streak-${Date.now()}`,
    type: 'streak',
    title: 'Streak Power!',
    description: `You're on fire! ${streakDays}-day streak maintained`,
    value: streakDays,
    color: 'green'
  }), []);

  const createAchievementReward = useCallback((achievement: Achievement): Reward => ({
    id: `achievement-${achievement.id}-${Date.now()}`,
    type: 'achievement',
    title: achievement.title,
    description: achievement.description,
    value: achievement.xpReward,
    color: getAchievementColor(achievement.rarity)
  }), []);

  return {
    rewardState,
    checkForRewards,
    showRewards,
    hideRewards,
    createXPReward,
    createLevelUpReward,
    createStreakReward,
    createAchievementReward
  };
};

const getAchievementColor = (rarity: string): string => {
  switch (rarity) {
    case 'common':
      return 'blue';
    case 'rare':
      return 'purple';
    case 'epic':
      return 'gold';
    case 'legendary':
      return 'purple';
    default:
      return 'blue';
  }
};