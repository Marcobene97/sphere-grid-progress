import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

// XP calculation engine (replicated from xpEngine.ts)
const BASE_XP = { basic: 20, intermediate: 75, advanced: 200 };

function calculateTaskXP(params: {
  difficulty: 'basic' | 'intermediate' | 'advanced';
  priority: number;
  estMinutes: number;
}) {
  const baseXP = BASE_XP[params.difficulty];
  const priorityMultiplier = 1 + (params.priority - 1) * 0.05;
  
  // Assume average efficiency for new tasks
  const efficiencyMultiplier = 1.0;
  const focusBonus = 1.0;
  const streakMultiplier = 1.0;
  
  const totalXP = baseXP * priorityMultiplier * efficiencyMultiplier * focusBonus * streakMultiplier;
  return Math.round(Math.max(baseXP * 0.5, Math.min(baseXP * 2.0, totalXP)));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { markdown } = await req.json();
    console.log('[WorkflowProcessor] Processing markdown workflow');

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user's historical task data for time estimation
    const { data: historicalTasks } = await supabase
      .from('tasks')
      .select('title, category, difficulty, estimated_time, actual_time, completed_at')
      .eq('status', 'completed')
      .not('actual_time', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(50);

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .single();

    // Calculate average efficiency metrics
    const efficiencyStats = calculateEfficiencyStats(historicalTasks || []);

    console.log('[WorkflowProcessor] Historical data:', {
      tasksAnalyzed: historicalTasks?.length || 0,
      avgEfficiency: efficiencyStats.avgEfficiency,
      userLevel: profile?.level || 1
    });

    // Enhanced prompt for reasoning model
    const prompt = `You are an expert productivity system analyzing a hierarchical workflow. Use multi-step reasoning to parse, organize, and estimate this workflow.

USER CONTEXT:
- Level: ${profile?.level || 1}
- Current Streak: ${profile?.current_streak || 0} days
- Historical Efficiency: ${efficiencyStats.avgEfficiency.toFixed(2)}x (actual/estimated time ratio)
- Completed Tasks: ${historicalTasks?.length || 0}

HISTORICAL TIME PATTERNS:
${efficiencyStats.byDifficulty.basic ? `- Basic tasks: avg ${efficiencyStats.byDifficulty.basic.avgTime}min (${efficiencyStats.byDifficulty.basic.efficiency.toFixed(2)}x efficiency)` : ''}
${efficiencyStats.byDifficulty.intermediate ? `- Intermediate tasks: avg ${efficiencyStats.byDifficulty.intermediate.avgTime}min (${efficiencyStats.byDifficulty.intermediate.efficiency.toFixed(2)}x efficiency)` : ''}
${efficiencyStats.byDifficulty.advanced ? `- Advanced tasks: avg ${efficiencyStats.byDifficulty.advanced.avgTime}min (${efficiencyStats.byDifficulty.advanced.efficiency.toFixed(2)}x efficiency)` : ''}

MARKDOWN WORKFLOW:
\`\`\`
${markdown}
\`\`\`

ANALYSIS REQUIREMENTS:

1. **Parse Hierarchical Structure**:
   - Identify main categories (## headers)
   - Extract all tasks and subtasks (- items)
   - Preserve parent-child relationships
   - Maintain order and grouping

2. **Intelligent Task Analysis** (for each task):
   - Determine difficulty (basic/intermediate/advanced) based on complexity
   - Assign priority (1-5) based on hierarchy position and nature
   - Estimate completion time using:
     * Historical user efficiency patterns
     * Task complexity indicators
     * Similar past task analysis
     * Realistic buffer for new task types
   - Choose optimal context (desk/gym/errand/reading/quiet/kitchen/outdoor/mobile/anywhere/couch)
   - Assess energy requirement (low/medium/high)
   - Calculate value score (1-5)
   - Suggest relevant tags

3. **Generate Actionable Subtasks**:
   - Break complex tasks into 3-8 specific steps
   - Estimate time for each subtask (realistic 5-45min chunks)
   - Order subtasks logically
   - Consider dependencies

4. **XP Calculation**:
   - Use difficulty and priority to calculate expected XP
   - Basic: 20 base XP, Intermediate: 75, Advanced: 200
   - Apply priority multiplier (1.00 to 1.20)
   - Show expected XP range (accounting for efficiency)

5. **Node/Domain Mapping**:
   - Map tasks to skill domains (Programming, Health, Learning, Finance, etc.)
   - Suggest node creation for new skill areas
   - Create logical skill tree structure

REASONING INSTRUCTIONS:
- Think step-by-step about time estimates
- Consider user's proven efficiency rates
- Be realistic but optimistic with estimates
- Group similar tasks under common nodes
- Preserve the workflow's hierarchical meaning

OUTPUT FORMAT (JSON):
{
  "workflow": {
    "totalTasks": number,
    "totalEstimatedTime": number,
    "totalExpectedXP": number,
    "domains": ["domain1", "domain2"]
  },
  "nodes": [
    {
      "title": "Domain/Category Name",
      "domain": "programming|health|finance|learning|creative|general",
      "description": "What this skill area covers",
      "goalType": "habit|project|one-off",
      "estimatedTotalMinutes": number,
      "position": { "x": number, "y": number }
    }
  ],
  "tasks": [
    {
      "title": "Specific task title",
      "description": "Detailed description with context",
      "category": "programming|health|finance|learning|creative|general",
      "difficulty": "basic|intermediate|advanced",
      "priority": 1-5,
      "estimatedTime": number (minutes),
      "context": "desk|gym|errand|reading|quiet|kitchen|outdoor|mobile|anywhere|couch",
      "energy": "low|medium|high",
      "valueScore": 1-5,
      "tags": ["tag1", "tag2"],
      "nodeDomain": "matching domain",
      "expectedXP": number,
      "subtasks": [
        {
          "title": "Specific subtask",
          "estMinutes": number,
          "tags": ["tag"]
        }
      ],
      "reasoning": "Why these estimates and categorization"
    }
  ],
  "reasoning": "Overall analysis and estimation strategy"
}`;

    // Call OpenAI with reasoning model for best results
    console.log('[WorkflowProcessor] Calling OpenAI o3 reasoning model...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o3-2025-04-16', // Advanced reasoning model
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert productivity system with deep reasoning capabilities. Analyze workflows methodically and provide realistic, data-driven estimates. Always respond with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[WorkflowProcessor] OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const aiData = await response.json();
    console.log('[WorkflowProcessor] OpenAI response received');

    // Parse response
    let content = aiData.choices[0].message.content;
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    }
    const analysis = JSON.parse(content);

    console.log('[WorkflowProcessor] Parsed analysis:', {
      nodes: analysis.nodes?.length || 0,
      tasks: analysis.tasks?.length || 0,
      totalXP: analysis.workflow?.totalExpectedXP || 0
    });

    // Create nodes in database
    const createdNodes: any[] = [];
    for (const nodeData of analysis.nodes || []) {
      const { data: newNode } = await supabase
        .from('nodes')
        .insert({
          title: nodeData.title,
          description: nodeData.description,
          domain: nodeData.domain,
          goal_type: nodeData.goalType,
          position_x: nodeData.position?.x || Math.floor(Math.random() * 800),
          position_y: nodeData.position?.y || Math.floor(Math.random() * 600),
          status: 'available',
          est_total_minutes: nodeData.estimatedTotalMinutes || null,
          metadata: {
            xp: 0,
            color: getColorForDomain(nodeData.domain)
          }
        })
        .select()
        .single();

      if (newNode) {
        createdNodes.push(newNode);
      }
    }

    console.log('[WorkflowProcessor] Created nodes:', createdNodes.length);

    // Create tasks in database
    const createdTasks: any[] = [];
    for (const taskData of analysis.tasks || []) {
      // Find matching node
      const matchingNode = createdNodes.find(n => 
        n.domain === taskData.nodeDomain || n.title.toLowerCase().includes(taskData.category)
      );

      const { data: newTask } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          category: taskData.category,
          difficulty: taskData.difficulty,
          priority: taskData.priority,
          estimated_time: taskData.estimatedTime,
          xp_reward: taskData.expectedXP,
          context: taskData.context,
          energy: taskData.energy,
          value_score: taskData.valueScore,
          tags: taskData.tags || [],
          node_id: matchingNode?.id || null,
          status: 'pending'
        })
        .select()
        .single();

      if (newTask) {
        createdTasks.push({ ...newTask, subtasks: taskData.subtasks });

        // Create subtasks
        if (taskData.subtasks && taskData.subtasks.length > 0) {
          const subtaskInserts = taskData.subtasks.map((st: any, idx: number) => ({
            task_id: newTask.id,
            title: st.title,
            est_minutes: st.estMinutes,
            seq: idx + 1,
            tags: st.tags || [],
            status: 'todo'
          }));

          await supabase
            .from('subtasks')
            .insert(subtaskInserts);
        }
      }
    }

    console.log('[WorkflowProcessor] Created tasks:', createdTasks.length);

    const result = {
      success: true,
      workflow: analysis.workflow,
      nodes: createdNodes,
      tasks: createdTasks.map(t => ({
        ...t,
        subtaskCount: t.subtasks?.length || 0
      })),
      reasoning: analysis.reasoning,
      stats: {
        nodesCreated: createdNodes.length,
        tasksCreated: createdTasks.length,
        subtasksCreated: createdTasks.reduce((sum: number, t: any) => sum + (t.subtasks?.length || 0), 0),
        totalEstimatedTime: analysis.workflow?.totalEstimatedTime || 0,
        totalExpectedXP: analysis.workflow?.totalExpectedXP || 0
      }
    };

    console.log('[WorkflowProcessor] Processing complete:', result.stats);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[WorkflowProcessor] Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper: Calculate efficiency statistics from historical data
