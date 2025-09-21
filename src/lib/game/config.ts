// All XP economy knobs live here.
// Tweak base/growth to speed up or slow down the whole curve.

export const xpConfig = {
  // --- Sessions (timed work) ---
  baseXpPerMinute: 0.6,     // was ~1; smaller = slower progress
  sessionXpHardCap: 120,    // max XP awarded per single session
  difficultyBonus: {        // flat bonus per session
    basic: 0,
    intermediate: 8,
    advanced: 20,
  },
  streak: {
    dailyPercent: 0.02,     // +2% per consecutive day
    maxPercent: 0.20,       // capped at +20%
  },

  // --- Tasks (non-timed completions) ---
  taskXp: {
    micro: 2,               // e.g., <5 min
    small: 5,               // ~15 min
    medium: 12,             // ~30–60 min
    big: 25,                // >60 min (use sessions for most of the credit)
  },
  // Optional guard: don't let task-only XP exceed 30% of the day's total
  taskDailyShareCap: 0.30,

  // --- Level curve ---
  // thresholds[n] = round(base * growth^(n-1))
  level: {
    base: 400,              // XP needed to clear Level 1
    growth: 2.2,            // each level costs ~2.2x the previous
    maxLevels: 20,          // generate this many thresholds
  },
} as const;