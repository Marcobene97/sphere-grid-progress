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
      case 'processBrainDump':
        return await processBrainDump(supabase, payload);
      case 'seedMindmap':
        return await seedMindmap(supabase, payload);
      case 'optimizeCategories':
        return await optimizeCategories(supabase, payload);
      case 'autoScheduleTasks':
        return await autoScheduleTasks(supabase, payload);
      case 'rebalanceNodes':
        return await rebalanceNodes(supabase, payload);
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
        "context": "desk|gym|errand|reading|quiet|kitchen|outdoor|mobile|anywhere|couch",
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

// Enhanced brain dump processing function
async function processBrainDump(supabase: any, payload: any) {
  const { text } = payload;
  
  console.log('[processBrainDump] Processing:', text);
  
  // Get existing nodes to provide context
  const { data: existingNodes } = await supabase
    .from('nodes')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log('[processBrainDump] Existing nodes:', existingNodes?.length || 0);

  // Enhanced prompt for intelligent brain dump processing
  const prompt = `You are an intelligent task organizer. Analyze the following brain dump and extract actionable tasks and skill categories.

EXISTING SKILL NODES: ${existingNodes ? existingNodes.map(n => `${n.title} (${n.domain})`).join(', ') : 'None'}

BRAIN DUMP TEXT: "${text}"

Extract and organize tasks from this text. For each task:
1. Identify the main action/goal
2. Estimate time needed (in minutes)
3. Determine difficulty (basic/intermediate/advanced) 
4. Assign priority (1-5, where 5 is highest)
5. Categorize by domain/skill area
6. Calculate value score (1-5)
7. Suggest appropriate context (desk/mobile/gym/kitchen/etc.)
8. Estimate energy level needed (low/medium/high)

For skill nodes, suggest new categories or subcategories if the tasks don't fit existing ones.

EXAMPLE: "I want to complete one chapter of a textbook in C" should become:
- Task: "Complete Chapter X of C Programming Textbook"
- Connect to/Create: "Programming" → "C Programming" skill node
- Estimate: 60-90 minutes
- Difficulty: intermediate
- Priority: 4
- Create subtasks: Read chapter, Take notes, Do exercises, Review concepts

Return JSON format:
{
  "tasks": [
    {
      "title": "specific actionable task title",
      "description": "detailed description with context",
      "category": "programming|learning|health|finance|creative|general",
      "difficulty": "basic|intermediate|advanced",
      "priority": 1-5,
      "estimatedTime": minutes_number,
      "context": "desk|gym|errand|reading|quiet|kitchen|outdoor|mobile|anywhere|couch", 
      "energy": "low|medium|high",
      "valueScore": 1-5,
      "tags": ["relevant", "tags"],
      "domain": "skill_domain"
    }
  ],
  "nodes": [
    {
      "title": "Skill/Category Name", 
      "domain": "programming|learning|health|finance|creative|general",
      "description": "what this skill area covers",
      "goalType": "habit|project|one-off"
    }
  ]
}

Be intelligent about parsing - extract multiple tasks from continuous text, infer context, and create meaningful categorization.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert task organizer and productivity coach. Always return valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    console.log('[processBrainDump] OpenAI response:', data);
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI response');
    }

    // Handle both raw JSON and markdown-wrapped JSON
    let content = data.choices[0].message.content;
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    }
    const analysis = JSON.parse(content);
    console.log('[processBrainDump] Parsed analysis:', analysis);
    
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('[processBrainDump] Error:', error);
    throw error;
  }
}

// Automatic category optimization and node management
async function optimizeCategories(supabase: any, payload: any) {
  console.log('[optimizeCategories] Starting category optimization');
  
  // Get all user's nodes and tasks
  const { data: nodes } = await supabase.from('nodes').select('*');
  const { data: tasks } = await supabase.from('tasks').select('*');
  
  const nodeContext = nodes?.map(n => `${n.title} (${n.domain}, progress: ${n.progress}%)`).join(', ') || 'No nodes';
  const taskContext = tasks?.map(t => `${t.title} (${t.category}, ${t.estimated_time}min, priority: ${t.priority})`).join(', ') || 'No tasks';

  const prompt = `
    Analyze and optimize the user's skill nodes and task categories:
    
    NODES: ${nodeContext}
    
    TASKS: ${taskContext}
    
    Provide optimization recommendations in JSON format:
    {
      "categoryUpdates": [
        {
          "taskId": "task_id",
          "newCategory": "programming|learning|health|finance|creative|general",
          "reasoning": "why this change improves organization"
        }
      ],
      "nodeUpdates": [
        {
          "nodeId": "node_id", 
          "updates": {
            "title": "improved title",
            "domain": "updated_domain",
            "description": "enhanced description"
          },
          "reasoning": "why this improves the node"
        }
      ],
      "recommendations": "Overall optimization strategy and reasoning"
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
        { role: 'system', content: 'You are an expert at organizing and optimizing skill development systems. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const aiData = await response.json();
  const optimization = JSON.parse(aiData.choices[0].message.content);
  
  // Apply category updates
  let updatesApplied = 0;
  for (const update of optimization.categoryUpdates || []) {
    await supabase
      .from('tasks')
      .update({ category: update.newCategory })
      .eq('id', update.taskId);
    updatesApplied++;
  }

  // Apply node updates
  for (const update of optimization.nodeUpdates || []) {
    await supabase
      .from('nodes') 
      .update(update.updates)
      .eq('id', update.nodeId);
    updatesApplied++;
  }

  console.log(`[optimizeCategories] Applied ${updatesApplied} optimization updates`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    optimization,
    updatesApplied
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Intelligent task scheduling and calendar optimization  
async function autoScheduleTasks(supabase: any, payload: any) {
  const { date, preferences = {} } = payload;
  
  console.log(`[autoScheduleTasks] Optimizing schedule for ${date}`);
  
  // Get tasks and subtasks with their current status
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .in('status', ['pending', 'in_progress']);

  const { data: existingSlots } = await supabase
    .from('day_plan_slots')
    .select('*')
    .eq('date', date);

  const taskContext = tasks?.map(t => 
    `${t.title} (${t.estimated_time}min, priority: ${t.priority}, energy: ${t.energy}, context: ${t.context})`
  ).join(', ') || 'No tasks';

  const prompt = `
    Create an optimized daily schedule for ${date}:
    
    AVAILABLE TASKS: ${taskContext}
    
    EXISTING SLOTS: ${existingSlots?.length || 0} slots already scheduled
    
    Create a schedule that:
    - Respects energy levels (high energy tasks in morning)
    - Groups similar contexts together
    - Considers task priorities
    - Allows for breaks and transitions
    - Fits within a realistic 8-12 hour workday
    
    Return JSON format:
    {
      "schedule": [
        {
          "taskId": "task_id",
          "startTime": "09:00",
          "endTime": "10:30", 
          "reasoning": "why scheduled at this time"
        }
      ],
      "insights": {
        "totalPlannedMinutes": 480,
        "energyAlignment": "description",
        "recommendations": "scheduling tips"
      }
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
        { role: 'system', content: 'You are an expert productivity scheduler. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const aiData = await response.json();
  const schedule = JSON.parse(aiData.choices[0].message.content);
  
  // Create day plan slots
  let slotsCreated = 0;
  for (const slot of schedule.schedule || []) {
    const { data: task } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', slot.taskId)
      .single();
    
    if (task) {
      await supabase
        .from('day_plan_slots')
        .insert({
          date: date,
          slot_start: `${date} ${slot.startTime}:00`,
          slot_end: `${date} ${slot.endTime}:00`,
          subtask_id: null // Link to task through other means if needed
        });
      slotsCreated++;
    }
  }

  console.log(`[autoScheduleTasks] Created ${slotsCreated} schedule slots for ${date}`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    schedule,
    slotsCreated
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Node rebalancing and progress updates
async function rebalanceNodes(supabase: any, payload: any) {
  console.log('[rebalanceNodes] Starting node rebalancing');
  
  // Get nodes with their current state
  const { data: nodes } = await supabase.from('nodes').select('*');
  const { data: tasks } = await supabase.from('tasks').select('*');
  
  const nodeContext = nodes?.map(n => 
    `${n.title}: ${n.progress}% complete, ${n.time_spent}min spent, status: ${n.status}`
  ).join(', ') || 'No nodes';

  const taskContext = tasks?.map(t => 
    `${t.title} -> node: ${t.node_id}, completed: ${t.status === 'completed'}`
  ).join(', ') || 'No tasks';

  const prompt = `
    Analyze node progress and suggest rebalancing:
    
    NODES: ${nodeContext}
    
    TASKS: ${taskContext}
    
    Suggest improvements in JSON format:
    {
      "progressUpdates": [
        {
          "nodeId": "node_id",
          "calculatedProgress": 75,
          "xpGained": 50,
          "reasoning": "why this progress calculation"
        }
      ],
      "nodeMergers": [
        {
          "primaryNodeId": "keep_this_node",
          "mergeNodeIds": ["merge_into_primary"],
          "newTitle": "combined node title",
          "transferTasks": true,
          "reasoning": "why merge these nodes"
        }
      ],
      "recommendations": "Overall rebalancing strategy"
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
        { role: 'system', content: 'You are an expert at balancing skill progression systems. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  const aiData = await response.json();
  const rebalancing = JSON.parse(aiData.choices[0].message.content);
  
  let changesApplied = 0;
  
  // Apply progress updates
  for (const progressUpdate of rebalancing.progressUpdates || []) {
    // Update node progress
    await supabase
      .from('nodes')
      .update({ progress: progressUpdate.calculatedProgress })
      .eq('id', progressUpdate.nodeId);

    // Add XP event
    if (progressUpdate.xpGained > 0) {
      await supabase
        .from('xp_events')
        .insert({
          amount: progressUpdate.xpGained,
          source: 'node_progress_update',
          meta: { 
            nodeId: progressUpdate.nodeId, 
            reasoning: progressUpdate.reasoning 
          }
        });
    }
    changesApplied++;
  }

  // Handle node mergers
  for (const merger of rebalancing.nodeMergers || []) {
    if (merger.transferTasks) {
      // Transfer tasks from merged nodes to primary node
      for (const mergeNodeId of merger.mergeNodeIds) {
        await supabase
          .from('tasks')
          .update({ node_id: merger.primaryNodeId })
          .eq('node_id', mergeNodeId);
      }
      
      // Archive merged nodes
      await supabase
        .from('nodes')
        .update({ status: 'archived' })
        .in('id', merger.mergeNodeIds);
    }
    
    // Update primary node title
    await supabase
      .from('nodes')
      .update({ title: merger.newTitle })
      .eq('id', merger.primaryNodeId);
    
    changesApplied++;
  }

  console.log(`[rebalanceNodes] Applied ${changesApplied} rebalancing changes`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    rebalancing,
    changesApplied
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Seed initial mindmap based on user's structure
async function seedMindmap(supabase: any, payload: any) {
  console.log('[seedMindmap] Creating initial mindmap structure');
  
  const initialNodes = [
    // Programming Domain
    {
      title: 'Programming',
      domain: 'programming',
      description: 'Software development and coding skills',
      goal_type: 'project',
      position_x: 0,
      position_y: 0,
      metadata: { color: '#22c55e', xp: 0 }
    },
    {
      title: 'Freecodecamp - Responsive Web Design',
      domain: 'programming',
      description: 'Learn responsive web design through freeCodeCamp curriculum',
      goal_type: 'project',
      position_x: -200,
      position_y: -150,
      metadata: { color: '#3b82f6', xp: 0 }
    },
    {
      title: 'Trading System of Agents',
      domain: 'programming',
      description: 'Develop an intelligent trading system using multi-agent architecture',
      goal_type: 'project',
      position_x: -100,
      position_y: -100,
      metadata: { color: '#8b5cf6', xp: 0 }
    },
    {
      title: 'Heilbronn - C',
      domain: 'programming',
      description: 'C programming language course at Heilbronn',
      goal_type: 'project',
      position_x: 150,
      position_y: -100,
      metadata: { color: '#f59e0b', xp: 0 }
    },
    {
      title: 'Active Workflows',
      domain: 'programming',
      description: 'Learn and implement active workflow automation',
      goal_type: 'project',
      position_x: 200,
      position_y: 50,
      metadata: { color: '#10b981', xp: 0 }
    },

    // Reading Domain
    {
      title: 'Reading',
      domain: 'learning',
      description: 'Reading and knowledge acquisition',
      goal_type: 'habit',
      position_x: -400,
      position_y: 200,
      metadata: { color: '#ef4444', xp: 0 }
    },
    {
      title: 'History',
      domain: 'learning',
      description: 'Historical knowledge and research',
      goal_type: 'project',
      position_x: -500,
      position_y: 300,
      metadata: { color: '#dc2626', xp: 0 }
    },
    {
      title: 'Psychology',
      domain: 'learning',
      description: 'Psychology and human behavior studies',
      goal_type: 'project',
      position_x: -300,
      position_y: 350,
      metadata: { color: '#7c3aed', xp: 0 }
    },
    {
      title: 'Complex Systems reading / Logic',
      domain: 'learning',
      description: 'Study complex systems theory and logical thinking',
      goal_type: 'project',
      position_x: -100,
      position_y: 300,
      metadata: { color: '#06b6d4', xp: 0 }
    },

    // Creative Domain
    {
      title: 'DJ',
      domain: 'creative',
      description: 'DJ skills and music production',
      goal_type: 'habit',
      position_x: -600,
      position_y: 0,
      metadata: { color: '#ec4899', xp: 0 }
    },
    {
      title: 'Ableton',
      domain: 'creative',
      description: 'Music production with Ableton Live',
      goal_type: 'project',
      position_x: -700,
      position_y: -100,
      metadata: { color: '#f472b6', xp: 0 }
    },

    // Life Skills
    {
      title: 'Driving License',
      domain: 'general',
      description: 'Obtain driving license',
      goal_type: 'one-off',
      position_x: -800,
      position_y: 100,
      metadata: { color: '#84cc16', xp: 0 }
    },
    {
      title: 'Self-hygene',
      domain: 'health',
      description: 'Personal hygiene and grooming habits',
      goal_type: 'habit',
      position_x: 300,
      position_y: 200,
      metadata: { color: '#14b8a6', xp: 0 }
    },
    {
      title: 'Gym',
      domain: 'health',
      description: 'Fitness and strength training',
      goal_type: 'habit',
      position_x: 400,
      position_y: 100,
      metadata: { color: '#dc2626', xp: 0 }
    },

    // Business/Finance
    {
      title: 'CRM for Sport Trainers',
      domain: 'programming',
      description: 'Develop CRM system for sports trainers',
      goal_type: 'project',
      position_x: -300,
      position_y: 400,
      metadata: { color: '#7c2d12', xp: 0 }
    },
    {
      title: 'Excel Course',
      domain: 'learning',
      description: 'Advanced Excel skills and data analysis',
      goal_type: 'project',
      position_x: 500,
      position_y: -50,
      metadata: { color: '#16a34a', xp: 0 }
    },
    {
      title: 'Systems Design',
      domain: 'programming',
      description: 'Learn system design principles and patterns',
      goal_type: 'project',
      position_x: 100,
      position_y: 400,
      metadata: { color: '#1d4ed8', xp: 0 }
    }
  ];

  try {
    // Check if nodes already exist
    const { data: existingNodes } = await supabase
      .from('nodes')
      .select('title')
      .limit(5);

    if (existingNodes && existingNodes.length > 0) {
      console.log('[seedMindmap] Nodes already exist, skipping seed');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Mindmap already seeded',
        existingCount: existingNodes.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Automatic category optimization and node management
async function optimizeCategories(supabase: any, payload: any) {
  console.log('[optimizeCategories] Starting category optimization');
  
  // Get all user's nodes and tasks
  const { data: nodes } = await supabase.from('nodes').select('*');
  const { data: tasks } = await supabase.from('tasks').select('*');
  
  const nodeContext = nodes?.map(n => `${n.title} (${n.domain}, progress: ${n.progress}%)`).join(', ') || 'No nodes';
  const taskContext = tasks?.map(t => `${t.title} (${t.category}, ${t.estimated_time}min, priority: ${t.priority})`).join(', ') || 'No tasks';

  const prompt = `
    Analyze and optimize the user's skill nodes and task organization:
    
    EXISTING NODES: ${nodeContext}
    EXISTING TASKS: ${taskContext}
    
    Provide intelligent recommendations for:
    1. Node consolidation (merge similar/duplicate nodes)
    2. Category restructuring (better domain organization)
    3. Task-to-node connections based on relevance and efficiency
    4. Node hierarchy and prerequisites
    5. Priority rebalancing based on current progress and task difficulty
    
    Return JSON format:
    {
      "nodeUpdates": [
        {
          "nodeId": "existing_node_id",
          "updates": {
            "title": "optimized_title",
            "domain": "best_domain",
            "position": {"x": 100, "y": 200},
            "priority": 1-5,
            "prerequisites": ["node_id1", "node_id2"]
          }
        }
      ],
      "nodesToMerge": [
        {
          "primaryNodeId": "keep_this_node",
          "mergeNodeIds": ["node_to_merge1", "node_to_merge2"],
          "newTitle": "merged_title"
        }
      ],
      "taskConnections": [
        {
          "taskId": "task_id",
          "bestNodeId": "optimal_node_id",
          "reasoning": "why this connection makes sense"
        }
      ],
      "newCategoryStructure": {
        "programming": ["web-dev", "mobile", "ai"],
        "health": ["fitness", "nutrition", "mental"],
        "learning": ["books", "courses", "research"]
      },
      "reasoning": "Overall optimization strategy explanation"
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
        { role: 'system', content: 'You are an expert at organizing and optimizing productivity systems. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  let content = data.choices[0].message.content;
  if (content.startsWith('```json')) {
    content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  }
  const optimization = JSON.parse(content);

  // Apply the optimizations
  let updatesApplied = 0;
  
  // Update existing nodes
  for (const update of optimization.nodeUpdates || []) {
    await supabase
      .from('nodes')
      .update(update.updates)
      .eq('id', update.nodeId);
    updatesApplied++;
  }
  
  // Update task connections
  for (const connection of optimization.taskConnections || []) {
    await supabase
      .from('tasks')
      .update({ node_id: connection.bestNodeId })
      .eq('id', connection.taskId);
    updatesApplied++;
  }

  console.log(`[optimizeCategories] Applied ${updatesApplied} optimizations`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    optimization,
    updatesApplied
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Intelligent task scheduling and calendar optimization
async function autoScheduleTasks(supabase: any, payload: any) {
  const { date, preferences = {} } = payload;
  
  console.log(`[autoScheduleTasks] Optimizing schedule for ${date}`);
  
  // Get tasks and subtasks with their current status
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, subtasks(*)')
    .in('status', ['pending', 'in_progress']);
  
  // Get existing schedule for the day
  const { data: existingSlots } = await supabase
    .from('day_plan_slots')
    .select('*')
    .eq('date', date);

  const taskContext = tasks?.map(t => 
    `${t.title} (${t.estimated_time}min, priority: ${t.priority}, difficulty: ${t.difficulty}, energy: ${t.energy}, subtasks: ${t.subtasks?.length || 0})`
  ).join('; ') || 'No tasks';

  const slotContext = existingSlots?.map(s => 
    `${s.slot_start} - ${s.slot_end} (${s.locked ? 'locked' : 'flexible'})`
  ).join('; ') || 'No existing slots';

  const prompt = `
    Create an optimized daily schedule for ${date}:
    
    AVAILABLE TASKS: ${taskContext}
    EXISTING SCHEDULE: ${slotContext}
    
    USER PREFERENCES:
    - Work hours: ${preferences.workHours || '9:00-17:00'}
    - Energy peak: ${preferences.energyPeak || 'morning'}
    - Break frequency: ${preferences.breakFreq || '25min work, 5min break'}
    - Deep work blocks: ${preferences.deepWorkBlocks || '90-120 minutes'}
    
    SCHEDULING PRINCIPLES:
    1. Match task energy requirements with user's energy levels
    2. Group similar tasks for context switching efficiency
    3. Schedule high-priority tasks during peak energy times
    4. Break large tasks into manageable subtask blocks
    5. Leave buffer time between complex tasks
    6. Respect existing locked time slots
    
    Return JSON format:
    {
      "optimizedSlots": [
        {
          "startTime": "09:00",
          "endTime": "10:30", 
          "taskId": "task_id",
          "subtaskId": "subtask_id_or_null",
          "type": "work|break|buffer",
          "reasoning": "why scheduled at this time",
          "energyMatch": "high|medium|low"
        }
      ],
      "taskPrioritization": [
        {
          "taskId": "task_id",
          "newPriority": 1-5,
          "schedulingWeight": 1-10,
          "reasoning": "priority adjustment explanation"
        }
      ],
      "suggestedBreakdowns": [
        {
          "taskId": "large_task_id",
          "suggestedSubtasks": [
            {
              "title": "specific subtask",
              "estimatedMinutes": 25,
              "prerequisites": ["other_subtask"],
              "energyLevel": "low|medium|high"
            }
          ]
        }
      ],
      "efficiencyScore": 85,
      "reasoning": "Overall scheduling strategy and optimizations applied"
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
        { role: 'system', content: 'You are an expert productivity scheduler. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
    }),
  });

  const data = await response.json();
  let content = data.choices[0].message.content;
  if (content.startsWith('```json')) {
    content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  }
  const schedule = JSON.parse(content);

  // Apply suggested task breakdowns
  for (const breakdown of schedule.suggestedBreakdowns || []) {
    if (breakdown.suggestedSubtasks?.length > 0) {
      const subtaskInserts = breakdown.suggestedSubtasks.map((subtask: any, index: number) => ({
        task_id: breakdown.taskId,
        title: subtask.title,
        est_minutes: subtask.estimatedMinutes,
        seq: index + 1,
        tags: [`energy-${subtask.energyLevel}`],
        status: 'todo'
      }));

      await supabase
        .from('subtasks')
        .insert(subtaskInserts);
    }
  }

  // Update task priorities
  for (const prioritization of schedule.taskPrioritization || []) {
    await supabase
      .from('tasks')
      .update({ priority: prioritization.newPriority })
      .eq('id', prioritization.taskId);
  }

  // Create optimized time slots
  const newSlots = schedule.optimizedSlots?.map((slot: any) => ({
    date,
    slot_start: `${date}T${slot.startTime}:00`,
    slot_end: `${date}T${slot.endTime}:00`,
    subtask_id: slot.subtaskId || null,
    locked: false
  })) || [];

  if (newSlots.length > 0) {
    // Clear existing non-locked slots
    await supabase
      .from('day_plan_slots')
      .delete()
      .eq('date', date)
      .eq('locked', false);

    // Insert new optimized slots
    await supabase
      .from('day_plan_slots')
      .insert(newSlots);
  }

  console.log(`[autoScheduleTasks] Created ${newSlots.length} optimized time slots`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    schedule,
    slotsCreated: newSlots.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Node rebalancing based on progress and task completion
async function rebalanceNodes(supabase: any, payload: any) {
  console.log('[rebalanceNodes] Starting node rebalancing');
  
  // Get nodes with their connected tasks and current progress
  const { data: nodes } = await supabase
    .from('nodes')
    .select(`
      *,
      tasks(id, status, estimated_time, actual_time, priority, difficulty)
    `);

  const nodeAnalysis = nodes?.map(node => {
    const tasks = node.tasks || [];
    const completedTasks = tasks.filter((t: any) => t.status === 'completed');
    const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
    
    return {
      ...node,
      taskCount: tasks.length,
      completedCount: completedTasks.length,
      pendingCount: pendingTasks.length,
      avgTaskDifficulty: tasks.length > 0 ? 
        tasks.reduce((sum: number, t: any) => sum + (t.difficulty === 'basic' ? 1 : t.difficulty === 'intermediate' ? 2 : 3), 0) / tasks.length : 0,
      totalEstimatedTime: tasks.reduce((sum: number, t: any) => sum + (t.estimated_time || 0), 0),
      totalCompletedTime: completedTasks.reduce((sum: number, t: any) => sum + (t.actual_time || t.estimated_time || 0), 0)
    };
  }) || [];

  const prompt = `
    Analyze and rebalance skill nodes based on usage patterns and progress:
    
    NODE ANALYSIS: ${JSON.stringify(nodeAnalysis, null, 2)}
    
    Provide intelligent rebalancing recommendations:
    1. Identify underutilized nodes (low task count, low progress)
    2. Find overloaded nodes (too many pending tasks)
    3. Suggest node merging or splitting
    4. Recommend progress updates based on completed work
    5. Optimize node positioning for better workflow
    
    Return JSON format:
    {
      "nodeRebalancing": [
        {
          "nodeId": "node_id",
          "action": "merge|split|archive|prioritize",
          "newProgress": 0-100,
          "newPosition": {"x": 100, "y": 200},
          "reasoning": "why this change is recommended"
        }
      ],
      "nodeMergers": [
        {
          "primaryNodeId": "main_node",
          "mergeNodeIds": ["node1", "node2"],
          "newTitle": "consolidated_title",
          "transferTasks": true
        }
      ],
      "nodeSplits": [
        {
          "originalNodeId": "overloaded_node",
          "newNodes": [
            {
              "title": "specific_area_1", 
              "domain": "same_domain",
              "taskIds": ["task1", "task2"]
            }
          ]
        }
      ],
      "progressUpdates": [
        {
          "nodeId": "node_id",
          "calculatedProgress": 75,
          "xpGained": 150,
          "reasoning": "based on completed tasks and time spent"
        }
      ],
      "efficiencyScore": 78,
      "overallRecommendation": "strategic summary of changes"
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
        { role: 'system', content: 'You are an expert at analyzing productivity patterns and optimizing skill development systems. Always respond with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  let content = data.choices[0].message.content;
  if (content.startsWith('```json')) {
    content = content.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  }
  const rebalancing = JSON.parse(content);

  let changesApplied = 0;

  // Apply node updates
  for (const update of rebalancing.nodeRebalancing || []) {
    const updateData: any = {};
    if (update.newProgress !== undefined) updateData.progress = update.newProgress;
    if (update.newPosition) {
      updateData.position_x = update.newPosition.x;
      updateData.position_y = update.newPosition.y;
    }
    
    if (Object.keys(updateData).length > 0) {
      await supabase
        .from('nodes')
        .update(updateData)
        .eq('id', update.nodeId);
      changesApplied++;
    }
  }

  // Apply progress updates and XP gains
  for (const progressUpdate of rebalancing.progressUpdates || []) {
    await supabase
      .from('nodes')
      .update({ progress: progressUpdate.calculatedProgress })
      .eq('id', progressUpdate.nodeId);

    // Add XP event
    if (progressUpdate.xpGained > 0) {
      await supabase
        .from('xp_events')
        .insert({
          amount: progressUpdate.xpGained,
          source: 'node_progress_update',
          meta: { 
            nodeId: progressUpdate.nodeId, 
            reasoning: progressUpdate.reasoning 
          }
        });
    }
    changesApplied++;
  }

  // Handle node mergers
  for (const merger of rebalancing.nodeMergers || []) {
    if (merger.transferTasks) {
      // Transfer tasks from merged nodes to primary node
      for (const mergeNodeId of merger.mergeNodeIds) {
        await supabase
          .from('tasks')
          .update({ node_id: merger.primaryNodeId })
          .eq('node_id', mergeNodeId);
      }
      
      // Archive merged nodes
      await supabase
        .from('nodes')
        .update({ status: 'archived' })
        .in('id', merger.mergeNodeIds);
    }
    
    // Update primary node title
    await supabase
      .from('nodes')
      .update({ title: merger.newTitle })
      .eq('id', merger.primaryNodeId);
    
    changesApplied++;
  }

  console.log(`[rebalanceNodes] Applied ${changesApplied} rebalancing changes`);
  
  return new Response(JSON.stringify({ 
    success: true, 
    rebalancing,
    changesApplied
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

    // Insert all nodes
    const { data: createdNodes, error } = await supabase
      .from('nodes')
      .insert(initialNodes)
      .select();

    if (error) {
      throw error;
    }

    console.log(`[seedMindmap] Created ${createdNodes?.length || 0} initial nodes`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      nodesCreated: createdNodes?.length || 0,
      message: 'Initial mindmap structure created'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[seedMindmap] Error:', error);
    throw error;
  }
}