import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get pending tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .limit(10);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    console.log("[AI Daily Plan] Generating for", tasks?.length || 0, "tasks");

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
            content: `You are an AI productivity scheduler. Create a specific time-blocked daily schedule.

REQUIREMENTS:
- Start day at 9:00 AM, end at 6:00 PM (adjust if tasks require more time)
- Each task gets a specific time slot (e.g., "9:00 AM - 10:30 AM")
- Include 15-min breaks between tasks
- Group similar tasks together
- Put high-focus work in morning (9 AM - 12 PM)
- Schedule lighter tasks in afternoon (2 PM - 6 PM)
- Add 1-hour lunch break (12:00 PM - 1:00 PM)

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

🌅 Morning Block (9:00 AM - 12:00 PM)
• 9:00 AM - 10:30 AM: [Task Name] (90 min)
• 10:45 AM - 12:00 PM: [Task Name] (75 min)

🍽️ Lunch Break (12:00 PM - 1:00 PM)

☀️ Afternoon Block (1:00 PM - 6:00 PM)
• 1:00 PM - 2:30 PM: [Task Name] (90 min)
• 2:45 PM - 4:00 PM: [Task Name] (75 min)
• 4:15 PM - 5:30 PM: [Task Name] (75 min)

💡 Tips:
- [Energy management tip]
- [Focus strategy]

Be specific with times. Make it realistic and actionable.`,
          },
          {
            role: "user",
            content: `Create a daily schedule for these tasks:\n${JSON.stringify(tasks?.map(t => ({ title: t.title, priority: t.priority, estimated_time: t.estimated_time || 30 })), null, 2)}`,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your Lovable workspace." }), {
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
    console.error("[AI Daily Plan] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
