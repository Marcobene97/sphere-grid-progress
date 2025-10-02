import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Zap, Clock } from 'lucide-react';

interface AITaskBreakdownProps {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  onBreakdownComplete: () => void;
}

export const AITaskBreakdown: React.FC<AITaskBreakdownProps> = ({
  taskId,
  taskTitle,
  taskDescription,
  onBreakdownComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const { toast } = useToast();

  const breakdownTask = async () => {
    setLoading(true);
    setStreamingText('');
    setSubtasks([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `https://bujbbvcexwscnhgrcezn.supabase.co/functions/v1/ai-task-breakdown`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            taskTitle,
            taskDescription
          })
        }
      );

      if (!response.ok) throw new Error('Failed to get AI breakdown');

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
                setStreamingText(fullText);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      // Extract JSON array from the response
      const jsonMatch = fullText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedSubtasks = JSON.parse(jsonMatch[0]);
        setSubtasks(parsedSubtasks);

        // Save subtasks to database
        const subtaskInserts = parsedSubtasks.map((st: any, index: number) => ({
          task_id: taskId,
          title: st.title,
          est_minutes: st.estimatedMinutes || 25,
          seq: index,
          status: 'todo'
        }));

        const { error } = await supabase.from('subtasks').insert(subtaskInserts);
        if (error) throw error;

        toast({
          title: "Task Broken Down! 🎯",
          description: `Created ${parsedSubtasks.length} actionable subtasks`,
        });

        onBreakdownComplete();
      }
    } catch (error) {
      console.error('Error breaking down task:', error);
      toast({
        title: "Error",
        description: "Failed to break down task. Please try again.",
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
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Task Breakdown
        </CardTitle>
        <CardDescription>
          Let AI break this task into smaller, actionable steps
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={breakdownTask}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              AI is thinking...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Break Down with AI
            </>
          )}
        </Button>

        {/* Streaming Display */}
        {streamingText && !subtasks.length && (
          <div className="p-4 bg-muted/50 rounded-lg animate-pulse">
            <p className="text-sm">{streamingText}</p>
          </div>
        )}

        {/* Subtasks Preview */}
        {subtasks.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Generated Subtasks:</p>
            {subtasks.map((subtask, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-card border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{subtask.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {subtask.estimatedMinutes}m
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {subtask.xpReward} XP
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
