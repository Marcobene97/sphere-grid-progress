# Sphere Grid Progress - Project Review

## Overview
A gamified productivity system that combines task management with an FFX-style sphere grid visualization, XP progression, and AI-powered workflow optimization.

## Current Functionalities

### 1. **XP & Progression System**
- **Level System**: Dynamic leveling from 1 to ∞ with increasing XP requirements
- **Ranks**: E → D → C → B → A → S → SS → SSS based on level milestones
- **Pillars**: Three growth metrics (Resilience, Consistency, Focus)
- **XP Calculation**: Complex formula considering:
  - Base XP by difficulty (basic: 20, intermediate: 75, advanced: 200)
  - Priority multiplier (1.00 to 1.20)
  - Efficiency multiplier based on estimated vs actual time
  - Focus bonus (up to +15%)
  - Streak multiplier (up to +30%)
  - Resilience bonus (+10% for comebacks)
  - Dungeon mode bonus (+25%)
  - Caps: min 50% base, max 200% base

### 2. **Task Management**
- **Task Properties**:
  - Title, description, category, difficulty, priority (1-5)
  - Estimated time, actual time, XP reward
  - Context (desk, gym, errand, reading, quiet, etc.)
  - Energy level (low, medium, high)
  - Value score (1-5)
  - Tags, due dates, node connections
  - Status tracking (pending, in_progress, completed, cancelled)
- **Task State Machine**: Enhanced task lifecycle with state transitions
- **Subtask Breakdown**: AI-powered breakdown into 3-10 actionable subtasks

### 3. **Sphere Grid (FFX-Style)**
- **Visual Node System**: Interactive canvas-based grid visualization
- **Node Properties**:
  - Title, description, domain, goal type (habit/project/one-off)
  - Status (locked, available, in_progress, completed, mastered)
  - Position, prerequisites, unlocks
  - Progress tracking, time spent, deadlines
  - Metadata (XP, color)
- **Dependencies**: Node unlock system based on prerequisites

### 4. **AI-Powered Features**
- **Brain Dump Processing**: Convert freeform text into structured tasks and nodes
- **Task Analysis**: Intelligent task categorization and recommendation
- **Subtask Generation**: Break complex tasks into actionable steps
- **Day Plan Generation**: Optimize daily schedule considering:
  - Work hours, breaks, lunch
  - Task priority, context, energy levels
  - Existing locked slots
  - Context switching efficiency
- **Schedule Optimization**: Analyze and improve existing schedules
- **Category Optimization**: Automatic task and node organization

### 5. **Time Management**
- **Day Plan Slots**: Time-blocked scheduling system
- **Work Session Timer**: Focus tracking with Pomodoro support
- **Time Tracking**: Actual vs estimated time comparison
- **Efficiency Metrics**: Time accuracy scoring

### 6. **Analytics & Progress**
- **Streak Tracking**: Current and longest streaks
- **Pillar Progress**: Visual representation of growth in three pillars
- **XP Events**: Historical log of all XP gains
- **Achievement System**: Milestone tracking and rewards
- **Progress Visualization**: Charts and graphs for analytics

## Backend Architecture

### Database Schema (Supabase PostgreSQL)

#### **profiles**
- User profile with level, XP, rank, streaks, pillars
- RLS: Users can only access their own profile

#### **nodes**
- Sphere grid skill nodes
- Hierarchical structure with parent_id
- Progress tracking, prerequisites, unlocks
- RLS: User-scoped access

#### **tasks**
- Comprehensive task metadata
- Node connection via node_id
- Category, difficulty, priority, context, energy
- RLS: User-scoped CRUD operations

#### **subtasks**
- Task breakdown into smaller units
- Estimated time, status, sequence order
- Time window constraints (earliest_start, hard_window)
- RLS: User-scoped CRUD operations

#### **day_plan_slots**
- Time-blocked scheduling
- Links to subtasks
- Locked slots for fixed commitments
- RLS: User-scoped CRUD operations

#### **xp_events**
- Historical XP gain tracking
- Source tracking (task completion, sessions, etc.)
- Metadata for detailed breakdown
- RLS: Users can view and create their own events

### Edge Functions (Serverless Backend)

#### **action-counsellor** (Primary AI Engine)
- `/analyzeTask`: Analyze and categorize tasks
- `/breakdownTask`: Generate subtasks with AI
- `/connectToNodes`: Link tasks to skill nodes
- `/processBrainDump`: Parse freeform text into tasks/nodes
- `/seedMindmap`: Initialize sphere grid
- `/optimizeCategories`: Auto-organize tasks and nodes
- `/autoScheduleTasks`: Generate optimal schedules
- `/rebalanceNodes`: Optimize node structure

#### **task-generator**
- Simple subtask generation
- Lightweight alternative to action-counsellor breakdown

#### **scheduler**
- `/generateDayPlan`: Create daily schedules
- `/optimizeSchedule`: Analyze and improve schedules

### Database Functions
- `get_user_total_xp()`: Calculate total XP from events
- `update_updated_at_column()`: Auto-update timestamps

## Data Dynamism Review

### ✅ Dynamic & Real-time
- All data is user-scoped via `auth.uid()`
- XP events are logged and aggregated
- Task status transitions tracked
- Profile updates on every XP gain
- Historical data available for analysis

### ⚠️ Partially Dynamic
- Real-time subscriptions available but not fully utilized
- Some calculated fields (level, rank) stored vs computed
- Node unlock logic exists but not fully automated

### ❌ Static Elements
- Level thresholds hardcoded
- XP calculation formulas fixed
- UI components mostly static (Canvas-based grid)

## Current AI Integration

### Models Used
- **gpt-4o-mini**: Primary model for all AI operations
- **gpt-3.5-turbo**: Used in task-generator function

### Limitations
1. Not using reasoning models (o3, gpt-5)
2. No historical data analysis for time estimates
3. No XP pre-calculation before task creation
4. Limited context about user's completion patterns
5. Simple prompt engineering without structured output

## Recommendations for Enhancement

### 1. **Upgrade to Reasoning Models**
- Use `o3-2025-04-16` for complex workflow parsing
- Use `gpt-5-2025-08-07` for general AI tasks
- Leverage multi-step reasoning for time estimation

### 2. **Historical Analysis**
- Query user's past task completion data
- Calculate average efficiency by difficulty/category
- Use ML-style pattern recognition for estimates

### 3. **Advanced XP Pre-calculation**
- Integrate xpEngine.ts with AI processing
- Calculate expected XP before task creation
- Show XP predictions to users

### 4. **Structured Markdown Parser**
- Support hierarchical workflows (your format)
- Maintain parent-child relationships
- Preserve priority ordering from structure

### 5. **Real-time Sync**
- Implement Supabase real-time subscriptions
- Auto-refresh on database changes
- Collaborative features potential

## Technical Debt
1. Multiple sphere grid implementations (FFX, New, Test, Debug)
2. Unused/deprecated components
3. XP calculation logic scattered across files
4. Inconsistent error handling
5. Missing comprehensive logging

## Security Review
- ✅ RLS policies on all tables
- ✅ User-scoped data access
- ✅ Auth required for edge functions
- ✅ No SQL injection vectors (using Supabase client)
- ⚠️ API keys properly secured in secrets

## Performance Considerations
- Canvas rendering can be optimized
- AI calls can be rate-limited
- Database queries could use indexes
- Consider caching for XP calculations
- Batch operations for bulk inserts

## Next Steps
See WORKFLOW-PROCESSOR-SPEC.md for the new markdown workflow system implementation.
