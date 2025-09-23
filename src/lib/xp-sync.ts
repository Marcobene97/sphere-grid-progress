import { supabase } from '@/integrations/supabase/client';
import { useXP } from '@/hooks/useXP';
import { xpForTask, xpForSession } from './game/score';

// Award XP for task completion and sync with database
export async function awardTaskXP(taskId: string, context: {
  difficulty: 'basic' | 'intermediate' | 'advanced';
  actualMinutes: number;
  estimatedMinutes: number;
}) {
  try {
    const xpAmount = xpForTask({
      taskSize: getTaskSize(context.estimatedMinutes),
      difficulty: context.difficulty
    });

    // Record XP event in database
    const { error } = await supabase
      .from('xp_events')
      .insert({
        amount: xpAmount,
        source: 'task_completion',
        meta: {
          taskId,
          difficulty: context.difficulty,
          actualMinutes: context.actualMinutes,
          estimatedMinutes: context.estimatedMinutes
        }
      });

    if (error) throw error;

    // Update local XP store
    const { addXP, loadXP } = useXP.getState();
    addXP(xpAmount);
    
    // Refresh from database to ensure sync
    await loadXP();

    return xpAmount;
  } catch (error) {
    console.error('Failed to award task XP:', error);
    return 0;
  }
}

// Award XP for work session completion
export async function awardSessionXP(context: {
  durationMin: number;
  difficulty?: 'basic' | 'intermediate' | 'advanced';
  streakDays?: number;
}) {
  try {
    const xpAmount = xpForSession(context);

    // Record XP event in database
    const { error } = await supabase
      .from('xp_events')
      .insert({
        amount: xpAmount,
        source: 'work_session',
        meta: context
      });

    if (error) throw error;

    // Update local XP store
    const { addXP, loadXP } = useXP.getState();
    addXP(xpAmount);
    
    // Refresh from database to ensure sync
    await loadXP();

    return xpAmount;
  } catch (error) {
    console.error('Failed to award session XP:', error);
    return 0;
  }
}

// Sync local XP with database (call periodically)
export async function syncXP() {
  try {
    const { loadXP } = useXP.getState();
    await loadXP();
  } catch (error) {
    console.error('Failed to sync XP:', error);
  }
}

// Helper to determine task size from estimated minutes
function getTaskSize(estimatedMinutes: number): 'micro' | 'small' | 'medium' | 'big' {
  if (estimatedMinutes <= 5) return 'micro';
  if (estimatedMinutes <= 15) return 'small';
  if (estimatedMinutes <= 60) return 'medium';
  return 'big';
}

// Auto-sync XP when tasks are completed
export function setupXPSync() {
  // Listen for task status changes and award XP accordingly
  const channel = supabase
    .channel('task_xp_sync')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: 'status=eq.completed'
      },
      async (payload) => {
        const task = payload.new;
        if (task.status === 'completed' && payload.old?.status !== 'completed') {
          await awardTaskXP(task.id, {
            difficulty: task.difficulty,
            actualMinutes: task.actual_time || task.estimated_time,
            estimatedMinutes: task.estimated_time
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}