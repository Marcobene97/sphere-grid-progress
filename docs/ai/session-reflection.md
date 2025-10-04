# AI Session Reflection

## Purpose
Generates focused reflection questions after work sessions to capture learning and blockers.

## Inputs
```typescript
{
  sessionId: string;
  taskTitle: string;
  durationMinutes: number;  // 1-480
  notes?: string;
  completed: boolean;
}
```

## Outputs
```typescript
{
  prompts: Array<{
    question: string;
    placeholder?: string;
  }>;  // Always exactly 2 questions
  nextStepSuggestion?: string;
  xpBonus?: number;  // 0-50
}
```

## Dependencies
- **Edge Function:** TBD (needs implementation)
- **Model:** gpt-4o-mini
- **Env Vars:** `OPENAI_API_KEY`
- **Tables:** `sessions`
- **Prompt:** `src/ai/prompts/session-reflection.v1.md`

## Client Usage
```typescript
// Not yet implemented - needs new edge function
async function generateReflection(sessionData: ReflectionRequest) {
  const { data, error } = await supabase.functions.invoke('ai-reflection', {
    body: sessionData,
  });

  if (error) throw error;
  return data;
}
```

## Known Failure Modes

### 1. Generic Questions
**Symptom:** Same questions for all task types  
**Cause:** AI not using task context  
**Mitigation:** Prompt emphasizes task-specific questions

### 2. Too Many Questions
**Symptom:** 3+ questions generated  
**Cause:** AI ignoring "exactly 2" instruction  
**Mitigation:** Client truncates to first 2 questions

## Fallback Strategy
```typescript
// Fixed questions when AI fails
function simpleFallback(completed: boolean): ReflectionResponse {
  return {
    prompts: [
      { question: 'What was the most challenging part?', placeholder: 'e.g., debugging the API...' },
      { question: 'What would you do differently next time?', placeholder: 'e.g., break into smaller steps...' }
    ],
    xpBonus: completed ? 10 : 5,
  };
}
```

## XP Bonus Logic
- **Completed task:** 10-20 XP
- **Made progress:** 5-10 XP
- **Struggled but learned:** 15-25 XP (bonus for perseverance)

## Rate Limits
- **OpenAI:** 3,500 RPM
- **Supabase Edge Functions:** 100 req/min per IP

## Status
⚠️ **Not yet implemented** - needs new edge function

## Testing
See `scripts/ai_eval/fixtures/session-reflection/` for test cases (when implemented).
