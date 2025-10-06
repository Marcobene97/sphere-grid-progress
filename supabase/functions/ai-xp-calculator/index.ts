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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
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

    // Fetch all pending tasks
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, title, description, difficulty, estimated_time, priority')
      .eq('status', 'pending')
      .eq('user_id', user.id);

    if (fetchError) {
      throw new Error('Failed to fetch tasks');
    }

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tasks to calculate XP for', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[XP Calculator] Processing ${tasks.length} tasks`);

    // Prepare task descriptions for OpenAI
    const taskDescriptions = tasks.map((t, i) => 
      `Task ${i + 1}: "${t.title}" (${t.difficulty}, ${t.estimated_time}min, priority ${t.priority})`
    ).join('\n');

    // Call OpenAI to calculate XP for each task
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
            content: `You are an XP calculation expert for a gamified productivity app. Calculate fair XP rewards based on:
- Difficulty (basic: 1x, intermediate: 2x, advanced: 3x)
- Estimated time (longer = more XP)
- Priority (higher priority = slight boost)

Base XP formulas:
- Basic: 10-30 XP (5-15min tasks)
- Basic: 30-60 XP (15-45min tasks)
- Intermediate: 60-120 XP
- Advanced: 120-250 XP

Adjust based on priority:
- Priority 5: +20%
- Priority 4: +10%
- Priority 3: base
- Priority 2: -10%
- Priority 1: -20%

Return ONLY a valid JSON array with XP for each task:
[15, 45, 80, 120, 200]

No markdown, no extra text, ONLY the JSON array of numbers.`
          },
          {
            role: 'user',
            content: `Calculate XP rewards for these tasks:\n\n${taskDescriptions}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[XP Calculator] OpenAI error:', response.status, errorText);
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      if (response.status === 402) {
        throw new Error('OpenAI credits exhausted');
      }
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    console.log('[XP Calculator] Raw response:', content);

    // Parse XP values
    let xpValues;
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      xpValues = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('[XP Calculator] Failed to parse JSON:', content);
      throw new Error('Failed to parse AI response');
    }

    if (!Array.isArray(xpValues) || xpValues.length !== tasks.length) {
      throw new Error('Invalid XP calculation response');
    }

    // Update tasks with calculated XP
    const updates = tasks.map((task, i) => ({
      id: task.id,
      xp_reward: Math.max(5, Math.min(300, xpValues[i])) // Clamp between 5-300
    }));

    let updateCount = 0;
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ xp_reward: update.xp_reward })
        .eq('id', update.id);

      if (!updateError) updateCount++;
    }

    console.log(`[XP Calculator] Updated ${updateCount} tasks`);

    return new Response(
      JSON.stringify({ 
        success: true,
        count: updateCount,
        message: `Calculated XP for ${updateCount} tasks`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[XP Calculator] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
