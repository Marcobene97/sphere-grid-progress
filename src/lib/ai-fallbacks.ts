/**
 * AI Fallback Strategies
 * Provides rule-based alternatives when AI features fail
 */

import { Subtask, TimeSlot, AtomizedTask } from '@/ai/contracts-extended';

// ==========================================
// Task Breakdown Fallback
// ==========================================

export function fallbackTaskBreakdown(taskTitle: string, taskDescription?: string): Subtask[] {
  const baseTime = taskDescription ? 120 : 60;
  
  return [
    {
      title: `Research requirements for: ${taskTitle}`,
      estimatedMinutes: Math.round(baseTime * 0.25),
      xpReward: 20,
    },
    {
      title: `Execute main work on: ${taskTitle}`,
      estimatedMinutes: Math.round(baseTime * 0.50),
      xpReward: 50,
    },
    {
      title: `Review and finalize: ${taskTitle}`,
      estimatedMinutes: Math.round(baseTime * 0.25),
      xpReward: 15,
    },
  ];
}

// ==========================================
// Daily Planner Fallback
// ==========================================

interface Task {
  id: string;
  title: string;
  estimated_time: number;
  priority: number;
  energy?: string;
  value_score?: number;
}

export function fallbackDailyPlanner(
  tasks: Task[],
  date: string,
  workStart = '09:00',
  workEnd = '18:00'
): { slots: TimeSlot[]; unscheduled: string[] } {
  // Sort by priority * value_score
  const sortedTasks = [...tasks].sort((a, b) => {
    const scoreA = a.priority * (a.value_score || 3);
    const scoreB = b.priority * (b.value_score || 3);
    return scoreB - scoreA;
  });
  
  const slots: TimeSlot[] = [];
  const unscheduled: string[] = [];
  
  let currentTime = parseTime(workStart);
  const endTime = parseTime(workEnd);
  const lunchStart = parseTime('12:00');
  const lunchEnd = parseTime('13:00');
  
  for (const task of sortedTasks) {
    // Add lunch break if we're crossing noon
    if (currentTime < lunchStart && currentTime + task.estimated_time > lunchStart) {
      currentTime = lunchEnd;
    }
    
    const taskEndTime = currentTime + task.estimated_time;
    
    // Check if task fits in remaining day
    if (taskEndTime > endTime) {
      unscheduled.push(task.id);
      continue;
    }
    
    slots.push({
      startTime: formatTime(currentTime),
      endTime: formatTime(taskEndTime),
      taskTitle: task.title,
      taskId: task.id,
      reasoning: 'Rule-based scheduling',
    });
    
    // Add 15min break
    currentTime = taskEndTime + 15;
  }
  
  return { slots, unscheduled };
}

// ==========================================
// Inbox Atomizer Fallback
// ==========================================

export function fallbackInboxAtomizer(content: string): AtomizedTask[] {
  // Split by newlines or periods
  const lines = content
    .split(/[.\n]/)
    .map(l => l.trim())
    .filter(l => l.length > 3);
  
  if (lines.length === 0) {
    return [{
      title: content.substring(0, 100),
      effort: 'M',
      priority: 3,
      confidence: 'low',
      tags: [],
      estimatedMinutes: 30,
    }];
  }
  
  return lines.map(line => ({
    title: line.charAt(0).toUpperCase() + line.slice(1),
    effort: determineEffort(line),
    priority: 3,
    confidence: 'low',
    tags: extractTags(line),
    estimatedMinutes: determineEffort(line) === 'S' ? 20 : 
                       determineEffort(line) === 'M' ? 45 : 90,
  }));
}

// ==========================================
// Session Reflection Fallback
// ==========================================

export function fallbackSessionReflection(completed: boolean) {
  return {
    prompts: [
      {
        question: completed 
          ? 'What was the most challenging part of this task?' 
          : 'What blocked you from completing this task?',
        placeholder: 'e.g., debugging the API integration...',
      },
      {
        question: 'What would you do differently next time?',
        placeholder: 'e.g., break it into smaller steps...',
      },
    ],
    xpBonus: completed ? 10 : 5,
  };
}

// ==========================================
// Helper Functions
// ==========================================

function parseTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function determineEffort(text: string): 'S' | 'M' | 'L' {
  const length = text.length;
  if (length < 30) return 'S';
  if (length < 70) return 'M';
  return 'L';
}

function extractTags(text: string): string[] {
  const keywords = ['urgent', 'important', 'work', 'personal', 'learning', 'health'];
  return keywords.filter(k => text.toLowerCase().includes(k));
}
