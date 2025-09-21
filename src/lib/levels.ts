export const thresholds = [0, 250, 750, 2000, 5000, 12000, 25000, 50000, 100000, 200000];

export function levelFromXP(xp: number) {
  let level = 0;
  for (let i = 0; i < thresholds.length; i++) {
    if (xp >= thresholds[i]) level = i;
  }
  const next = thresholds[Math.min(level + 1, thresholds.length - 1)];
  const current = thresholds[level];
  const progress = level < thresholds.length - 1 
    ? ((xp - current) / (next - current)) * 100 
    : 100;
  
  return { 
    level: level + 1, // Display level (1-based)
    next, 
    current,
    progress: Math.round(progress),
    xpToNext: Math.max(0, next - xp)
  };
}