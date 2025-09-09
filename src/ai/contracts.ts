import { TaskCategory, TaskDifficulty } from '@/types';

export interface TaskSuggestion {
  title: string;
  description: string;
  branch: 'Programming' | 'Finance' | 'Music';
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  estMinutes: number;
  prerequisites?: string[];
  tags?: string[];
}

export interface SuggestTasksInput {
  goals: string[];
  currentGridState: {
    unlockedNodes: string[];
    completedNodes: string[];
    currentBranch?: string;
  };
  availableMinutes: number;
  difficultyMix?: {
    basic: number;
    intermediate: number; 
    advanced: number;
  };
  recentCompletions: {
    branch: string;
    difficulty: string;
    success: boolean;
  }[];
  userPreferences?: {
    preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening';
    focusAreas?: string[];
    avoidAreas?: string[];
  };
}

export interface TaskAnalysisInput {
  taskTitle: string;
  estimatedMinutes: number;
  actualMinutes: number;
  difficulty: TaskDifficulty;
  notes?: string;
  focusScore: number;
  interruptions?: number;
  completion: 'completed' | 'failed' | 'abandoned';
}

export interface TaskAnalysisOutput {
  reflection: string;
  tweak: string;
  nextSuggestions?: string[];
  estimationAccuracy: 'underestimated' | 'overestimated' | 'accurate';
  difficultyAssessment: 'too_easy' | 'too_hard' | 'appropriate';
  focusInsight?: string;
}

export interface AIServiceConfig {
  maxRetries: number;
  retryDelayMs: number;
  rateLimitPerMinute: number;
  timeoutMs: number;
  model: string;
}

export const DEFAULT_AI_CONFIG: AIServiceConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  rateLimitPerMinute: 3,
  timeoutMs: 30000,
  model: 'gpt-4.1-mini-2025-04-14'
};

// Rate limiting
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) return 0;
    
    const oldestRequest = Math.min(...this.requests);
    return this.windowMs - (Date.now() - oldestRequest);
  }
}

export class AIContractError extends Error {
  constructor(
    message: string,
    public code: 'RATE_LIMITED' | 'INVALID_RESPONSE' | 'NETWORK_ERROR' | 'TIMEOUT' | 'API_ERROR',
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'AIContractError';
  }
}

export class AIContract {
  private config: AIServiceConfig;
  private rateLimiter: RateLimiter;
  private openai: any; // OpenAI instance

  constructor(openaiInstance: any, config: Partial<AIServiceConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
    this.rateLimiter = new RateLimiter(this.config.rateLimitPerMinute);
    this.openai = openaiInstance;
  }

  async suggestTasks(input: SuggestTasksInput): Promise<TaskSuggestion[]> {
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.getTimeUntilNextRequest();
      throw new AIContractError(
        'Rate limit exceeded', 
        'RATE_LIMITED', 
        waitTime
      );
    }

    const systemPrompt = `You are a productivity coach inside a Solo-Leveling-style app. Suggest concrete, bite-sized tasks that unlock nodes in a sphere grid. 

Return ONLY valid JSON array of TaskSuggestion objects. Prefer 45–90 minute estimates. Balance across branches per user inputs. Avoid vague tasks.

Each task should be:
- Specific and actionable
- Properly estimated for time
- Appropriate for the user's current skill level
- Connected to their goals and progress

TaskSuggestion format:
{
  "title": "string",
  "description": "string", 
  "branch": "Programming"|"Finance"|"Music",
  "difficulty": "Basic"|"Intermediate"|"Advanced",
  "estMinutes": number,
  "prerequisites": ["string"] (optional),
  "tags": ["string"] (optional)
}`;

    const userPrompt = `Current context:
Goals: ${input.goals.join(', ')}
Available time: ${input.availableMinutes} minutes
Unlocked nodes: ${input.currentGridState.unlockedNodes.join(', ')}
Completed nodes: ${input.currentGridState.completedNodes.join(', ')}
Current focus: ${input.currentGridState.currentBranch || 'Any'}

Recent performance:
${input.recentCompletions.map(c => `${c.branch} ${c.difficulty}: ${c.success ? 'Success' : 'Failed'}`).join('\n')}

Difficulty preference: ${JSON.stringify(input.difficultyMix || { basic: 30, intermediate: 50, advanced: 20 })}

Generate 3-5 task suggestions that fit this context.`;

