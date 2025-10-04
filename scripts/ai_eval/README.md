# AI Evaluation Harness

Offline evaluation framework for AI features using fixtures and quality scoring.

## Quick Start

```bash
# Run all evaluations (mock mode)
deno run --allow-read --allow-write evaluate.ts

# Run specific module
deno run --allow-read --allow-write evaluate.ts --module task-breakdown

# Run against live API (requires OPENAI_API_KEY)
RUN_LIVE=true deno run --allow-read --allow-net --allow-env evaluate.ts
```

## Structure

```
scripts/ai_eval/
├── README.md           # This file
├── evaluate.ts         # Main runner
├── fixtures/           # Test cases
│   ├── task-breakdown/
│   │   ├── cases.json
│   │   └── golden.json
│   ├── daily-planner/
│   │   ├── cases.json
│   │   └── golden.json
│   └── inbox-atomizer/
│       ├── cases.json
│       └── golden.json
└── scorers/            # Quality scoring functions
    ├── task-breakdown.ts
    ├── daily-planner.ts
    └── inbox-atomizer.ts
```

## Fixture Format

### Input Cases (`cases.json`)
```json
[
  {
    "id": "simple-programming-task",
    "description": "Build a REST API for user authentication",
    "input": {
      "taskTitle": "Build a REST API for user authentication",
      "taskDescription": "Create endpoints for login, signup, and token refresh"
    },
    "expectedSubtasks": 6
  }
]
```

### Golden Outputs (`golden.json`)
```json
{
  "simple-programming-task": {
    "subtasks": [
      {"title": "Research JWT authentication best practices", "estimatedMinutes": 30, "xpReward": 35},
      {"title": "Set up Express.js server with TypeScript", "estimatedMinutes": 20, "xpReward": 25}
    ]
  }
}
```

## Scoring Functions

Each module has a scorer that returns a score (0-1):

```typescript
export function scoreTaskBreakdown(actual: any, golden: any, input: any): number {
  let score = 0;
  
  // Count match (0.3)
  const countDiff = Math.abs(actual.subtasks.length - golden.subtasks.length);
  score += Math.max(0, 0.3 - (countDiff * 0.05));
  
  // Time estimation accuracy (0.4)
  const timeDiff = Math.abs(totalTime(actual) - totalTime(golden)) / totalTime(golden);
  score += Math.max(0, 0.4 - timeDiff);
  
  // XP consistency (0.3)
  const xpDiff = Math.abs(totalXP(actual) - totalXP(golden)) / totalXP(golden);
  score += Math.max(0, 0.3 - xpDiff);
  
  return Math.max(0, Math.min(1, score));
}
```

## Quality Thresholds

| Module | Minimum Score | Target Score |
|--------|---------------|--------------|
| Task Breakdown | 0.70 | 0.85 |
| Daily Planner | 0.65 | 0.80 |
| Inbox Atomizer | 0.60 | 0.75 |

CI fails if any module scores below minimum.

## Adding New Test Cases

1. Add case to `fixtures/<module>/cases.json`
2. Run in live mode to generate output
3. Review output, save as golden if good
4. Commit both files

## Metrics

Runner outputs:
```json
{
  "module": "task-breakdown",
  "totalCases": 15,
  "avgScore": 0.82,
  "passedCases": 13,
  "failedCases": 2,
  "duration": "4.2s"
}
```
