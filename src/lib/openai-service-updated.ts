// Updated OpenAI service that uses Supabase Edge Functions
import { dataLayer } from '@/lib/supabase-data';
import { TaskCategory, TaskDifficulty } from '@/types';

export interface WorkSessionAnalysis {
  feedback: string;
  nextSuggestions: string[];
  focusInsights: string;
  bonusXP: number;
}

export interface TaskSuggestion {
  title: string;
  description: string;
  difficulty: TaskDifficulty;
  estMinutes: number;
  category: TaskCategory;
  tags?: string[];
}

// Updated service that routes through Supabase Edge Functions
export const openaiService = {
  generateTasks: async (params: {
    currentSkills?: string[];
    userLevel?: number;
    category?: TaskCategory;
    timeAvailable?: number;
    goals?: string[];
  }): Promise<TaskSuggestion[]> => {
    try {
      const suggestions = await dataLayer.suggestTasks({
        goals: params.goals || ['Improve productivity', 'Build skills'],
        currentGridState: {
          unlockedNodes: [],
          completedNodes: [],
          currentBranch: params.category
        },
        availableMinutes: params.timeAvailable || 60,
        difficultyMix: {
          basic: 30,
          intermediate: 50,
          advanced: 20
        }
      });

      return suggestions.map(suggestion => ({
        title: suggestion.title,
        description: suggestion.description,
        difficulty: suggestion.difficulty,
        estMinutes: suggestion.estMinutes,
        category: suggestion.category,
        tags: suggestion.tags
      }));
    } catch (error) {
      console.error('Error generating tasks:', error);
      return getFallbackSuggestions(params.category);
    }
  },

  analyzeTaskCompletion: async (
    task: any,
    actualMinutes: number,
    notes?: string
  ): Promise<WorkSessionAnalysis> => {
    try {
      const analysis = await dataLayer.analyzeTaskOutcome({
        estMinutes: task.estimatedTime || 30,
        actualMinutes,
        notes,
        taskTitle: task.title,
        difficulty: task.difficulty,
        focusScore: 8 // Default focus score
      });

      // Calculate bonus XP based on efficiency
      const efficiency = task.estimatedTime / actualMinutes;
      let bonusXP = 0;
      if (efficiency > 1.2) bonusXP += 15; // Efficiency bonus
      if (efficiency > 0.8 && efficiency <= 1.2) bonusXP += 10; // Accuracy bonus

      return {
        feedback: analysis.reflection,
        nextSuggestions: [analysis.tweak],
        focusInsights: `Analysis: ${analysis.reflection}`,
        bonusXP: Math.max(0, Math.min(50, bonusXP))
      };
    } catch (error) {
      console.error('Error analyzing task:', error);
      return getFallbackAnalysis(task.estimatedTime || 30, actualMinutes, 8);
    }
  }
};

const getFallbackSuggestions = (category?: TaskCategory): TaskSuggestion[] => {
  const suggestions = [
    {
      title: "Complete a focused work session",
      description: "Set a timer for 25 minutes and work on your most important task without distractions.",
      difficulty: 'basic' as TaskDifficulty,
      estMinutes: 25,
      category: category || 'general' as TaskCategory,
      tags: ['focus', 'productivity']
    },
    {
      title: "Review and plan tomorrow's priorities", 
      description: "Take 15 minutes to review today's accomplishments and plan your top 3 priorities for tomorrow.",
      difficulty: 'basic' as TaskDifficulty,
      estMinutes: 15,
      category: category || 'general' as TaskCategory,
      tags: ['planning', 'reflection']
    },
    {
      title: "Practice a new skill for 30 minutes",
      description: "Dedicate focused time to learning or practicing a skill in your chosen domain.",
      difficulty: 'intermediate' as TaskDifficulty,
      estMinutes: 30,
      category: category || 'general' as TaskCategory,
      tags: ['skill-building', 'practice']
    }
  ];

  return suggestions;
};

const getFallbackAnalysis = (
  estimatedTime: number,
  actualTime: number,
  focusScore: number
): WorkSessionAnalysis => {
  const efficiency = estimatedTime / actualTime;
  let feedback = "Great work completing this task! ";
  
  if (efficiency > 1.2) {
    feedback += "You finished faster than expected - excellent efficiency!";
  } else if (efficiency < 0.8) {
    feedback += "The task took longer than planned, but persistence pays off.";
  } else {
    feedback += "Your time estimation was quite accurate.";
  }

  const bonusXP = Math.max(0, Math.min(50, Math.floor(focusScore * 5 + efficiency * 10)));

  return {
    feedback,
    nextSuggestions: [
      "Try breaking larger tasks into smaller chunks",
      "Set up a distraction-free workspace for better focus"
    ],
    focusInsights: `Your focus score of ${focusScore}/10 shows ${focusScore >= 8 ? 'excellent' : focusScore >= 6 ? 'good' : 'room for improvement'} concentration.`,
    bonusXP
  };
};