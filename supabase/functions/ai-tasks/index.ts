import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TaskSuggestion {
  title: string;
  description: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estMinutes: number;
  category: 'programming' | 'finance' | 'music' | 'general';
  tags?: string[];
}

interface SuggestTasksRequest {
  goals: string[];
  currentGridState: {
    unlockedNodes: any[];
    completedNodes: any[];
    currentBranch?: string;
  };
  availableMinutes: number;
  difficultyMix: {
    basic: number;
    intermediate: number;
    advanced: number;
  };
}

interface AnalyzeOutcomeRequest {
  estMinutes: number;
  actualMinutes: number;
  notes?: string;
  taskTitle?: string;
  difficulty?: string;
  focusScore?: number;
}

// Rate limiting
const requestTracker = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const tracker = requestTracker.get(clientId);
  
  if (!tracker || now > tracker.resetTime) {
    requestTracker.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (tracker.count >= RATE_LIMIT) {
    return false;
  }
  
  tracker.count++;
  return true;
}

async function suggestTasks(request: SuggestTasksRequest): Promise<TaskSuggestion[]> {
  const { goals, currentGridState, availableMinutes, difficultyMix } = request;
  
  const systemPrompt = `You are an AI task generator for a personal mastery system. Generate productive, specific tasks based on user goals and available time.

Rules:
- Generate 3-5 tasks maximum
- Tasks should be specific and actionable
- Consider the user's available time (${availableMinutes} minutes)
- Mix difficulties according to: ${JSON.stringify(difficultyMix)}
- Focus on the current branch: ${currentGridState.currentBranch || 'general'}
- Tasks should help achieve goals: ${goals.join(', ')}

Respond ONLY with valid JSON in this exact format:
{
  "tasks": [
    {
      "title": "Specific task title",
      "description": "Clear description of what to do",
      "difficulty": "basic|intermediate|advanced",
      "estMinutes": number,
      "category": "programming|finance|music|general",
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Goals: ${goals.join(', ')}\nAvailable time: ${availableMinutes} minutes\nCurrent focus: ${currentGridState.currentBranch || 'general'}` }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 800
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);
  
  return result.tasks || [];
}

async function analyzeOutcome(request: AnalyzeOutcomeRequest): Promise<{ reflection: string; tweak: string }> {
  const { estMinutes, actualMinutes, notes, taskTitle, difficulty, focusScore } = request;
  
  const efficiency = actualMinutes / estMinutes;
  const efficiencyText = efficiency > 1.2 ? "took longer than expected" : 
                        efficiency < 0.8 ? "completed faster than expected" : 
                        "was completed in expected time";

  const systemPrompt = `You are an AI productivity coach. Analyze task completion and provide brief, actionable feedback.

Task: ${taskTitle || 'Unknown task'}
Difficulty: ${difficulty || 'unknown'}
Estimated: ${estMinutes} minutes
Actual: ${actualMinutes} minutes (${efficiencyText})
Focus Score: ${focusScore || 'not provided'}/10
Notes: ${notes || 'none'}

Provide exactly this JSON format:
{
  "reflection": "Brief positive reflection (2-3 sentences max)",
  "tweak": "One specific improvement suggestion"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this task completion` }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 300
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting
    const clientId = req.headers.get('x-client-info') || 'anonymous';
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...requestData } = await req.json();

    let result;
    if (action === 'suggestTasks') {
      result = await suggestTasks(requestData as SuggestTasksRequest);
    } else if (action === 'analyzeOutcome') {
      result = await analyzeOutcome(requestData as AnalyzeOutcomeRequest);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-tasks function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});