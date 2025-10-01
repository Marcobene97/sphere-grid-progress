# Project Architecture & Functionality Overview

## Core System: Sphere Grid Progress (SGP)

### **What This Project Does**
A gamified productivity system that converts workflows into visual skill trees with XP progression, AI-powered task generation, and intelligent time estimation.

---

## **Key Functionalities**

### 1. **Workflow Processing** (✅ ACTIVE)
- **Location**: Brain Dump tab → WorkflowProcessor component
- **How it works**:
  - Paste markdown-formatted workflow (with ## headers for categories, - for tasks)
  - AI (GPT-4o) analyzes and breaks down into:
    - **Nodes**: Skill domains (Programming, Health, Finance, etc.)
    - **Tasks**: Specific actionable items
    - **Subtasks**: 3-8 step breakdowns per task
  - **Smart features**:
    - Historical efficiency analysis (learns from your past 50 tasks)
    - Realistic time estimates based on your performance patterns
    - XP calculation (Basic: 20, Intermediate: 75, Advanced: 200 base XP)
    - Priority and difficulty assignment
    - Context/energy tagging

### 2. **Sphere Grid Visualization** (✅ ACTIVE)
- **Location**: System tab → FFXSphereGrid component
- **Display**: FFX-style node network with:
  - Circular layout around center
  - Color-coded by domain
  - Connection lines between related skills
  - Interactive (click to select, zoom/pan controls)
- **Node states**: Available, In Progress, Completed, Locked
- **Node types**: Habit, Project, One-off

### 3. **XP & Progression System** (✅ ACTIVE)
- **Tracks**:
  - Total XP across all tasks
  - User level (based on cumulative XP)
  - Current streak (consecutive days)
  - Three pillars: Resilience, Consistency, Focus
- **XP Formula**:
  ```
  baseXP × priorityMultiplier × efficiencyMultiplier × focusBonus × streakMultiplier
  ```
- **Stored in**: `xp_events` table (persistent across sessions)

### 4. **Task Management** (✅ ACTIVE)
- **Features**:
  - Status tracking (pending → in_progress → completed)
  - Time estimation vs actual time
  - Difficulty levels (basic, intermediate, advanced)
  - Priority ranking (1-5)
  - Context tags (desk, gym, reading, etc.)
  - Energy requirements (low, medium, high)
  - Value scoring

### 5. **AI-Powered Task Generation** (✅ ACTIVE)
- **Edge Functions**:
  - `workflow-processor`: Main markdown → tasks processor
  - `task-generator`: Generate tasks from brain dump
  - `action-counsellor`: Task suggestions and guidance
  - `scheduler`: Optimize daily schedule
- **Models**: GPT-4o (fast, reliable), GPT-5 (advanced reasoning)

---

## **Data Persistence & Sessions**

### ✅ **Memory Between Sessions**: YES
- **Database**: Supabase PostgreSQL
- **Tables**:
  - `profiles`: User info, level, XP, streaks
  - `nodes`: Skill tree structure
  - `tasks`: All tasks with metadata
  - `subtasks`: Task breakdowns
  - `xp_events`: XP transaction log
  - `day_plan_slots`: Scheduled time blocks
- **Authentication**: Anonymous auth (persistent session via localStorage)
- **Data flow**: Client → Supabase → PostgreSQL (all changes saved immediately)

---

## **Technical Architecture**

### **Frontend** (React + TypeScript)
- **Main Views**:
  - `NewIndex.tsx`: Main app container with tabs
  - `FFXSphereGrid.tsx`: Visual node network (Fabric.js canvas)
  - `WorkflowProcessor.tsx`: Markdown input & AI processing
  - `UnifiedProgressSystem.tsx`: XP dashboard
  - `NodeSidePanel.tsx`: Node details panel
  - `BrainDumpInput.tsx`: Quick task entry

### **Backend** (Supabase)
- **Edge Functions** (Deno):
  - `/workflow-processor`: Markdown parsing + OpenAI analysis
  - `/task-generator`: AI task suggestions
  - `/action-counsellor`: Contextual guidance
  - `/scheduler`: Time optimization
- **Database**: PostgreSQL with RLS (Row Level Security)
- **Authentication**: Anonymous sessions (can upgrade to email/social)

### **APIs**
- **OpenAI**: GPT-4o, GPT-5 (via `OPENAI_API_KEY` secret)
- **Supabase**: Database + Auth + Edge Functions

---

## **Current Limitations & Gaps**

### ❌ **Websockets**: NOT IMPLEMENTED
- **Currently**: Standard HTTP requests (polling for updates)
- **Potential use**: Real-time collaboration, live XP updates, multi-device sync
- **Not critical**: Current functionality works without it

### ❌ **n8n Integration**: NOT IMPLEMENTED
- **How to add**:
  1. Create webhook endpoint in n8n
  2. Add webhook URL input in app
  3. Trigger webhook on task completion/XP events
  - Example use: Send task completion to Notion, Slack, Google Calendar

### ❌ **Langchain Integration**: NOT IMPLEMENTED
- **Requested**: System of agents monitoring frontend, backend, workflows
- **Complexity**: High (would require major refactoring)
- **What it would need**:
  - Langchain.js library
  - Agent definitions for monitoring
  - Observability layer
  - Autonomous decision-making logic
  - **Recommendation**: Discuss requirements first before implementing

---

## **How to Use the App (Current State)**

### **Running the App**
1. **Local**: `npm run dev` → http://localhost:8080
2. **Deployed**: Already live at your Lovable preview URL
3. **Brain Dump**: Paste markdown → AI processes → Nodes/tasks created
4. **System View**: See sphere grid → Click nodes → View tasks
5. **Progress**: Track XP, level up, maintain streaks

### **Workflow Example**
```markdown
## Programming
- Trading System of Agents
- Freecodecamp Course

## Health
- Gym routine
- Meal prep
```
→ AI creates:
- 2 Nodes (Programming, Health)
- 4 Tasks (each with 3-8 subtasks)
- XP estimates (e.g., 75 XP for intermediate tasks)
- Time estimates (e.g., 120 min based on your history)

---

## **Next Steps for Enhancement**

### **Priority 1: Fix Current Issues**
✅ Switch to GPT-4o (done)
✅ Improve error handling (done)
⬜ Verify nodes appear in sphere grid (testing needed)

### **Priority 2: Basic Integrations**
⬜ n8n webhook support (easy: 30 min)
⬜ Real-time updates via Supabase Realtime (medium: 2 hours)

### **Priority 3: Advanced Features**
⬜ Langchain agent system (hard: 1-2 days)
⬜ Multi-user collaboration
⬜ Advanced analytics dashboard

---

## **Questions Answered**

1. **How do I run this?** → Already running. Use Brain Dump tab to paste markdown.
2. **Does memory persist?** → YES. All data in Supabase database.
3. **Websockets needed?** → NO for current functionality. Could add for real-time features.
4. **n8n integration?** → Not yet. Can add via webhooks (simple).
5. **Use GPT-4o?** → ✅ DONE (switched from o3).
6. **Langchain agents?** → Not implemented. Needs design discussion first.

---

## **Key Files Map**

```
src/
├── pages/NewIndex.tsx              # Main app container
├── components/
│   ├── FFXSphereGrid.tsx          # Visual sphere grid (Fabric.js)
│   ├── WorkflowProcessor.tsx       # AI workflow processor UI
│   ├── UnifiedProgressSystem.tsx   # XP dashboard
│   ├── BrainDumpInput.tsx         # Quick task input
│   └── NodeSidePanel.tsx          # Node details panel
├── lib/
│   ├── ai-service.ts              # AI utility functions
│   └── xp-system.ts               # XP calculation engine
└── integrations/supabase/
    └── client.ts                   # Supabase client setup

supabase/functions/
├── workflow-processor/index.ts     # ✅ Main markdown processor
├── task-generator/index.ts         # AI task generator
├── action-counsellor/index.ts      # AI guidance
└── scheduler/index.ts              # Schedule optimizer
```

---

**Status**: System is functional. Workflow processor uses GPT-4o with robust error handling. Nodes/tasks persist in Supabase. Ready for testing.