function calculateEfficiencyStats(tasks: any[]) {
  if (!tasks || tasks.length === 0) {
    return {
      avgEfficiency: 1.0,
      byDifficulty: {}
    };
  }

  const validTasks = tasks.filter(t => t.estimated_time > 0 && t.actual_time > 0);
  
  if (validTasks.length === 0) {
    return {
      avgEfficiency: 1.0,
      byDifficulty: {}
    };
  }

  const totalEfficiency = validTasks.reduce((sum, t) => 
    sum + (t.actual_time / t.estimated_time), 0
  ) / validTasks.length;

  const byDifficulty: any = {};
  ['basic', 'intermediate', 'advanced'].forEach(diff => {
    const diffTasks = validTasks.filter(t => t.difficulty === diff);
    if (diffTasks.length > 0) {
      const avgActual = diffTasks.reduce((sum, t) => sum + t.actual_time, 0) / diffTasks.length;
      const avgEst = diffTasks.reduce((sum, t) => sum + t.estimated_time, 0) / diffTasks.length;
      byDifficulty[diff] = {
        avgTime: Math.round(avgActual),
        efficiency: avgActual / avgEst
      };
    }
  });

  return {
    avgEfficiency: totalEfficiency,
    byDifficulty
  };
}

// Helper: Get color based on domain
function getColorForDomain(domain: string): string {
  const colors: Record<string, string> = {
    programming: '#22c55e',
    health: '#ef4444',
    finance: '#f59e0b',
    learning: '#3b82f6',
    creative: '#a855f7',
    general: '#6b7280'
  };
  return colors[domain] || '#6b7280';
}
