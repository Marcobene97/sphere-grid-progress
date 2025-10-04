#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net --allow-env

/**
 * AI Evaluation Harness
 * Runs offline tests against AI modules using fixtures
 */

const RUN_LIVE = Deno.env.get('RUN_LIVE') === 'true';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface TestCase {
  id: string;
  description: string;
  input: any;
  [key: string]: any;
}

interface EvalResult {
  caseId: string;
  score: number;
  passed: boolean;
  duration: number;
  error?: string;
}

interface ModuleResult {
  module: string;
  totalCases: number;
  avgScore: number;
  passedCases: number;
  failedCases: number;
  duration: string;
  results: EvalResult[];
}

const MODULES = ['task-breakdown', 'daily-planner', 'inbox-atomizer'];

const THRESHOLDS = {
  'task-breakdown': 0.70,
  'daily-planner': 0.65,
  'inbox-atomizer': 0.60,
};

async function loadFixtures(module: string) {
  const casesPath = `./fixtures/${module}/cases.json`;
  const goldenPath = `./fixtures/${module}/golden.json`;
  
  const cases: TestCase[] = JSON.parse(await Deno.readTextFile(casesPath));
  let golden: any = {};
  
  try {
    golden = JSON.parse(await Deno.readTextFile(goldenPath));
  } catch {
    console.log(`⚠️  No golden file for ${module}, will use mock mode only`);
  }
  
  return { cases, golden };
}

async function runCase(module: string, testCase: TestCase, golden: any): Promise<EvalResult> {
  const start = Date.now();
  
  try {
    let output: any;
    
    if (RUN_LIVE && OPENAI_API_KEY) {
      // Call actual edge function
      output = await callLiveAPI(module, testCase.input);
    } else {
      // Use golden output
      output = golden[testCase.id];
      if (!output) {
        throw new Error(`No golden output for case ${testCase.id}`);
      }
    }
    
    // Score the output
    const score = await scoreOutput(module, output, golden[testCase.id], testCase.input);
    const threshold = THRESHOLDS[module as keyof typeof THRESHOLDS];
    
    return {
      caseId: testCase.id,
      score,
      passed: score >= threshold,
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      caseId: testCase.id,
      score: 0,
      passed: false,
      duration: Date.now() - start,
      error: error.message,
    };
  }
}

async function callLiveAPI(module: string, input: any): Promise<any> {
  // Placeholder - would call actual Supabase edge functions
  console.log(`🔴 Live API calls not yet implemented for ${module}`);
  throw new Error('Live mode not implemented');
}

async function scoreOutput(module: string, actual: any, golden: any, input: any): Promise<number> {
  // Import module-specific scorer
  switch (module) {
    case 'task-breakdown':
      return scoreTaskBreakdown(actual, golden, input);
    case 'daily-planner':
      return scoreDailyPlanner(actual, golden, input);
    case 'inbox-atomizer':
      return scoreInboxAtomizer(actual, golden, input);
    default:
      return 0;
  }
}

function scoreTaskBreakdown(actual: any, golden: any, input: any): number {
  if (!actual?.subtasks || !golden?.subtasks) return 0;
  
  let score = 0;
  
  // Count match (0.3)
  const countDiff = Math.abs(actual.subtasks.length - golden.subtasks.length);
  score += Math.max(0, 0.3 - (countDiff * 0.05));
  
  // Time estimation accuracy (0.4)
  const actualTime = actual.subtasks.reduce((sum: number, s: any) => sum + s.estimatedMinutes, 0);
  const goldenTime = golden.subtasks.reduce((sum: number, s: any) => sum + s.estimatedMinutes, 0);
  const timeDiff = Math.abs(actualTime - goldenTime) / Math.max(goldenTime, 1);
  score += Math.max(0, 0.4 * (1 - timeDiff));
  
  // XP consistency (0.3)
  const actualXP = actual.subtasks.reduce((sum: number, s: any) => sum + s.xpReward, 0);
  const goldenXP = golden.subtasks.reduce((sum: number, s: any) => sum + s.xpReward, 0);
  const xpDiff = Math.abs(actualXP - goldenXP) / Math.max(goldenXP, 1);
  score += Math.max(0, 0.3 * (1 - xpDiff));
  
  return Math.max(0, Math.min(1, score));
}

