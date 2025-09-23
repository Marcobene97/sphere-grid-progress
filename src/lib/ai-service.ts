import { supabase } from '@/integrations/supabase/client';

export interface TaskAnalysis {
  connectedNodes: string[];
  suggestedNewNodes: Array<{
    title: string;
    domain: string;
    description: string;
    goalType: 'habit' | 'project' | 'one-off';
  }>;
  taskAnalysis: {
    category: string;
    difficulty: string;
    estimatedTime: number;
    priority: number;
    context: string;
    energy: string;
    valueScore: number;
  };
  reasoning: string;
}

export interface SubtaskBreakdown {
  subtasks: Array<{
    title: string;
    estMinutes: number;
    seq: number;
    tags: string[];
  }>;
  totalEstimatedTime: number;
  reasoning: string;
}

export interface ScheduleResult {
  slotsCreated: number;
  totalSubtasks: number;
  unscheduled: string[];
  summary: string;
  schedule: any[];
}

// AI Service class for interacting with AI agents
export class AIService {
  
  // Action Counsellor methods
  async analyzeTask(taskTitle: string, taskDescription?: string): Promise<TaskAnalysis> {
    const { data, error } = await supabase.functions.invoke('action-counsellor', {
      body: {
        action: 'analyzeTask',
        payload: {
          taskTitle,
          taskDescription
        }
      }
    });

    if (error) throw error;
    return data.analysis;
  }

  async breakdownTask(taskId: string): Promise<SubtaskBreakdown> {
    const { data, error } = await supabase.functions.invoke('action-counsellor', {
      body: {
        action: 'breakdownTask',
        payload: { taskId }
      }
    });

    if (error) throw error;
    return {
      subtasks: data.subtasks,
      totalEstimatedTime: data.subtasks?.reduce((sum: number, st: any) => sum + st.est_minutes, 0) || 0,
      reasoning: data.breakdown
    };
  }

  async connectTaskToNodes(taskId: string, nodeIds?: string[], createNewNodes?: any[]): Promise<any> {
    const { data, error } = await supabase.functions.invoke('action-counsellor', {
      body: {
        action: 'connectToNodes',
        payload: {
          taskId,
          nodeIds,
          createNewNodes
        }
      }
    });

    if (error) throw error;
    return data;
  }

  // Scheduler methods
  async generateDayPlan(date: string, constraints?: any): Promise<ScheduleResult> {
    const { data, error } = await supabase.functions.invoke('scheduler', {
      body: {
        action: 'generateDayPlan',
        payload: {
          date,
          ...constraints
        }
      }
    });

    if (error) throw error;
    return data;
  }

  async optimizeSchedule(date: string, constraints?: any): Promise<any> {
    const { data, error } = await supabase.functions.invoke('scheduler', {
      body: {
        action: 'optimizeSchedule',
        payload: {
          date,
          constraints
        }
      }
    });

    if (error) throw error;
    return data;
  }

  // Enhanced brain dump processing with proper AI analysis
  async processBrainDump(text: string): Promise<{
    tasks: Array<{
      title: string;
      description: string;
      category: string;
      priority: number;
      estimatedTime: number;
      difficulty: string;
      context: string;
      energy: string;
      valueScore: number;
    }>;
    nodes: Array<{
      title: string;
      domain: string;
      goalType: string;
      description: string;
    }>;
  }> {
    console.log('[BrainDump] Processing text:', text);
    
    // Use the action-counsellor to intelligently parse the brain dump
    const { data, error } = await supabase.functions.invoke('action-counsellor', {
      body: {
        action: 'processBrainDump',
        payload: {
          text: text.trim()
        }
      }
    });

    if (error) {
      console.error('[BrainDump] Edge function error:', error);
      throw error;
    }

    console.log('[BrainDump] AI Response:', data);

    if (!data || !data.tasks) {
      throw new Error('Invalid response from brain dump processor');
    }

    return {
      tasks: data.tasks || [],
      nodes: data.nodes || []
    };
  }
  // Enhanced AI methods
  async seedMindmap(): Promise<any> {
    const { data, error } = await supabase.functions.invoke('action-counsellor', {
      body: {
        action: 'seedMindmap',
        payload: {}
      }
    });

    if (error) throw error;
    return data;
  }
}

export const aiService = new AIService();