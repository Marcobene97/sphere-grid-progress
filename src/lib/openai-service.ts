import { Task, TaskCategory, TaskDifficulty } from '@/types';

interface TaskGenerationRequest {
  category: TaskCategory;
  userLevel: number;
  currentSkills: string[];
  timeAvailable: number; // minutes
  difficulty?: TaskDifficulty;
}

interface GeneratedTask {
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: TaskDifficulty;
  priority: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

class OpenAIService {
  private apiKey: string | null = null;

  constructor() {
    // In a real app, this would come from environment variables or secure storage
    this.apiKey = localStorage.getItem('openai_api_key');
  }

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  async generateTasks(request: TaskGenerationRequest): Promise<GeneratedTask[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not set');
    }

    const prompt = this.buildPrompt(request);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a productivity coach that generates personalized tasks. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      throw error;
    }
  }

  async analyzeTaskCompletion(
    task: Task, 
    actualTime: number, 
    focusNotes?: string
  ): Promise<{ 
    focusScore: number; 
    bonusXP: number; 
    feedback: string; 
    nextSuggestions: string[] 
  }> {
    if (!this.apiKey) {
      return {
        focusScore: 8,
        bonusXP: 0,
        feedback: 'Great work!',
        nextSuggestions: []
      };
    }

    const prompt = `
    Analyze this task completion:
    
    Task: ${task.title}
    Description: ${task.description}
    Estimated Time: ${task.estimatedTime} minutes
    Actual Time: ${actualTime} minutes
    Difficulty: ${task.difficulty}
    Category: ${task.category}
    ${focusNotes ? `Focus Notes: ${focusNotes}` : ''}
    
    Provide analysis as JSON:
    {
      "focusScore": number (1-10),
      "bonusXP": number (0-100),
      "feedback": "encouraging message",
      "nextSuggestions": ["task1", "task2", "task3"]
    }
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a performance analyst. Respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Failed to analyze task completion:', error);
      return {
        focusScore: 8,
        bonusXP: 0,
        feedback: 'Task completed successfully!',
        nextSuggestions: []
      };
    }
  }

  private buildPrompt(request: TaskGenerationRequest): string {
    return `
    Generate 3 personalized tasks for a user with these parameters:
    
    Category: ${request.category}
    User Level: ${request.userLevel}
    Available Time: ${request.timeAvailable} minutes
    Current Skills: ${request.currentSkills.join(', ')}
    ${request.difficulty ? `Preferred Difficulty: ${request.difficulty}` : ''}
    
    Generate tasks that:
    1. Match the user's skill level and available time
    2. Are engaging and progressively challenging
    3. Include realistic time estimates
    4. Have clear, actionable descriptions
    
    Respond with a JSON array of exactly 3 tasks:
    [
      {
        "title": "Task name",
        "description": "Detailed description",
        "estimatedTime": number (in minutes),
        "difficulty": "basic" | "intermediate" | "advanced",
        "priority": number (1-5),
        "tags": ["tag1", "tag2"]
      }
    ]
    `;
  }
}

export const openaiService = new OpenAIService();