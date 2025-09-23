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
    console.log(`[Action Counsellor] Action: ${action}`);

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    switch (action) {
      case 'analyzeTask':
        return await analyzeTask(supabase, payload);
      case 'breakdownTask':
        return await breakdownTask(supabase, payload);
      case 'connectToNodes':
        return await connectToNodes(supabase, payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[Action Counsellor] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeTask(supabase: any, payload: any) {
  const { taskTitle, taskDescription, existingNodes } = payload;
  
  console.log(`[analyzeTask] Processing task: ${taskTitle}`);
  
  // Get user's existing nodes for context
  const { data: nodes } = await supabase
    .from('nodes')
    .select('id, title, domain, description')
    .limit(20);

  const nodeContext = nodes?.map(n => `${n.domain}: ${n.title}`).join(', ') || 'No existing nodes';

  const prompt = `
    Analyze this task and provide recommendations:
    
    Task: "${taskTitle}"
    Description: "${taskDescription || ''}"
    
    Existing skill nodes: ${nodeContext}
    
    Provide a JSON response with:
    {
      "connectedNodes": ["node_id1", "node_id2"], // IDs of existing nodes this task connects to
      "suggestedNewNodes": [
        {
          "title": "Node Title",
          "domain": "programming|health|finance|learning|general",
          "description": "Brief description",
          "goalType": "habit|project|one-off"
        }
      ],
      "taskAnalysis": {
        "category": "programming|health|finance|learning|general",
        "difficulty": "basic|intermediate|advanced",
        "estimatedTime": 45, // minutes
        "priority": 3, // 1-5
        "context": "desk|gym|errand|reading|quiet",
        "energy": "low|medium|high",
        "valueScore": 4 // 1-5
      },
      "reasoning": "Explanation of connections and recommendations"
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
        { role: 'system', content: 'You are an expert task analyzer. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const aiData = await response.json();
  const analysis = JSON.parse(aiData.choices[0].message.content);
  
  console.log(`[analyzeTask] Analysis complete for: ${taskTitle}`);
  
  return new Response(JSON.stringify({ success: true, analysis }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function breakdownTask(supabase: any, payload: any) {
  const { taskId } = payload;
  
  console.log(`[breakdownTask] Breaking down task: ${taskId}`);
  
  // Get task details
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (!task) {
    throw new Error('Task not found');
  }

  const prompt = `
    Break down this task into actionable subtasks:
    
    Task: "${task.title}"
    Description: "${task.description || ''}"
    Estimated Time: ${task.estimated_time} minutes
    Context: ${task.context}
    Energy Level: ${task.energy}
    
    Create 3-10 subtasks that:
    - Are specific and actionable
    - Have realistic time estimates (5-45 minutes each)
    - Consider the context and energy requirements
    - Are ordered logically for completion
    
    Provide a JSON response with:
    {
      "subtasks": [
        {
          "title": "Specific subtask title",
          "estMinutes": 25,
          "seq": 1,
          "tags": ["tag1", "tag2"],
          "dependencies": [] // titles of other subtasks that must be done first
        }
      ],
      "totalEstimatedTime": 120, // sum of all subtask times
      "reasoning": "Brief explanation of the breakdown approach"
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
        { role: 'system', content: 'You are an expert at breaking down complex tasks into manageable subtasks. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const aiData = await response.json();
  const breakdown = JSON.parse(aiData.choices[0].message.content);
  
  // Create subtasks in database
  const subtaskInserts = breakdown.subtasks.map((subtask: any, index: number) => ({
    task_id: taskId,
    title: subtask.title,
    est_minutes: subtask.estMinutes,
    seq: index + 1,
    tags: subtask.tags || [],
    status: 'todo'
  }));

  const { data: createdSubtasks } = await supabase
    .from('subtasks')
    .insert(subtaskInserts)
    .select();

  // Update task with new estimated time
  await supabase
    .from('tasks')
    .update({ estimated_time: breakdown.totalEstimatedTime })
    .eq('id', taskId);
  
  console.log(`[breakdownTask] Created ${createdSubtasks?.length || 0} subtasks for task: ${taskId}`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    subtasks: createdSubtasks,
    breakdown: breakdown.reasoning
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function connectToNodes(supabase: any, payload: any) {
  const { taskId, nodeIds, createNewNodes } = payload;
  
  console.log(`[connectToNodes] Connecting task ${taskId} to nodes: ${nodeIds}`);
  
  // Connect task to existing nodes
  if (nodeIds && nodeIds.length > 0) {
    // For now, we'll connect to the first node (tasks can have one primary node)
    await supabase
      .from('tasks')
      .update({ node_id: nodeIds[0] })
      .eq('id', taskId);
  }
  
  // Create new nodes if requested
  let createdNodes = [];
  if (createNewNodes && createNewNodes.length > 0) {
    for (const nodeData of createNewNodes) {
      const { data: newNode } = await supabase
        .from('nodes')
        .insert({
          title: nodeData.title,
          description: nodeData.description,
          domain: nodeData.domain,
          goal_type: nodeData.goalType,
          position_x: Math.floor(Math.random() * 500),
          position_y: Math.floor(Math.random() * 500),
          status: 'available'
        })
        .select()
        .single();
      
      if (newNode) {
        createdNodes.push(newNode);
        
        // Connect task to the first new node created
        if (createdNodes.length === 1) {
          await supabase
            .from('tasks')
            .update({ node_id: newNode.id })
            .eq('id', taskId);
        }
      }
    }
  }
  
  console.log(`[connectToNodes] Created ${createdNodes.length} new nodes for task: ${taskId}`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    connectedNodes: nodeIds,
    createdNodes
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}