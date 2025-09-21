import { xpForSession, levelFromXP } from './score';

export function simulateWeeks({
  weeks = 8,
  daysPerWeek = 5,
  minutesPerDay = 90,
  difficulty = 'intermediate',
  startXP = 0,
}: {
  weeks?: number; daysPerWeek?: number; minutesPerDay?: number;
  difficulty?: 'basic'|'intermediate'|'advanced'; startXP?: number;
}) {
  let xp = startXP;
  let streak = 0;
  const history: Array<{day:number, xp:number, level:number}> = [];

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const workday = d < daysPerWeek;
      if (workday) {
        streak += 1;
        const gain = xpForSession({ durationMin: minutesPerDay, difficulty, streakDays: streak });
        xp += gain;
      } else {
        streak = 0; // break streak on off-days; adjust if you want "calendar streak"
      }
      const { level } = levelFromXP(xp);
      history.push({ day: w*7 + d + 1, xp, level });
    }
  }
  return { totalXP: xp, ...levelFromXP(xp), history };
}