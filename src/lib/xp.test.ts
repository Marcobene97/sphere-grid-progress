import { describe, it, expect } from 'vitest';
import { xpForLevel, totalXpToReach, getLevelFromTotalXp, getRemainingXp } from './xp';

describe('XP System', () => {
  describe('xpForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(xpForLevel(1)).toBe(0);
    });

    it('should return 100 for level 2', () => {
      expect(xpForLevel(2)).toBe(100);
    });

    it('should grow exponentially by 35%', () => {
      const level2 = xpForLevel(2); // 100
      const level3 = xpForLevel(3); // 100 * 1.35 = 135
      const level4 = xpForLevel(4); // 100 * 1.35^2 = 182
      
      expect(level2).toBe(100);
      expect(level3).toBe(135);
      expect(level4).toBe(182);
    });
  });

  describe('totalXpToReach', () => {
    it('should return 0 for level 1', () => {
      expect(totalXpToReach(1)).toBe(0);
    });

    it('should return correct cumulative XP', () => {
      expect(totalXpToReach(2)).toBe(100);
      expect(totalXpToReach(3)).toBe(235); // 100 + 135
      expect(totalXpToReach(4)).toBe(417); // 100 + 135 + 182
    });
  });

  describe('getLevelFromTotalXp', () => {
    it('should return level 1 for 0 XP', () => {
      expect(getLevelFromTotalXp(0)).toBe(1);
    });

    it('should return level 1 for XP < 100', () => {
      expect(getLevelFromTotalXp(50)).toBe(1);
      expect(getLevelFromTotalXp(99)).toBe(1);
    });

    it('should return level 2 for 100-234 XP', () => {
      expect(getLevelFromTotalXp(100)).toBe(2);
      expect(getLevelFromTotalXp(200)).toBe(2);
      expect(getLevelFromTotalXp(234)).toBe(2);
    });

    it('should return level 3 for 235-416 XP', () => {
      expect(getLevelFromTotalXp(235)).toBe(3);
      expect(getLevelFromTotalXp(300)).toBe(3);
      expect(getLevelFromTotalXp(416)).toBe(3);
    });

    it('should handle large XP values', () => {
      const level = getLevelFromTotalXp(10000);
      expect(level).toBeGreaterThan(10);
    });
  });

  describe('getRemainingXp', () => {
    it('should calculate progress at level 1', () => {
      const result = getRemainingXp(50);
      expect(result.level).toBe(1);
      expect(result.xpInLevel).toBe(50);
      expect(result.xpForNextLevel).toBe(100);
      expect(result.xpToNextLevel).toBe(50);
      expect(result.progressPercent).toBe(50);
    });

    it('should calculate progress at level 2', () => {
      const result = getRemainingXp(167); // 100 + 67
      expect(result.level).toBe(2);
      expect(result.xpInLevel).toBe(67);
      expect(result.xpForNextLevel).toBe(135);
      expect(result.xpToNextLevel).toBe(68);
      expect(result.progressPercent).toBe(50);
    });

    it('should show 100% progress at exact level threshold', () => {
      const result = getRemainingXp(100);
      expect(result.level).toBe(2);
      expect(result.xpInLevel).toBe(0);
      expect(result.progressPercent).toBe(0);
    });
  });
});
