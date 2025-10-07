import { supabase } from '@/integrations/supabase/client';
import { ensureSession } from './ensureSession';
import { xpConfig } from '@/config/xp';

// ========== Legacy functions for backward compatibility ==========
export async function awardXP(amount: number, source = 'session', meta?: any) {
  const user = await ensureSession();
  const { error } = await supabase.from('xp_events').insert({
    user_id: user.id, 
    amount, 
    source, 
    meta
  });
  if (error) throw error;
}

export async function loadTotalXP(): Promise<number> {
  const user = await ensureSession();
  const { data, error } = await supabase.rpc('get_user_total_xp', { user_uuid: user.id });
  if (error) throw error;
  return data ?? 0;
}

// ========== New Progressive XP System ==========

/**
 * Calculate XP required for a specific level
 * @param level Target level (1-based)
 * @returns XP required to reach that level from the previous level
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(xpConfig.baseXP * Math.pow(xpConfig.growth, level - 2));
}

/**
 * Calculate total cumulative XP required to reach a level
 * @param level Target level (1-based)
 * @returns Total XP needed from level 1 to reach this level
 */
export function totalXpToReach(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += xpForLevel(i);
  }
  return total;
}

/**
 * Calculate current level from total XP
 * @param totalXp Total accumulated XP
 * @returns Current level (1-based)
 */
export function getLevelFromTotalXp(totalXp: number): number {
  if (totalXp < 0) return 1;
  
  let level = 1;
  let cumulativeXp = 0;
  
  // Find the highest level where cumulative XP is still <= totalXp
  while (true) {
    const xpForNextLevel = xpForLevel(level + 1);
    if (cumulativeXp + xpForNextLevel > totalXp) break;
    cumulativeXp += xpForNextLevel;
    level++;
  }
  
  return level;
}

/**
 * Calculate XP progress within current level
 * @param totalXp Total accumulated XP
 * @returns Object with current level, XP in level, XP needed for next level, and progress percentage
 */
export function getRemainingXp(totalXp: number): {
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
} {
  const level = getLevelFromTotalXp(totalXp);
  const xpForCurrentLevel = totalXpToReach(level);
  const xpInLevel = totalXp - xpForCurrentLevel;
  const xpForNextLevel = xpForLevel(level + 1);
  const xpToNextLevel = xpForNextLevel - xpInLevel;
  const progressPercent = Math.round((xpInLevel / xpForNextLevel) * 100);
  
  return {
    level,
    xpInLevel,
    xpForNextLevel,
    xpToNextLevel,
    progressPercent,
  };
}