import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AIDailyPlanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState('');
  const { toast } = useToast();

  const generatePlan = async () => {
    setLoading(true);
    setPlan('');

    try {
      const response = await fetch(
        `https://bujbbvcexwscnhgrcezn.supabase.co/functions/v1/ai-daily-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to generate plan');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setPlan(fullText);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      toast({
        title: "Daily Plan Generated! 📅",
        description: "Your optimal schedule is ready",
      });
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate daily plan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          AI Daily Planner
        </CardTitle>
        <CardDescription>
          Get an AI-optimized schedule for today's tasks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generatePlan}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating optimal plan...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Today's Plan
            </>
          )}
        </Button>

        {plan && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <p className="text-sm whitespace-pre-wrap">{plan}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
