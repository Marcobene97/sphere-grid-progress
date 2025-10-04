# AI Daily Planner

## Purpose
Generates a time-blocked daily schedule optimized for energy levels and task priorities.

## Inputs
```typescript
{
  date: string;  // YYYY-MM-DD
  constraints?: {
    workStart?: string;      // HH:MM, default "09:00"
    workEnd?: string;        // HH:MM, default "18:00"
    breakInterval?: number;  // minutes, default 90
  };
}
```

## Outputs
```typescript
{
  slots: Array<{
    startTime: string;  // HH:MM
    endTime: string;    // HH:MM
    taskTitle: string;
    taskId?: string;
    reasoning?: string;
  }>;
  unscheduled: string[]; // Task IDs that didn't fit
  summary: string;
}
```

## Dependencies
- **Edge Function:** `ai-daily-plan`
- **Model:** gpt-4o-mini
- **Env Vars:** `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- **Tables:** `tasks`, `day_plan_slots`
- **Prompt:** `src/ai/prompts/daily-planner.v1.md`

## Client Usage
```typescript
import { supabase } from '@/integrations/supabase/client';

async function generateDailyPlan(date: string) {
  const { data, error } = await supabase.functions.invoke('ai-daily-plan', {
    body: { date },
  });

  if (error) throw error;
  return data;
}
```

## Known Failure Modes

### 1. Overcommitment
**Symptom:** Schedules 12+ hours of work in 8-hour day  
**Cause:** AI ignores realistic time constraints  
**Mitigation:** Client-side validation rejects overlapping/impossible schedules

### 2. Ignores Energy Levels
**Symptom:** High-focus tasks scheduled in afternoon  
**Cause:** Prompt not emphasizing energy optimization  
**Mitigation:** v1 prompt explicitly places high-energy tasks in morning

### 3. Missing Tasks
**Symptom:** Some tasks in unscheduled list despite available time  
**Cause:** AI prioritization logic excludes lower-priority items  
**Mitigation:** User can manually schedule unscheduled tasks

## Fallback Strategy
```typescript
// Rule-based fallback when AI fails
function ruleBasedFallback(tasks: Task[], date: string): TimeSlot[] {
  // 1. Sort by priority * valueScore
  // 2. Fill morning (9-12) with high-energy tasks
  // 3. Lunch 12-1
  // 4. Fill afternoon (1-6) with remaining tasks
  // 5. Add 15min breaks between tasks
  return generateRuleBasedSchedule(tasks);
}
```

## Rate Limits
- **OpenAI:** 3,500 RPM
- **Supabase Edge Functions:** 100 req/min per IP

## Metrics (Dev Mode)
```typescript
{
  duration: number;
  tokenEstimate: number;
  promptVersion: string;
  tasksScheduled: number;
  tasksUnscheduled: number;
  success: boolean;
}
```

## Testing
See `scripts/ai_eval/fixtures/daily-planner/` for test cases.
