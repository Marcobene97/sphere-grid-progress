# AI Inbox Atomizer

## Purpose
Converts raw brain dump text into structured, actionable tasks with confidence scoring.

## Inputs
```typescript
{
  content: string;  // 1-5000 chars
  contextNodes?: Array<{
    id: string;
    title: string;
    domain: string;
  }>;
}
```

## Outputs
```typescript
{
  tasks: Array<{
    title: string;
    description?: string;
    nodeId?: string;
    effort: 'S' | 'M' | 'L';       // Small/Medium/Large
    priority: 1-5;
    confidence: 'high' | 'medium' | 'low';
    tags: string[];
    estimatedMinutes: number;
  }>;
  reasoning?: string;
}
```

## Dependencies
- **Edge Function:** `ai-tasks` (action: 'suggest')
- **Model:** gpt-4o-mini
- **Env Vars:** `OPENAI_API_KEY`
- **Tables:** `tasks`, `nodes`
- **Prompt:** `src/ai/prompts/inbox-atomizer.v1.md`

## Client Usage
```typescript
import { supabase } from '@/integrations/supabase/client';

async function atomizeInbox(content: string) {
  const { data, error } = await supabase.functions.invoke('ai-tasks', {
    body: { prompt: content, type: 'suggest' },
  });

  if (error) throw error;
  
  // Filter by confidence if needed
  const highConfidenceTasks = data.suggestions.filter(
    (t: any) => t.confidence === 'high'
  );
  
  return data.suggestions;
}
```

## Known Failure Modes

### 1. Low Confidence Tasks
**Symptom:** Tasks marked "low" confidence  
**Cause:** Vague or incomplete input text  
**Mitigation:** UI flags low-confidence tasks for user review before commit

### 2. Over-splitting
**Symptom:** Single idea becomes 5+ separate tasks  
**Cause:** AI interprets conjunctions as task separators  
**Mitigation:** Prompt emphasizes "distinct tasks"

### 3. Wrong Node Mapping
**Symptom:** Task assigned to irrelevant node  
**Cause:** Keyword matching fails for ambiguous domains  
**Mitigation:** Confidence = "medium" for uncertain node mappings

## Fallback Strategy
```typescript
// Simple line-by-line parsing when AI fails
function simpleFallback(content: string): AtomizedTask[] {
  return content.split(/[.\n]/).filter(Boolean).map(line => ({
    title: line.trim(),
    effort: 'M',
    priority: 3,
    confidence: 'low',
    tags: [],
    estimatedMinutes: 30,
  }));
}
```

## Confidence Indicators (UI)
- **High (green badge):** Clear action, ready to commit
- **Medium (yellow badge):** Minor edits recommended
- **Low (red badge):** Requires user clarification

## Rate Limits
- **OpenAI:** 3,500 RPM
- **Supabase Edge Functions:** 100 req/min per IP

## Metrics (Dev Mode)
```typescript
{
  duration: number;
  tokenEstimate: number;
  promptVersion: string;
  tasksExtracted: number;
  avgConfidence: 'high' | 'medium' | 'low';
  success: boolean;
}
```

## Testing
See `scripts/ai_eval/fixtures/inbox-atomizer/` for test cases.
