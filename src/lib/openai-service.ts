import OpenAI from 'openai';
import { TaskCategory, TaskDifficulty } from '@/types';
import { AIContract, TaskSuggestion, SuggestTasksInput, TaskAnalysisInput, AIContractError } from '@/ai/contracts';

let currentApiKey = process.env.OPENAI_API_KEY || '';

const getOpenAI = () => new OpenAI({
  apiKey: currentApiKey,
  dangerouslyAllowBrowser: true
});

// Initialize AI contract
let aiContract = new AIContract(getOpenAI());

// OpenAI service object for compatibility
export const openaiService = {
  getApiKey: () => currentApiKey,
  setApiKey: (key: string) => {
    currentApiKey = key;
    aiContract = new AIContract(getOpenAI());
  },
  generateTasks: async (params: any) => {
    return await suggestTasks(
      params.currentSkills || [],
      params.userLevel || 1,
      params.category,
      params.timeAvailable,
      undefined,
      []
    );
  },
  analyzeTaskCompletion: async (task: any, actualMinutes: number, notes?: string) => {
    return await analyzeWorkSession(
      task.title,
      task.estimatedTime || 30,
      actualMinutes,
      8, // Default focus score
      task.difficulty || 'basic',
      notes
    );
  }
};

export interface WorkSessionAnalysis {
  feedback: string;
  nextSuggestions: string[];
  focusInsights: string;
  bonusXP: number;
}

export const suggestTasks = async (
  userGoals: string[],
  currentLevel: number,
  category?: TaskCategory,
  availableTime?: number,
  currentGridState?: any,
  recentCompletions?: any[]
): Promise<TaskSuggestion[]> => {
  try {
    const input: SuggestTasksInput = {
      goals: userGoals,
      currentGridState: currentGridState || {
        unlockedNodes: [],
        completedNodes: [],
        currentBranch: category
      },
      availableMinutes: availableTime || 60,
      difficultyMix: {
        basic: 30,
        intermediate: 50,
        advanced: 20
      },
      recentCompletions: recentCompletions || []
    };

    const suggestions = await aiContract.suggestTasks(input);
    
    // Convert branch to category format
    return suggestions.map(suggestion => ({
      ...suggestion,
      category: suggestion.branch.toLowerCase() as TaskCategory,
      xpReward: calculateXPReward(suggestion.difficulty.toLowerCase() as TaskDifficulty)
    }));

  } catch (error) {
    if (error instanceof AIContractError) {
      console.warn('AI service error:', error.message);
      if (error.code === 'RATE_LIMITED') {
        throw new Error(`Rate limited. Try again in ${Math.ceil((error.retryAfter || 0) / 1000)} seconds.`);
      }
    }
    
    console.error('Error generating task suggestions:', error);
    return getFallbackSuggestions(category);
  }
};

export const analyzeWorkSession = async (
  taskTitle: string,
  estimatedTime: number,
  actualTime: number,
  focusScore: number,
  difficulty: TaskDifficulty,
  notes?: string
): Promise<WorkSessionAnalysis> => {
  try {
    const input: TaskAnalysisInput = {
      taskTitle,
      estimatedMinutes: estimatedTime,
      actualMinutes: actualTime,
      difficulty,
      notes,
      focusScore,
      completion: 'completed'
    };

    const analysis = await aiContract.analyzeTaskOutcome(input);
    
    // Calculate bonus XP based on analysis
    const efficiency = estimatedTime / actualTime;
    const baseBonusXP = Math.floor(focusScore * 2);
    let bonusXP = baseBonusXP;
    
    if (analysis.estimationAccuracy === 'accurate') bonusXP += 10;
    if (analysis.difficultyAssessment === 'appropriate') bonusXP += 10;
    if (efficiency > 1.2) bonusXP += 15; // Efficiency bonus
    
    bonusXP = Math.max(0, Math.min(50, bonusXP));

    return {
      feedback: analysis.reflection,
      nextSuggestions: analysis.nextSuggestions || [analysis.tweak],
      focusInsights: analysis.focusInsight || `Focus score: ${focusScore}/10`,
      bonusXP
    };

  } catch (error) {
    if (error instanceof AIContractError) {
      console.warn('AI analysis error:', error.message);
    }
    
    console.error('Error analyzing work session:', error);
    return getFallbackAnalysis(estimatedTime, actualTime, focusScore);
  }
};

const calculateXPReward = (difficulty: TaskDifficulty): number => {
  switch (difficulty) {
    case 'basic': return Math.floor(Math.random() * 15) + 10;
    case 'intermediate': return Math.floor(Math.random() * 50) + 50;
    case 'advanced': return Math.floor(Math.random() * 150) + 150;
    default: return 25;
  }
};

const getFallbackSuggestions = (category?: TaskCategory): TaskSuggestion[] => {
  const suggestions = [
    {
      title: "Complete a focused work session",
      description: "Set a timer for 25 minutes and work on your most important task without distractions.",
      branch: 'Programming' as const,
      difficulty: 'Basic' as const,
      estMinutes: 25,
      tags: ['focus', 'productivity']
    },
    {
      title: "Review and plan tomorrow's priorities", 
      description: "Take 15 minutes to review today's accomplishments and plan your top 3 priorities for tomorrow.",
      branch: 'Finance' as const,
      difficulty: 'Basic' as const,
      estMinutes: 15,
      tags: ['planning', 'reflection']
    },
    {
      title: "Practice a new skill for 30 minutes",
      description: "Dedicate focused time to learning or practicing a skill in your chosen domain.",
      branch: 'Music' as const,
      difficulty: 'Intermediate' as const,
      estMinutes: 30,
      tags: ['skill-building', 'practice']
    }
  ];

  if (category) {
    const branchMap = {
      programming: 'Programming',
      finance: 'Finance', 
      music: 'Music',
      general: 'Programming'
    };
    const targetBranch = branchMap[category];
    return suggestions.filter(s => s.branch === targetBranch);
  }
  
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