import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Loader2, Sparkles } from 'lucide-react';

export default function BrainDump() {
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const processBrainDump = async () => {
    if (!text.trim()) {
      toast({
        title: "Empty brain dump",
        description: "Please enter some text to process",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      // Step 1: Extract tasks from brain dump
      const { data: dumpData, error: dumpError } = await supabase.functions.invoke('ai-brain-dump', {
        body: { brainDump: text }
      });

      if (dumpError) throw dumpError;
      if (dumpData.error) throw new Error(dumpData.error);

      const taskCount = dumpData.count || 0;

      // Step 2: Calculate XP for all tasks
      const { data: xpData, error: xpError } = await supabase.functions.invoke('ai-xp-calculator');
      
      if (xpError) {
        console.error('XP calculation failed:', xpError);
        // Don't throw - tasks are still created, just with default XP
      }

      toast({
        title: `✨ ${taskCount} Quests Created!`,
        description: xpData?.count 
          ? `XP calculated for ${xpData.count} tasks`
          : 'Tasks created with default XP',
      });

      setText('');
    } catch (error: any) {
      console.error('[BrainDump] Error:', error);
      toast({
        title: "Processing Failed",
        description: error.message || 'Failed to process brain dump',
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Brain Dump
        </CardTitle>
        <CardDescription>
          Dump all your tasks and let AI organize them for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Type or paste all your tasks, ideas, and todos here... 
          
Example:
- Need to finish the project proposal
- Buy groceries for dinner
- Call mom about weekend plans
- Review code for PR #123
- Plan team meeting agenda"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          disabled={processing}
          className="resize-none"
        />
        <Button 
          onClick={processBrainDump} 
          disabled={processing || !text.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Process Brain Dump
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
