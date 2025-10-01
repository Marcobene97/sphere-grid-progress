# Workflow Processor - Technical Specification

## Overview
The Workflow Processor is an advanced AI-powered system that transforms hierarchical markdown workflows into structured tasks, subtasks, and skill nodes with intelligent time estimation, XP calculation, and priority ordering based on historical user data and OpenAI reasoning capabilities.

## User Request
Replace markdown structure (hierarchical workflow) into the sphere grid system with:
- **Intelligent sorting** by OpenAI
- **Computed subtasks** for each task
- **XP calculation** associated with completion
- **Time estimation** based on OpenAI reasoning and user's previous history
- **Flawless integration** with existing system

## Architecture

### Components

#### 1. **Edge Function: `workflow-processor`**
Location: `supabase/functions/workflow-processor/index.ts`

**Key Features:**
- Uses **o3-2025-04-16** (OpenAI's advanced reasoning model)
- Analyzes user's last 50 completed tasks for historical patterns
- Calculates efficiency metrics by difficulty level
- Generates structured output with reasoning explanations
- Creates database entries for nodes, tasks, and subtasks automatically

**Input:**
```typescript
{
  markdown: string // Hierarchical markdown workflow
}
```

**Output:**
```typescript
{
  success: boolean,
  workflow: {
    totalTasks: number,
    totalEstimatedTime: number,
    totalExpectedXP: number,
    domains: string[]
  },
  nodes: SphereNode[], // Created skill nodes
  tasks: Task[], // Created tasks with subtasks
  reasoning: string, // AI's analysis explanation
  stats: {
    nodesCreated: number,
    tasksCreated: number,
    subtasksCreated: number,
    totalEstimatedTime: number,
    totalExpectedXP: number
  }
}
```

**Processing Pipeline:**

1. **Historical Data Collection**
   - Fetch last 50 completed tasks
   - Calculate average efficiency (actual/estimated time ratio)
   - Group by difficulty level (basic/intermediate/advanced)
   - Analyze completion patterns by category

2. **AI Analysis** (o3 Reasoning Model)
   - Parse hierarchical markdown structure
   - Identify main categories (## headers) as potential nodes
   - Extract tasks and subtasks (- items)
   - Preserve parent-child relationships
   
3. **Intelligent Estimation**
   - Use historical efficiency rates
   - Consider task complexity indicators
   - Apply realistic buffers for new task types
   - Factor in user's level and experience

4. **XP Calculation**
   - Base XP by difficulty:
     * Basic: 20 XP
     * Intermediate: 75 XP
     * Advanced: 200 XP
   - Priority multiplier (1.00 to 1.20)
   - Show expected XP range accounting for efficiency

5. **Task Enrichment**
   - Assign optimal context (desk/gym/errand/reading/etc.)
   - Assess energy requirement (low/medium/high)
   - Calculate value score (1-5)
   - Generate relevant tags
   - Create 3-8 actionable subtasks per task

6. **Database Operations**
   - Create skill nodes with positions
   - Link tasks to appropriate nodes
   - Insert subtasks with sequence ordering
   - Maintain referential integrity

#### 2. **Frontend Component: `WorkflowProcessor`**
Location: `src/components/WorkflowProcessor.tsx`

**Features:**
- Large markdown textarea (16 rows, monospace font)
- Character and task counter
- Real-time validation
- Processing status with progress indicator
- Detailed results display with stats
- Example workflow template
- Error handling with user feedback

**UI Components:**
- Input section with markdown editor
- Processing indicator showing AI steps
- Results card with comprehensive stats:
  * Tasks created
  * Subtasks generated
  * Total time estimate
  * Expected XP
  * Domains covered
  * AI reasoning explanation

**Integration:**
- Embedded in "Brain Dump" tab of main interface
- Calls `workflow-processor` edge function
- Triggers data reload on success
- Shows toast notifications for status updates

### Data Flow

```
User Input (Markdown)
    ↓
WorkflowProcessor Component
    ↓
workflow-processor Edge Function
    ↓
1. Query historical tasks
2. Calculate efficiency stats
3. Call OpenAI o3 with enriched prompt
4. Parse AI response (JSON)
5. Create nodes in database
6. Create tasks in database
7. Create subtasks in database
    ↓
Return results to frontend
    ↓
Trigger data reload
    ↓
Display updated sphere grid
```

## Markdown Format

### Input Structure
```markdown
# Active Workflows

## Category Name (becomes a node)
- Task title
  - Subtask hint (optional)
- Another task
- Complex task
  - Subtask 1
  - Subtask 2

## Another Category
- Task in different domain
```

### Parsing Logic
- `#` headers ignored (top-level title)
- `##` headers → Skill Nodes / Domains
- `-` items at level 1 → Main Tasks
- `-` items at level 2 → Subtask hints (AI generates more)
- Hierarchy preserved in node-task relationships

## XP Calculation Engine

### Formula (from xpEngine.ts)
```typescript
baseXP = BASE_XP[difficulty]
priorityMultiplier = 1 + (priority - 1) * 0.05
efficiencyMultiplier = calculateFromTimeRatio(actual/estimated)
focusBonus = 1 + (focusScore / 100) * 0.15
streakMultiplier = 1 + min(streakDays, 10) * 0.03
resilienceBonus = returnedAfterGap ? 1.10 : 1.0
dungeonBonus = dungeonMode ? 1.25 : 1.0

totalXP = baseXP * all_multipliers
cappedXP = clamp(totalXP, baseXP * 0.5, baseXP * 2.0)
```

### New Task XP (estimated)
For new tasks, we use:
- Base XP for difficulty
- Priority multiplier
- Average user efficiency (1.0 assumed)
- No focus/streak bonuses yet (applied on completion)

## Historical Data Analysis

### Efficiency Calculation
```typescript
avgEfficiency = sum(actualTime / estimatedTime) / taskCount

byDifficulty = {
  basic: {
    avgTime: average actual time in minutes,
    efficiency: actual/estimated ratio
  },
  intermediate: { ... },
  advanced: { ... }
}
```

### Usage in Estimates
- If user typically takes 1.2x estimated time → inflate estimates by 20%
- If user is efficient (0.8x) → can provide tighter estimates
- Different efficiency by difficulty level honored
- Minimum 50 tasks analyzed for statistical significance

## OpenAI Integration

### Model Selection
**o3-2025-04-16** (Advanced Reasoning Model)
- Best for multi-step logical reasoning
- Excels at parsing hierarchical structures
- Can analyze historical patterns
- Provides detailed explanations
- Higher token limit for complex workflows

### Prompt Engineering

**Context Provided:**
- User level and current streak
- Historical efficiency metrics
- Past completion patterns by difficulty
- Number of completed tasks

**Instructions:**
1. Parse hierarchical structure
2. Think step-by-step about estimates
3. Consider user's efficiency patterns
4. Be realistic but optimistic
5. Group similar tasks under nodes
6. Preserve workflow meaning

**Output Format:**
Structured JSON with:
- Workflow summary
- Nodes array
- Tasks array (with subtasks)
- Reasoning explanations

### Error Handling
- Retry logic for API failures
- JSON parsing fallback (handles markdown-wrapped JSON)
- Rate limit detection (429 errors)
- Detailed error logging
- User-friendly error messages

## Database Schema

### Tables Updated

**nodes**
```sql
title, description, domain, goal_type, 
position_x, position_y, status, 
est_total_minutes, metadata (xp, color)
```

**tasks**
```sql
title, description, category, difficulty, 
priority, estimated_time, xp_reward, 
context, energy, value_score, tags, 
node_id (FK), status
```

**subtasks**
```sql
task_id (FK), title, est_minutes, 
seq, tags, status
```

### Relationships
- Node ← Task (many-to-one via node_id)
- Task ← Subtask (one-to-many via task_id)

## User Experience Flow

### 1. Input Phase
User pastes markdown workflow:
```markdown
## Programming
- Trading System of Agents
- Freecodecamp Course
- Excel Course
```

### 2. Processing Phase
- Click "Process Workflow"
- See progress indicator
- AI steps displayed:
  * Parsing hierarchical structure
  * Analyzing historical patterns
  * Estimating realistic times
  * Calculating XP rewards
  * Generating subtasks

### 3. Results Phase
Display comprehensive results:
- **10** tasks created
- **35** subtasks generated
- **480** minutes estimated
- **650** XP expected
- **Domains:** Programming, Health, Learning

### 4. Integration Phase
- Data automatically refreshed
- New nodes appear in sphere grid
- Tasks visible in task list
- Subtasks ready for scheduling
- XP system updated

## Testing Checklist

### Unit Tests
- [ ] XP calculation accuracy
- [ ] Efficiency stats calculation
- [ ] Markdown parsing edge cases
- [ ] JSON parsing with/without markdown wrapping

### Integration Tests
- [ ] Full workflow processing
- [ ] Database insertion integrity
- [ ] Node-task-subtask relationships
- [ ] Historical data retrieval

### E2E Tests
- [ ] User inputs markdown → sees results
- [ ] Data persists correctly
- [ ] Sphere grid updates
- [ ] Error scenarios handled gracefully

### Edge Cases
- Empty markdown
- Malformed hierarchy
- Very large workflows (100+ tasks)
- No historical data (new user)
- API failures/timeouts

## Performance Considerations

### Optimization Strategies
1. **Batch Database Operations**
   - Insert nodes in single query
   - Bulk insert tasks
   - Batch subtask creation

2. **Caching**
   - Historical stats calculation cached per user
   - Efficiency metrics recomputed only on new completions

3. **Rate Limiting**
   - Max 1 workflow process per minute per user
   - Queue system for large workflows

4. **Async Processing**
   - Non-blocking UI during processing
   - Cancellation support

### Expected Performance
- **Small workflow** (5-10 tasks): 8-12 seconds
- **Medium workflow** (10-30 tasks): 15-25 seconds  
- **Large workflow** (30-50 tasks): 30-45 seconds

Time breakdown:
- Historical query: 1-2s
- OpenAI API call: 5-15s (o3 reasoning)
- Database operations: 2-5s
- Response parsing: <1s

## Security & Privacy

### Authentication
- All operations require valid JWT
- User-scoped data access via RLS
- Edge functions verify JWT

### Data Protection
- Historical data limited to last 50 tasks
- No PII in AI prompts (only stats)
- User data never shared across accounts

### API Key Management
- OpenAI key stored as Supabase secret
- Not exposed to client
- Rotatable without code changes

## Future Enhancements

### Potential Improvements
1. **Learning ML Model**
   - Train on user's patterns over time
   - Improve estimation accuracy
   - Personalized difficulty detection

2. **Collaborative Workflows**
   - Share workflows between users
   - Template marketplace
   - Team progress tracking

3. **Advanced Scheduling**
   - Auto-generate day plans from workflows
   - Calendar integration
   - Deadline optimization

4. **Progress Analytics**
   - Workflow completion tracking
   - Time accuracy reports
   - XP efficiency analysis

5. **Voice Input**
   - Convert speech to markdown
   - Natural language workflow creation

6. **Import/Export**
   - Support for Notion, Todoist, etc.
   - CSV/JSON export
   - Backup/restore workflows

## Troubleshooting

### Common Issues

**"Processing Failed"**
- Check OpenAI API key configured
- Verify network connectivity
- Check browser console for errors
- Try smaller workflow first

**"No tasks created"**
- Ensure markdown has proper format
- Minimum: one ## header, one - item
- Check for special characters

**"Incorrect time estimates"**
- System learns from history
- Complete more tasks to improve
- Manually adjust if needed

**"Missing XP"**
- XP calculated but not awarded until completion
- Check task status
- Verify XP events table

### Debug Mode
Enable detailed logging:
```typescript
console.log('[WorkflowProcessor] Debug:', data);
```

Check edge function logs:
- Supabase Dashboard → Functions → workflow-processor → Logs

## Deployment

### Requirements
- Supabase project configured
- OpenAI API key in secrets
- Database tables: nodes, tasks, subtasks, xp_events, profiles
- Edge function deployed automatically

### Configuration
File: `supabase/config.toml`
```toml
[functions.workflow-processor]
verify_jwt = true
```

### Monitoring
- Edge function invocation count
- Average processing time
- Success/error rates
- OpenAI token usage

## Conclusion

The Workflow Processor provides a seamless, intelligent way to transform hierarchical markdown workflows into a fully structured, XP-tracked, time-estimated task management system. It leverages advanced AI reasoning, historical user data, and sophisticated algorithms to deliver accurate, personalized results that integrate flawlessly with the existing Sphere Grid Progress system.

**Key Benefits:**
- ⚡ **Fast**: Process complex workflows in seconds
- 🧠 **Smart**: Learns from your completion history
- 🎯 **Accurate**: Realistic time and XP estimates
- 🔗 **Integrated**: Seamless sphere grid integration
- 📊 **Transparent**: Shows reasoning and stats
- 🛡️ **Secure**: All data user-scoped and protected
