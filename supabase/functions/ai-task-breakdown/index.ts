import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskTitle, taskDescription } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    console.log("[AI Task Breakdown] Processing:", taskTitle);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert productivity coach. Break down tasks into small, actionable subtasks.

RULES:
- Create 3-8 subtasks (not too many, not too few)
- Each subtask should be specific and actionable
- Start subtasks with action verbs (Research, Draft, Review, etc.)
- Estimate realistic time for each (5-60 minutes)
- Award XP based on complexity and time

XP FORMULA:
- Quick tasks (5-15 min): 10-15 XP
- Standard tasks (15-30 min): 20-30 XP  
- Complex tasks (30-45 min): 40-50 XP
- Major tasks (45-60 min): 60-80 XP

Return ONLY a valid JSON array with this EXACT format:
[
  {"title": "Research project requirements", "estimatedMinutes": 20, "xpReward": 25},
  {"title": "Create outline", "estimatedMinutes": 15, "xpReward": 20}
]

No markdown, no extra text, ONLY the JSON array.`,
          },
          {
            role: "user",
            content: `Break down this task into subtasks:\n\nTitle: ${taskTitle}\n${taskDescription ? `Description: ${taskDescription}` : "No additional description provided."}`,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[AI Task Breakdown] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
