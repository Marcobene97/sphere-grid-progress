import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { brainDump } = await req.json();
    
    if (!brainDump || brainDump.trim().length === 0) {
      throw new Error('Brain dump text is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('[Brain Dump] Processing:', brainDump.substring(0, 100));

    // Call OpenAI to extract individual tasks
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a task extraction expert. Extract individual, actionable tasks from brain dump text.

RULES:
- Extract 1-15 distinct, actionable tasks
- Each task must be specific and achievable
- Start with action verbs
- Estimate difficulty: basic, intermediate, or advanced
- Estimate time in minutes (5-120)
- Assign priority 1-5 (5=highest)

Return ONLY a valid JSON array:
[
  {
    "title": "Task title",
    "description": "Brief description",
    "difficulty": "basic",
    "estimated_time": 30,
    "priority": 3
  }
]

No markdown, no extra text, ONLY the JSON array.`
          },
          {
            role: 'user',
            content: brainDump
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Brain Dump] OpenAI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded, please try again later');
      }
      if (response.status === 402) {
        throw new Error('OpenAI credits exhausted');
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    console.log('[Brain Dump] Raw response:', content);

    // Parse JSON response
    let extractedTasks;
    try {
      // Remove markdown code blocks if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      extractedTasks = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('[Brain Dump] Failed to parse JSON:', content);
      throw new Error('Failed to parse AI response');
    }

    if (!Array.isArray(extractedTasks) || extractedTasks.length === 0) {
      throw new Error('No tasks extracted from brain dump');
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Insert tasks into database
    const tasksToInsert = extractedTasks.map((task: any) => ({
      user_id: user.id,
      title: task.title,
      description: task.description || null,
      difficulty: task.difficulty || 'basic',
      estimated_time: task.estimated_time || 30,
      priority: task.priority || 3,
      status: 'pending',
      xp_reward: 15 // Base XP, will be calculated by ai-xp-calculator
    }));

    const { data: insertedTasks, error: insertError } = await supabase
      .from('tasks')
      .insert(tasksToInsert)
      .select();

    if (insertError) {
      console.error('[Brain Dump] Insert error:', insertError);
      throw new Error('Failed to save tasks');
    }

    console.log(`[Brain Dump] Created ${insertedTasks.length} tasks`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: insertedTasks.length,
        tasks: insertedTasks
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Brain Dump] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
