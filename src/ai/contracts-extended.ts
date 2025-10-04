import { z } from 'zod';

// Extended contracts for new AI validation system

export const TaskBreakdownRequestSchema = z.object({
  taskTitle: z.string().min(1).max(200),
  taskDescription: z.string().max(2000).optional(),
});

export const SubtaskSchema = z.object({
  title: z.string().min(1).max(200),
  estimatedMinutes: z.number().int().min(5).max(120),
  xpReward: z.number().int().min(5).max(200),
});

export const TaskBreakdownResponseSchema = z.object({
  subtasks: z.array(SubtaskSchema).min(1).max(15),
  reasoning: z.string().optional(),
});

export type TaskBreakdownRequest = z.infer<typeof TaskBreakdownRequestSchema>;
export type Subtask = z.infer<typeof SubtaskSchema>;
export type TaskBreakdownResponse = z.infer<typeof TaskBreakdownResponseSchema>;

export const TimeSlotSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  taskTitle: z.string(),
  taskId: z.string().uuid().optional(),
  reasoning: z.string().optional(),
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

export const AtomizedTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  nodeId: z.string().uuid().optional(),
  effort: z.enum(['S', 'M', 'L']),
  priority: z.number().int().min(1).max(5),
  confidence: z.enum(['high', 'medium', 'low']),
  tags: z.array(z.string()).optional(),
  estimatedMinutes: z.number().int().min(5).max(240),
});

export type AtomizedTask = z.infer<typeof AtomizedTaskSchema>;