function scoreDailyPlanner(actual: any, golden: any, input: any): number {
  if (!actual?.slots || !golden?.slots) return 0;
  
  let score = 0;
  
  // No time overlaps (0.4)
  const hasOverlaps = checkTimeOverlaps(actual.slots);
  score += hasOverlaps ? 0 : 0.4;
  
  // High-energy tasks in morning (0.3)
  const morningScore = scoreEnergyDistribution(actual.slots, input.tasks);
  score += morningScore * 0.3;
  
  // Slot count reasonable (0.3)
  const slotCountScore = 1 - Math.abs(actual.slots.length - golden.slots.length) / Math.max(golden.slots.length, 1);
  score += Math.max(0, slotCountScore * 0.3);
  
  return Math.max(0, Math.min(1, score));
}

function scoreInboxAtomizer(actual: any, golden: any, input: any): number {
  if (!actual?.tasks || !golden?.tasks) return 0;
  
  let score = 0;
  
  // Task count accuracy (0.3)
  const countDiff = Math.abs(actual.tasks.length - golden.tasks.length);
  score += Math.max(0, 0.3 - (countDiff * 0.1));
  
  // Confidence distribution (0.4)
  const highConfidence = actual.tasks.filter((t: any) => t.confidence === 'high').length;
  const confidenceRatio = highConfidence / Math.max(actual.tasks.length, 1);
  score += confidenceRatio * 0.4;
  
  // Effort estimation (0.3)
  const effortScore = actual.tasks.every((t: any) => ['S', 'M', 'L'].includes(t.effort)) ? 0.3 : 0;
  score += effortScore;
  
  return Math.max(0, Math.min(1, score));
}

function checkTimeOverlaps(slots: any[]): boolean {
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
      if (a.startTime < b.endTime && b.startTime < a.endTime) {
        return true; // Overlap detected
      }
    }
  }
  return false;
}

function scoreEnergyDistribution(slots: any[], tasks: any[]): number {
  const morningSlots = slots.filter((s: any) => {
    const hour = parseInt(s.startTime.split(':')[0]);
    return hour >= 9 && hour < 12;
  });
  
  // Check if morning slots contain high-energy tasks
  let highEnergyInMorning = 0;
  for (const slot of morningSlots) {
    const task = tasks.find((t: any) => t.title === slot.taskTitle);
    if (task?.energy === 'high') highEnergyInMorning++;
  }
  
  return highEnergyInMorning / Math.max(morningSlots.length, 1);
}

async function evaluateModule(moduleName: string): Promise<ModuleResult> {
  console.log(`\n📊 Evaluating ${moduleName}...`);
  
  const { cases, golden } = await loadFixtures(moduleName);
  const start = Date.now();
  const results: EvalResult[] = [];
  
  for (const testCase of cases) {
    console.log(`  ⏳ Running case: ${testCase.id}`);
    const result = await runCase(moduleName, testCase, golden);
    results.push(result);
    
    const icon = result.passed ? '✅' : '❌';
    console.log(`  ${icon} ${testCase.id}: ${(result.score * 100).toFixed(1)}% (${result.duration}ms)`);
    if (result.error) console.log(`     Error: ${result.error}`);
  }
  
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const passedCases = results.filter(r => r.passed).length;
  
  return {
    module: moduleName,
    totalCases: cases.length,
    avgScore,
    passedCases,
    failedCases: cases.length - passedCases,
    duration: `${((Date.now() - start) / 1000).toFixed(1)}s`,
    results,
  };
}

async function main() {
  console.log('🚀 AI Evaluation Harness\n');
  console.log(`Mode: ${RUN_LIVE ? '🔴 LIVE' : '⚫ MOCK'}`);
  console.log(`Modules: ${MODULES.join(', ')}\n`);
  
  const moduleResults: ModuleResult[] = [];
  
  for (const module of MODULES) {
    try {
      const result = await evaluateModule(module);
      moduleResults.push(result);
    } catch (error) {
      console.error(`❌ Failed to evaluate ${module}: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 EVALUATION SUMMARY\n');
  
  let allPassed = true;
  for (const result of moduleResults) {
    const threshold = THRESHOLDS[result.module as keyof typeof THRESHOLDS];
    const passed = result.avgScore >= threshold;
    allPassed = allPassed && passed;
    
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${result.module}`);
    console.log(`   Score: ${(result.avgScore * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(0)}%)`);
    console.log(`   Passed: ${result.passedCases}/${result.totalCases} cases`);
    console.log(`   Duration: ${result.duration}\n`);
  }
  
  console.log('='.repeat(60));
  
  if (!allPassed) {
    console.log('❌ Some modules failed quality thresholds');
    Deno.exit(1);
  } else {
    console.log('✅ All modules passed');
    Deno.exit(0);
  }
}

if (import.meta.main) {
  main();
}
