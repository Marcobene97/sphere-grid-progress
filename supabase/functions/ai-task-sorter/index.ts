import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fetch all pending tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (tasksError) throw tasksError;

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ 
        sorted: [], 
        message: 'No tasks to sort' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Lovable AI for intelligent task sorting
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a productivity AI that analyzes tasks and provides intelligent sorting and XP calculations.
For each task, provide:
1. A priority score (1-5, where 5 is highest)
2. XP reward based on complexity and time (15-200)
3. Difficulty (basic, intermediate, advanced)
4. Estimated time in minutes (15-120)
5. Sort tasks by value/urgency matrix

Return JSON only: { "tasks": [{ "id": "uuid", "priority": 1-5, "xp_reward": number, "difficulty": "basic|intermediate|advanced", "estimated_time": number, "reasoning": "brief" }] }`
          },
          {
            role: 'user',
            content: `Sort and calculate XP for these tasks:\n${tasks.map(t => `- ${t.title}${t.description ? ': ' + t.description : ''}`).join('\n')}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "sort_tasks",
            description: "Sort tasks and calculate XP rewards",
            parameters: {
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      priority: { type: "integer", minimum: 1, maximum: 5 },
                      xp_reward: { type: "integer", minimum: 15, maximum: 200 },
                      difficulty: { type: "string", enum: ["basic", "intermediate", "advanced"] },
                      estimated_time: { type: "integer", minimum: 15, maximum: 120 },
                      reasoning: { type: "string" }
                    },
                    required: ["id", "priority", "xp_reward", "difficulty", "estimated_time"]
                  }
                }
              },
              required: ["tasks"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "sort_tasks" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const sortedData = JSON.parse(toolCall.function.arguments);

    // Update tasks in database
    const updates = sortedData.tasks.map((taskUpdate: any) => {
      const originalTask = tasks.find(t => t.id === taskUpdate.id);
      if (!originalTask) return null;

      return supabase
        .from('tasks')
        .update({
          priority: taskUpdate.priority,
          xp_reward: taskUpdate.xp_reward,
          difficulty: taskUpdate.difficulty,
          estimated_time: taskUpdate.estimated_time,
        })
        .eq('id', taskUpdate.id);
    }).filter(Boolean);

    await Promise.all(updates);

    console.log('Tasks sorted and updated:', sortedData.tasks.length);

    return new Response(JSON.stringify({ 
      sorted: sortedData.tasks,
      count: sortedData.tasks.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-task-sorter:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
