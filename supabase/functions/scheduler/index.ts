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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    console.log(`[Scheduler] Action: ${action}`);

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    switch (action) {
      case 'generateDayPlan':
        return await generateDayPlan(supabase, payload);
      case 'optimizeSchedule':
        return await optimizeSchedule(supabase, payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateDayPlan(supabase: any, payload: any) {
  const { 
    date, 
    workHours = { start: '09:00', end: '17:00' },
    breakInterval = 90, // minutes between breaks
    breakDuration = 15, // minutes per break
    lunchBreak = { start: '12:00', duration: 60 }
  } = payload;
  
  console.log(`[generateDayPlan] Creating plan for date: ${date}`);
  
  // Clear existing non-locked slots for this date
  await supabase
    .from('day_plan_slots')
    .delete()
    .eq('date', date)
    .eq('locked', false);
  
  // Get pending subtasks ordered by priority and deadline
  const { data: subtasks } = await supabase
    .from('subtasks')
    .select(`
      *,
      tasks!inner(
        title,
        priority,
        due_date,
        context,
        energy,
        value_score,
        category
      )
    `)
    .eq('status', 'todo')
    .order('tasks.priority', { ascending: false });
  
  // Get existing locked slots
  const { data: lockedSlots } = await supabase
    .from('day_plan_slots')
    .select('*')
    .eq('date', date)
    .eq('locked', true);
  
  if (!subtasks || subtasks.length === 0) {
    console.log(`[generateDayPlan] No pending subtasks found`);
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'No pending subtasks to schedule',
      slotsCreated: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const prompt = `
    Create an optimal daily schedule for these subtasks:
    
    Date: ${date}
    Work Hours: ${workHours.start} - ${workHours.end}
    Break every ${breakInterval} minutes for ${breakDuration} minutes
    Lunch break: ${lunchBreak.start} for ${lunchBreak.duration} minutes
    
    Existing locked slots: ${JSON.stringify(lockedSlots || [])}
    
    Available subtasks:
    ${subtasks.map((st: any) => `
      - "${st.title}" (${st.est_minutes}min, ${st.tasks.context}, ${st.tasks.energy} energy, priority: ${st.tasks.priority}, value: ${st.tasks.value_score})
    `).join('')}
    
    Create a balanced schedule that:
    - Respects work hours and existing locked slots
    - Alternates between different contexts and energy levels
    - Prioritizes high-value, urgent tasks
    - Includes appropriate breaks
    - Groups similar tasks when efficient
    - Considers energy levels (high-energy tasks in morning)
    
    Provide a JSON response with:
    {
      "schedule": [
        {
          "subtaskId": "uuid",
          "startTime": "09:00",
          "endTime": "09:25",
          "reasoning": "Why this subtask fits here"
        }
      ],
      "unscheduled": ["subtask_id1"], // subtasks that couldn't fit
      "summary": "Brief explanation of scheduling strategy"
    }
    
    Times should be in HH:MM format. Only schedule subtasks that fit completely within available time.
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert scheduling assistant. Always respond with valid JSON. Be realistic about time constraints.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Lower temperature for more consistent scheduling
    }),
  });

  const aiData = await response.json();
  const schedule = JSON.parse(aiData.choices[0].message.content);
  
  // Create day plan slots
  const slotsToCreate = schedule.schedule.map((slot: any) => ({
    date,
    subtask_id: slot.subtaskId,
    slot_start: `${date}T${slot.startTime}:00`,
    slot_end: `${date}T${slot.endTime}:00`,
    locked: false
  }));

  let createdSlots = [];
  if (slotsToCreate.length > 0) {
    const { data: slots } = await supabase
      .from('day_plan_slots')
      .insert(slotsToCreate)
      .select();
    createdSlots = slots || [];
  }
  
  console.log(`[generateDayPlan] Created ${createdSlots.length} scheduled slots for date: ${date}`);
  
  return new Response(JSON.stringify({ 
    success: true,
    slotsCreated: createdSlots.length,
    totalSubtasks: subtasks.length,
    unscheduled: schedule.unscheduled || [],
    summary: schedule.summary,
    schedule: createdSlots
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function optimizeSchedule(supabase: any, payload: any) {
  const { date, constraints } = payload;
  
  console.log(`[optimizeSchedule] Optimizing schedule for date: ${date}`);
  
  // Get current day plan
  const { data: currentPlan } = await supabase
    .from('day_plan_slots')
    .select(`
      *,
      subtasks(
        *,
        tasks(title, priority, context, energy, value_score)
      )
    `)
    .eq('date', date)
    .order('slot_start');
  
  if (!currentPlan || currentPlan.length === 0) {
    return new Response(JSON.stringify({ 
      success: true,
      message: 'No existing schedule to optimize'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const prompt = `
    Analyze and optimize this existing schedule:
    
    Current schedule for ${date}:
    ${currentPlan.map(slot => `
      ${slot.slot_start} - ${slot.slot_end}: ${slot.subtasks?.title || 'Break'} 
      (${slot.subtasks?.tasks?.context}, ${slot.subtasks?.tasks?.energy} energy, priority: ${slot.subtasks?.tasks?.priority})
    `).join('')}
    
    Constraints: ${JSON.stringify(constraints || {})}
    
    Suggest improvements for:
    - Better energy level matching (high-energy tasks in morning)
    - More efficient context switching
    - Better priority ordering
    - Workload balance
    - Break placement
    
    Provide a JSON response with:
    {
      "suggestions": [
        {
          "type": "reorder|swap|break|consolidate",
          "description": "What to change and why",
          "impact": "Expected benefit",
          "slots": ["slot_id1", "slot_id2"] // affected slots
        }
      ],
      "optimizedScore": 85, // 0-100 rating of current schedule
      "summary": "Overall assessment and key recommendations"
    }
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert productivity coach analyzing daily schedules. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
    }),
  });

  const aiData = await response.json();
  const optimization = JSON.parse(aiData.choices[0].message.content);
  
  console.log(`[optimizeSchedule] Analysis complete for date: ${date}, score: ${optimization.optimizedScore}`);
  
  return new Response(JSON.stringify({ 
    success: true,
    ...optimization
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}