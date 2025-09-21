import { xpConfig as C } from './config';

export type Difficulty = 'basic' | 'intermediate' | 'advanced';

export type XPContext = {
  durationMin?: number;           // session minutes
  difficulty?: Difficulty;
  streakDays?: number;            // consecutive-day count (0..N)
  // for tasks:
  taskSize?: 'micro' | 'small' | 'medium' | 'big';
  // anti-abuse: pass in today's already-earned task XP to enforce day cap
  todaysTaskXpSoFar?: number;     // optional
  todaysTotalXpSoFar?: number;    // optional
};

// -------- utilities ----------
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const round = (n: number) => Math.round(n);

// -------- level thresholds ----------
export function generateThresholds(): number[] {
  const { base, growth, maxLevels } = C.level;
  const arr: number[] = [];
  for (let i = 0; i < maxLevels; i++) {
    arr.push(Math.round(base * Math.pow(growth, i))); // L1..Lmax (cumulative XP)
  }
  // Prepend 0 so thresholds[0] = 0 XP (level 0 floor)
  return [0, ...arr];
}

// Compute level & next threshold from total XP
export function levelFromXP(totalXP: number) {
  const thresholds = generateThresholds();
  let lvl = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (totalXP >= thresholds[i]) lvl = i;
  }
  const next = thresholds[Math.min(lvl + 1, thresholds.length - 1)];
  const current = thresholds[lvl];
  const progress = lvl < thresholds.length - 1 
    ? ((totalXP - current) / (next - current)) * 100 
    : 100;
  
  return { 
    level: lvl + 1, // Display level (1-based)
    next, 
    current,
    progress: Math.round(progress),
    xpToNext: Math.max(0, next - totalXP),
    thresholds 
  };
}

// -------- XP awards ----------
export function xpForSession(ctx: XPContext): number {
  const m = Math.max(1, Math.floor(ctx.durationMin ?? 0)); // minutes
  const base = m * C.baseXpPerMinute;

  const diffBonus =
    ctx.difficulty ? C.difficultyBonus[ctx.difficulty] : 0;

  const streakPct = clamp((ctx.streakDays ?? 0) * C.streak.dailyPercent, 0, C.streak.maxPercent);
  const streakMult = 1 + streakPct;

  // raw before caps
  const raw = (base + diffBonus) * streakMult;

  // per-session hard cap to prevent marathon farming
  const capped = Math.min(raw, C.sessionXpHardCap);

  return round(capped);
}

export function xpForTask(ctx: XPContext): number {
  if (!ctx.taskSize) return 0;
  const give = C.taskXp[ctx.taskSize];

  // Optional: enforce daily share cap of task XP
  const totalSoFar = ctx.todaysTotalXpSoFar ?? 0;
  const taskSoFar = ctx.todaysTaskXpSoFar ?? 0;
  const maxTaskToday = (totalSoFar + give) * C.taskDailyShareCap;

  // If we've already exceeded the cap, give 0; if near cap, pro-rate
  if (taskSoFar >= maxTaskToday) return 0;
  const allowed = Math.max(0, maxTaskToday - taskSoFar);
  return round(Math.min(give, allowed));
}