    try {
      this.rateLimiter.recordRequest();
      
      const response = await Promise.race([
        this.openai.chat.completions.create({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 1500
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.config.timeoutMs)
        )
      ]);

      const content = (response as any).choices[0].message.content;
      let parsed: any;
      
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        throw new AIContractError('Invalid JSON response', 'INVALID_RESPONSE');
      }

      // Validate response structure
      const suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || [];
      
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new AIContractError('No valid suggestions returned', 'INVALID_RESPONSE');
      }

      // Validate each suggestion
      const validSuggestions = suggestions.filter(this.validateTaskSuggestion);
      
      if (validSuggestions.length === 0) {
        throw new AIContractError('No valid task suggestions', 'INVALID_RESPONSE');
      }

      return validSuggestions;

    } catch (error: any) {
      if (error instanceof AIContractError) throw error;
      
      if (error.message === 'Timeout') {
        throw new AIContractError('Request timeout', 'TIMEOUT');
      }
      
      throw new AIContractError(
        `API Error: ${error.message}`, 
        'API_ERROR'
      );
    }
  }

  async analyzeTaskOutcome(input: TaskAnalysisInput): Promise<TaskAnalysisOutput> {
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.getTimeUntilNextRequest();
      throw new AIContractError(
        'Rate limit exceeded', 
        'RATE_LIMITED', 
        waitTime
      );
    }

    const systemPrompt = `You are a post-task coach. Given estimate, actual time, and a short note, produce a 2-sentence reflection and exactly one tweak for next time. Be concise and specific.

Return JSON: { "reflection": string, "tweak": string, "estimationAccuracy": "underestimated"|"overestimated"|"accurate", "difficultyAssessment": "too_easy"|"too_hard"|"appropriate", "focusInsight": string (optional) }`;

    const userPrompt = `Task: "${input.taskTitle}"
Estimated: ${input.estimatedMinutes} minutes
Actual: ${input.actualMinutes} minutes
Difficulty: ${input.difficulty}
Focus Score: ${input.focusScore}/10
Result: ${input.completion}
${input.notes ? `Notes: ${input.notes}` : ''}
${input.interruptions ? `Interruptions: ${input.interruptions}` : ''}`;

    try {
      this.rateLimiter.recordRequest();
      
      const response = await Promise.race([
        this.openai.chat.completions.create({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8,
          max_tokens: 500
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.config.timeoutMs)
        )
      ]);

      const content = (response as any).choices[0].message.content;
      let parsed: TaskAnalysisOutput;
      
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        throw new AIContractError('Invalid JSON response', 'INVALID_RESPONSE');
      }

      // Validate required fields
      if (!parsed.reflection || !parsed.tweak) {
        throw new AIContractError('Missing required fields in analysis', 'INVALID_RESPONSE');
      }

      return parsed;

    } catch (error: any) {
      if (error instanceof AIContractError) throw error;
      
      if (error.message === 'Timeout') {
        throw new AIContractError('Request timeout', 'TIMEOUT');
      }
      
      throw new AIContractError(
        `API Error: ${error.message}`, 
        'API_ERROR'
      );
    }
  }

  private validateTaskSuggestion(suggestion: any): suggestion is TaskSuggestion {
    return (
      typeof suggestion.title === 'string' &&
      typeof suggestion.description === 'string' &&
      ['Programming', 'Finance', 'Music'].includes(suggestion.branch) &&
      ['Basic', 'Intermediate', 'Advanced'].includes(suggestion.difficulty) &&
      typeof suggestion.estMinutes === 'number' &&
      suggestion.estMinutes > 0 &&
      suggestion.estMinutes <= 300 // Max 5 hours
    );
  }
}