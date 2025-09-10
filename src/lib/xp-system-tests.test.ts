import { describe, it, expect } from 'vitest';
import { calcTaskXP, calcLevel, calcRank } from '../core/xpEngine';

describe('XP Engine', () => {
  describe('calcTaskXP', () => {
    it('should calculate basic XP correctly', () => {
      const result = calcTaskXP({
        difficulty: 'basic',
        priority: 3,
        estMinutes: 30,
        actualMinutes: 30,
        focusScore: 80,
        returnedAfterGap: false,
        streakDays: 0
      });

      expect(result.baseXP).toBe(20);
      expect(result.cappedXP).toBeGreaterThan(0);
      expect(result.cappedXP).toBeLessThanOrEqual(result.baseXP * 2);
    });

    it('should apply efficiency multiplier correctly', () => {
      const efficient = calcTaskXP({
        difficulty: 'basic',
        priority: 3,
        estMinutes: 60,
        actualMinutes: 30, // 2x faster
        focusScore: 80,
        returnedAfterGap: false,
        streakDays: 0
      });

      const inefficient = calcTaskXP({
        difficulty: 'basic',
        priority: 3,
        estMinutes: 30,
        actualMinutes: 60, // 2x slower
        focusScore: 80,
        returnedAfterGap: false,
        streakDays: 0
      });

      expect(efficient.cappedXP).toBeGreaterThan(inefficient.cappedXP);
    });

    it('should apply streak multiplier', () => {
      const noStreak = calcTaskXP({
        difficulty: 'basic',
        priority: 3,
        estMinutes: 30,
        actualMinutes: 30,
        focusScore: 80,
        returnedAfterGap: false,
        streakDays: 0
      });

      const withStreak = calcTaskXP({
        difficulty: 'basic',
        priority: 3,
        estMinutes: 30,
        actualMinutes: 30,
        focusScore: 80,
        returnedAfterGap: false,
        streakDays: 10
      });

      expect(withStreak.cappedXP).toBeGreaterThan(noStreak.cappedXP);
      expect(withStreak.streakMultiplier).toBe(30); // 10 * 3% = 30%
    });

    it('should apply dungeon mode bonus', () => {
      const normal = calcTaskXP({
        difficulty: 'basic',
        priority: 3,
        estMinutes: 30,
        actualMinutes: 30,
        focusScore: 80,
        returnedAfterGap: false,
        streakDays: 0,
        dungeonMode: false
      });

      const dungeon = calcTaskXP({
        difficulty: 'basic',
        priority: 3,
        estMinutes: 30,
        actualMinutes: 30,
        focusScore: 80,
        returnedAfterGap: false,
        streakDays: 0,
        dungeonMode: true
      });

      expect(dungeon.cappedXP).toBeGreaterThan(normal.cappedXP);
      expect(dungeon.dungeonBonus).toBe(25); // 25% bonus
    });

    it('should cap XP at 200% of base', () => {
      const result = calcTaskXP({
        difficulty: 'basic',
        priority: 5, // Max priority
        estMinutes: 60,
        actualMinutes: 10, // Super efficient
        focusScore: 100, // Perfect focus
        returnedAfterGap: true, // Resilience bonus
        streakDays: 10, // Good streak
        dungeonMode: true // Dungeon bonus
      });

      expect(result.cappedXP).toBeLessThanOrEqual(result.baseXP * 2);
    });

    it('should not go below 50% of base XP', () => {
      const result = calcTaskXP({
        difficulty: 'basic',
        priority: 1, // Min priority
        estMinutes: 10,
        actualMinutes: 60, // Very inefficient
        focusScore: 0, // No focus
        returnedAfterGap: false,
        streakDays: 0
      });

      expect(result.cappedXP).toBeGreaterThanOrEqual(result.baseXP * 0.5);
    });
  });

  describe('calcLevel', () => {
    it('should calculate level 1 for 0 XP', () => {
      const result = calcLevel(0);
      expect(result.level).toBe(1);
      expect(result.xpIntoLevel).toBe(0);
      expect(result.xpToNext).toBe(100);
    });

    it('should calculate level 2 for 100 XP', () => {
      const result = calcLevel(100);
      expect(result.level).toBe(2);
      expect(result.xpIntoLevel).toBe(0);
      expect(result.xpToNext).toBe(150); // 250 - 100
    });

    it('should calculate partial progress correctly', () => {
      const result = calcLevel(150);
      expect(result.level).toBe(2);
      expect(result.xpIntoLevel).toBe(50); // 150 - 100
      expect(result.xpToNext).toBe(100); // 250 - 150
    });

    it('should handle high levels', () => {
      const result = calcLevel(10000);
      expect(result.level).toBeGreaterThan(10);
      expect(result.xpIntoLevel).toBeGreaterThanOrEqual(0);
      expect(result.xpToNext).toBeGreaterThan(0);
    });
  });

  describe('calcRank', () => {
    it('should return E rank for low levels', () => {
      expect(calcRank(0)).toBe('E');
      expect(calcRank(4)).toBe('E');
    });

    it('should return D rank for levels 5-9', () => {
      expect(calcRank(5)).toBe('D');
      expect(calcRank(9)).toBe('D');
    });

    it('should return SSS rank for highest levels', () => {
      expect(calcRank(35)).toBe('SSS');
      expect(calcRank(100)).toBe('SSS');
    });

    it('should return correct ranks for middle levels', () => {
      expect(calcRank(10)).toBe('C');
      expect(calcRank(15)).toBe('B');
      expect(calcRank(20)).toBe('A');
      expect(calcRank(25)).toBe('S');
      expect(calcRank(30)).toBe('SS');
    });
  });
});