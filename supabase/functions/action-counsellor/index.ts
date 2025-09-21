import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

interface SubtaskBreakdown {
  title: string;
  estMinutes: number;
  context: string;
  energy: string;
  tags: string[];
  seq: number;
}

interface MixingConstraints {
  dayStart: string;
  dayEnd: string;
  sprintDuration: number;
  breakDuration: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { action, ...payload } = await req.json();
    console.log('Action Counsellor called:', { action, payload });

    switch (action) {
      case 'breakdown_task':
        return await breakdownTask(supabase, authHeader, payload);
      case 'build_day_plan':
        return await buildDayPlan(supabase, authHeader, payload);
      case 'seed_mindmap':
        return await seedMindmap(supabase, authHeader, payload);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Action Counsellor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function breakdownTask(supabase: any, authHeader: string, payload: any) {
  const { taskId, nodeId } = payload;
  
  // Get user ID from auth header
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) throw new Error('Unauthorized');

  // Fetch task details
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .single();

  if (!task) throw new Error('Task not found');

  // Generate subtasks using AI or heuristics
  const subtasks = await generateSubtasks(task);

  // Store subtasks in database
  const subtaskRecords = subtasks.map((subtask, index) => ({
    task_id: taskId,
    user_id: user.id,
    title: subtask.title,
    est_minutes: subtask.estMinutes,
    context: subtask.context,
    energy: subtask.energy,
    tags: subtask.tags,
    seq: index,
    status: 'todo'
  }));

  const { data: createdSubtasks, error } = await supabase
    .from('subtasks')
    .insert(subtaskRecords)
    .select();

  if (error) throw error;

  // Update task with estimated total minutes
  const totalMinutes = subtasks.reduce((sum, s) => sum + s.estMinutes, 0);
  await supabase
    .from('tasks')
    .update({ estimated_time: totalMinutes })
    .eq('id', taskId);

  return new Response(
    JSON.stringify({ subtasks: createdSubtasks, totalMinutes }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateSubtasks(task: any): Promise<SubtaskBreakdown[]> {
  // Rule-based breakdown for reliability
  const subtasks: SubtaskBreakdown[] = [];
  const title = task.title.toLowerCase();
  const estTime = task.estimated_time || 60;
  
  // Determine domain from task category and tags
  const domain = task.category || 'general';
  const tags = [domain];
  
  // Common patterns for different task types
  if (title.includes('read') || title.includes('study')) {
    const chunkSize = Math.min(45, Math.max(25, estTime / 3));
    const chunks = Math.ceil(estTime / chunkSize);
    
    for (let i = 0; i < chunks; i++) {
      subtasks.push({
        title: `${task.title} - Part ${i + 1}`,
        estMinutes: chunkSize,
        context: 'reading',
        energy: 'medium',
        tags: [...tags, 'deep', 'focus'],
        seq: i
      });
    }
    
    // Add notes/summary task
    subtasks.push({
      title: `Take notes on ${task.title}`,
      estMinutes: 15,
      context: 'desk',
      energy: 'low',
      tags: [...tags, 'shallow', 'notes'],
      seq: subtasks.length
    });
  } else if (title.includes('practice') || title.includes('exercise')) {
    const sessionSize = 25;
    const sessions = Math.ceil(estTime / sessionSize);
    
    for (let i = 0; i < sessions; i++) {
      subtasks.push({
        title: `${task.title} - Session ${i + 1}`,
        estMinutes: sessionSize,
        context: title.includes('gym') ? 'gym' : 'desk',
        energy: 'high',
        tags: [...tags, 'practice', 'skill'],
        seq: i
      });
    }
  } else if (title.includes('complete') || title.includes('finish')) {
    // Project completion - break into phases
    subtasks.push({
      title: `Plan approach for ${task.title}`,
      estMinutes: 15,
      context: 'desk',
      energy: 'medium',
      tags: [...tags, 'shallow', 'planning'],
      seq: 0
    });
    
    const workTime = estTime - 30; // Reserve time for planning and review
    const workChunks = Math.ceil(workTime / 45);
    
    for (let i = 0; i < workChunks; i++) {
      subtasks.push({
        title: `Work on ${task.title} - Phase ${i + 1}`,
        estMinutes: Math.min(45, workTime - (i * 45)),
        context: 'desk',
        energy: 'high',
        tags: [...tags, 'deep', 'implementation'],
        seq: i + 1
      });
    }
    
    subtasks.push({
      title: `Review and finalize ${task.title}`,
      estMinutes: 15,
      context: 'desk',
      energy: 'medium',
      tags: [...tags, 'shallow', 'review'],
      seq: subtasks.length
    });
  } else {
    // Generic breakdown
    const chunkSize = 45;
    const chunks = Math.ceil(estTime / chunkSize);
    
    for (let i = 0; i < chunks; i++) {
      subtasks.push({
        title: `${task.title} - Part ${i + 1}`,
        estMinutes: Math.min(chunkSize, estTime - (i * chunkSize)),
        context: 'desk',
        energy: 'medium',
        tags: [...tags, 'work'],
        seq: i
      });
    }
  }
  
  return subtasks.slice(0, 10); // Limit to max 10 subtasks
}

async function buildDayPlan(supabase: any, authHeader: string, payload: any) {
  const { date, constraints = {} } = payload;
  
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) throw new Error('Unauthorized');

  const mixingConstraints: MixingConstraints = {
    dayStart: constraints.dayStart || '06:00',
    dayEnd: constraints.dayEnd || '19:00',
    sprintDuration: constraints.sprintDuration || 45,
    breakDuration: constraints.breakDuration || 15,
    ...constraints
  };

  // Clear existing non-locked slots for the date
  await supabase
    .from('day_plan_slots')
    .delete()
    .eq('user_id', user.id)
    .eq('date', date)
    .eq('locked', false);

  // Get candidate subtasks
  const { data: subtasks } = await supabase
    .from('subtasks')
    .select(`
      *,
      tasks!inner(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'todo');

  // Get existing locked slots
  const { data: lockedSlots } = await supabase
    .from('day_plan_slots')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .eq('locked', true);

  // Generate time slots
  const slots = generateTimeSlots(date, mixingConstraints, lockedSlots || []);
  
  // Apply mixing algorithm
  const filledSlots = applyMixingAlgorithm(slots, subtasks || [], mixingConstraints);

  // Insert new slots
  const slotRecords = filledSlots
    .filter(slot => !slot.locked && slot.subtask_id) // Only insert new non-locked slots with subtasks
    .map(slot => ({
      user_id: user.id,
      date,
      slot_start: slot.slot_start,
      slot_end: slot.slot_end,
      subtask_id: slot.subtask_id,
      locked: false
    }));

  if (slotRecords.length > 0) {
    const { error } = await supabase
      .from('day_plan_slots')
      .insert(slotRecords);

    if (error) throw error;
  }

  return new Response(
    JSON.stringify({ 
      slotsCreated: slotRecords.length,
      totalSlots: filledSlots.length,
      date 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generateTimeSlots(date: string, constraints: MixingConstraints, lockedSlots: any[]) {
  const slots = [];
  const startTime = new Date(`${date}T${constraints.dayStart}:00`);
  const endTime = new Date(`${date}T${constraints.dayEnd}:00`);
  
  let currentTime = new Date(startTime);
  
  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + constraints.sprintDuration * 60000);
    
    // Check if this slot overlaps with any locked slot
    const isLocked = lockedSlots.some(locked => {
      const lockedStart = new Date(locked.slot_start);
      const lockedEnd = new Date(locked.slot_end);
      return (currentTime >= lockedStart && currentTime < lockedEnd) ||
             (slotEnd > lockedStart && slotEnd <= lockedEnd);
    });
    
    if (isLocked) {
      // Find the next available time after locked slots
      const nextAvailable = lockedSlots
        .filter(locked => new Date(locked.slot_end) > currentTime)
        .map(locked => new Date(locked.slot_end))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      
      if (nextAvailable) {
        currentTime = nextAvailable;
        continue;
      }
    }
    
    slots.push({
      slot_start: currentTime.toISOString(),
      slot_end: slotEnd.toISOString(),
      subtask_id: null,
      locked: false
    });
    
    // Add break time
    currentTime = new Date(slotEnd.getTime() + constraints.breakDuration * 60000);
  }
  
  return slots;
}

function applyMixingAlgorithm(slots: any[], subtasks: any[], constraints: MixingConstraints) {
  const usedDomains = new Set<string>();
  let lastDomain = '';
  
  for (const slot of slots) {
    if (slot.locked) continue;
    
    const slotDuration = (new Date(slot.slot_end).getTime() - new Date(slot.slot_start).getTime()) / 60000;
    
    // Score and filter subtasks
    const candidates = subtasks
      .filter(subtask => subtask.est_minutes <= slotDuration + 5) // 5 min buffer
      .map(subtask => ({
        ...subtask,
        score: calculateUrgencyValueScore(subtask, usedDomains, lastDomain)
      }))
      .sort((a, b) => b.score - a.score);
    
    if (candidates.length > 0) {
      const selected = candidates[0];
      slot.subtask_id = selected.id;
      
      // Update domain tracking
      const domain = selected.tasks?.category || 'general';
      usedDomains.add(domain);
      lastDomain = domain;
      
      // Remove selected subtask from future consideration
      const index = subtasks.findIndex(s => s.id === selected.id);
      if (index > -1) subtasks.splice(index, 1);
    }
  }
  
  return slots;
}

function calculateUrgencyValueScore(subtask: any, usedDomains: Set<string>, lastDomain: string): number {
  const task = subtask.tasks;
  const hoursToDeadline = task.due_date 
    ? (new Date(task.due_date).getTime() - Date.now()) / (1000 * 60 * 60)
    : 48; // Default 48 hours if no deadline
  
  const deadlineFactor = 1 / Math.max(1, hoursToDeadline);
  const wspt = (task.value_score || 3) / Math.max(1, subtask.est_minutes);
  const priorityFactor = 0.5 + 0.5 * ((task.priority || 3) / 5);
  
  let score = 0.45 * deadlineFactor + 0.35 * wspt + 0.15 * priorityFactor;
  
  // Diversity boosts
  const domain = task.category || 'general';
  const streakBoost = domain === lastDomain ? 1.15 : 1.0;
  const noveltyBoost = !usedDomains.has(domain) ? 1.10 : 1.0;
  
  score *= Math.max(streakBoost, noveltyBoost);
  
  return score;
}

async function seedMindmap(supabase: any, authHeader: string, payload: any) {
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) throw new Error('Unauthorized');

  // Clear existing nodes
  await supabase.from('nodes').delete().eq('user_id', user.id);

  const mindmapData = [
    { title: 'Active Workflows', domain: 'general', parentId: null, x: 0, y: 0 },
    { title: 'Programming', domain: 'Programming', parentId: 'Active Workflows', x: -300, y: 100 },
    { title: 'Trading System of Agents', domain: 'Programming', parentId: 'Programming', x: -500, y: 200 },
    { title: 'n8n', domain: 'Programming', parentId: 'Programming', x: -400, y: 200 },
    { title: 'Heilbronn - C', domain: 'Programming', parentId: 'Programming', x: -300, y: 200 },
    { title: 'Read Textbook', domain: 'Programming', parentId: 'Heilbronn - C', x: -300, y: 280 },
    { title: 'Freecodecamp - Responsive Web Design', domain: 'Programming', parentId: 'Programming', x: -200, y: 200 },
    { title: 'Complete registration form', domain: 'Programming', parentId: 'Freecodecamp - Responsive Web Design', x: -200, y: 280 },
    { title: 'Excel Course', domain: 'Admin', parentId: 'Active Workflows', x: -100, y: 100 },
    { title: 'Complete 1st run making notes', domain: 'Admin', parentId: 'Excel Course', x: -100, y: 180 },
    { title: 'Self-hygene', domain: 'Health', parentId: 'Active Workflows', x: 100, y: 100 },
    { title: 'Hair', domain: 'Health', parentId: 'Self-hygene', x: 50, y: 180 },
    { title: 'teeth', domain: 'Health', parentId: 'Self-hygene', x: 100, y: 180 },
    { title: 'Gym', domain: 'Health', parentId: 'Self-hygene', x: 150, y: 180 },
    { title: 'Complex Systems reading / Logic', domain: 'Reading', parentId: 'Active Workflows', x: 300, y: 100 },
    { title: 'Dune - Herbert', domain: 'Reading', parentId: 'Complex Systems reading / Logic', x: 200, y: 200 },
    { title: 'Introduction to the Theory of Complex Systems', domain: 'Reading', parentId: 'Complex Systems reading / Logic', x: 300, y: 200 },
    { title: 'The Logical Thinking Process: A Systems Approach to Complex Problem Solving', domain: 'Reading', parentId: 'Complex Systems reading / Logic', x: 400, y: 200 },
    { title: 'Read Assassin\'s Creed', domain: 'Reading', parentId: 'Complex Systems reading / Logic', x: 250, y: 280 },
    { title: 'Systems Design', domain: 'Reading', parentId: 'Complex Systems reading / Logic', x: 350, y: 280 },
    { title: 'Reading', domain: 'Reading', parentId: 'Active Workflows', x: 500, y: 100 },
    { title: 'Psychology', domain: 'Reading', parentId: 'Reading', x: 450, y: 180 },
    { title: 'History', domain: 'Reading', parentId: 'Reading', x: 500, y: 180 },
    { title: 'Epoche 2', domain: 'Reading', parentId: 'Reading', x: 550, y: 180 },
    { title: 'DJ', domain: 'Music', parentId: 'Active Workflows', x: -300, y: -100 },
    { title: 'Ableton', domain: 'Music', parentId: 'Active Workflows', x: -200, y: -100 },
    { title: 'Driving License', domain: 'Admin', parentId: 'Active Workflows', x: -100, y: -100 },
    { title: 'Practice questions till exam', domain: 'Admin', parentId: 'Driving License', x: -100, y: -180 },
    { title: 'Vendita Locali', domain: 'Business', parentId: 'Active Workflows', x: 0, y: -100 },
    { title: 'CRM for Sport Trainers', domain: 'Business', parentId: 'Active Workflows', x: 100, y: -100 },
    { title: 'Viatore', domain: 'Business', parentId: 'Active Workflows', x: 200, y: -100 },
    { title: 'Perizia indipendente - Garage', domain: 'Admin', parentId: 'Active Workflows', x: 300, y: -100 },
    { title: 'Florio - serranda + interessi', domain: 'Admin', parentId: 'Active Workflows', x: 400, y: -100 }
  ];

  // Create nodes in order (parents first)
  const nodeIdMap = new Map<string, string>();
  const createdNodes = [];
  
  for (const nodeData of mindmapData) {
    const parentId = nodeData.parentId ? nodeIdMap.get(nodeData.parentId) : null;
    
    const { data: createdNode } = await supabase
      .from('nodes')
      .insert({
        user_id: user.id,
        title: nodeData.title,
        domain: nodeData.domain,
        parent_id: parentId,
        position_x: nodeData.x,
        position_y: nodeData.y,
        status: parentId ? 'available' : 'in_progress',
        category: 'project',
        branch: 'programming', // Default branch
        type: 'basic',
        reward_xp: 50,
        description: `Working on ${nodeData.title}`,
        goal_type: 'project',
        unlocks: [], // Initialize empty unlocks array
        prerequisites: parentId ? [parentId] : []
      })
      .select()
      .single();

    if (createdNode) {
      nodeIdMap.set(nodeData.title, createdNode.id);
      createdNodes.push({ ...createdNode, originalTitle: nodeData.title, parentTitle: nodeData.parentId });
    }
  }

  // Now update nodes to set up unlocks relationships (parent unlocks children)
  for (const node of createdNodes) {
    if (node.parent_id) {
      // Find the parent node and add this node to its unlocks array
      const parentNode = createdNodes.find(n => n.id === node.parent_id);
      if (parentNode) {
        const { data: updatedParent } = await supabase
          .from('nodes')
          .select('unlocks')
          .eq('id', parentNode.id)
          .single();
          
        const currentUnlocks = updatedParent?.unlocks || [];
        if (!currentUnlocks.includes(node.id)) {
          await supabase
            .from('nodes')
            .update({
              unlocks: [...currentUnlocks, node.id]
            })
            .eq('id', parentNode.id);
        }
      }
    }
  }

  return new Response(
    JSON.stringify({ nodesCreated: nodeIdMap.size }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}