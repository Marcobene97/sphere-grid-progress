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

  // Brain dump processing
  async processBrainDump(text: string): Promise<{
    tasks: Array<{
      title: string;
      description: string;
      category: string;
      priority: number;
    }>;
    nodes: Array<{
      title: string;
      domain: string;
      goalType: string;
    }>;
  }> {
    // For now, we'll use the analyzeTask function and extract multiple tasks
    // This could be enhanced with a dedicated brain dump processor
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const results = {
      tasks: [] as any[],
      nodes: [] as any[]
    };

    for (const line of lines) {
      try {
        const analysis = await this.analyzeTask(line.trim());
        
        results.tasks.push({
          title: line.trim(),
          description: '',
          category: analysis.taskAnalysis.category,
          priority: analysis.taskAnalysis.priority,
          estimatedTime: analysis.taskAnalysis.estimatedTime,
          difficulty: analysis.taskAnalysis.difficulty,
          context: analysis.taskAnalysis.context,
          energy: analysis.taskAnalysis.energy,
          valueScore: analysis.taskAnalysis.valueScore
        });

        // Add suggested nodes
        if (analysis.suggestedNewNodes && analysis.suggestedNewNodes.length > 0) {
          results.nodes.push(...analysis.suggestedNewNodes);
        }
      } catch (error) {
        console.error(`Error processing line: ${line}`, error);
      }
    }

    return results;
  }
}

export const aiService = new AIService();