# AI Task Breakdown

## Purpose
Breaks down complex tasks into 3-8 actionable subtasks with time estimates and XP rewards.

## Inputs
```typescript
{
  taskTitle: string;        // 1-200 chars
  taskDescription?: string; // 0-2000 chars
}
```

## Outputs
```typescript
{
  subtasks: Array<{
    title: string;
    estimatedMinutes: number; // 5-120
    xpReward: number;         // 5-200
  }>;
  reasoning?: string;
}
```

## Dependencies
- **Edge Function:** `ai-task-breakdown`
- **Model:** gpt-4o-mini
- **Env Vars:** `OPENAI_API_KEY`
- **Tables:** `tasks`, `subtasks`
- **Prompt:** `src/ai/prompts/task-breakdown.v1.md`

## Client Usage
```typescript
import { supabase } from '@/integrations/supabase/client';
import { TaskBreakdownRequestSchema } from '@/ai/contracts';

async function breakdownTask(taskTitle: string, taskDescription?: string) {
  // Validate input
  const request = TaskBreakdownRequestSchema.parse({ taskTitle, taskDescription });
  
  // Call edge function with streaming
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-task-breakdown`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(request),
    }
  );

  // Stream and parse response
  const reader = response.body?.getReader();
  // ... handle streaming
}
```

## Known Failure Modes

### 1. Invalid JSON Response
**Symptom:** JSON parse error  
**Cause:** AI returns markdown-wrapped JSON or incomplete response  
**Mitigation:** Server strips markdown code blocks before parsing

### 2. Over-granular Breakdown
**Symptom:** 15+ micro-tasks (< 10min each)  
**Cause:** AI interprets "actionable" as "atomic"  
**Mitigation:** Prompt explicitly states 3-8 subtasks

### 3. Timeout on Complex Tasks
**Symptom:** 30s timeout error  
**Cause:** AI taking too long for very complex breakdown  
**Mitigation:** Fallback to simple line-by-line splitting

## Fallback Strategy
```typescript
// Simple fallback when AI fails
function simpleFallback(taskTitle: string): Subtask[] {
  return [
    { title: `Research requirements for ${taskTitle}`, estimatedMinutes: 20, xpReward: 20 },
    { title: `Execute main work on ${taskTitle}`, estimatedMinutes: 45, xpReward: 50 },
    { title: `Review and finalize ${taskTitle}`, estimatedMinutes: 15, xpReward: 15 },
  ];
}
```

## Rate Limits
- **OpenAI:** 3,500 RPM (requests per minute)
- **Supabase Edge Functions:** 100 req/min per IP

## Metrics (Dev Mode)
```typescript
{
  duration: number;          // ms
  tokenEstimate: number;     // approx tokens used
  promptVersion: string;     // e.g., "v1.0.0"
  success: boolean;
  failureReason?: string;
}
```

## Testing
See `scripts/ai_eval/fixtures/task-breakdown/` for test cases.
