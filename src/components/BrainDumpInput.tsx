import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

interface BrainDumpInputProps {
  onTasksGenerated: (tasks: any[], nodes: any[]) => void;
}

export function BrainDumpInput({ onTasksGenerated }: BrainDumpInputProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleProcess = async () => {
    if (!input.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter some tasks or goals to process",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      console.log('[BrainDump] Processing:', input);
      
      const result = await aiService.processBrainDump(input.trim());
      
      console.log('[BrainDump] Result:', result);
      
      if (result.tasks.length === 0 && result.nodes.length === 0) {
        toast({
          title: "No Tasks Found",
          description: "Try entering more specific tasks or goals",
          variant: "destructive",
        });
        return;
      }

      onTasksGenerated(result.tasks, result.nodes);
      
      toast({
        title: "Brain Dump Processed!",
        description: `Generated ${result.tasks.length} tasks and ${result.nodes.length} skill nodes`,
      });
      
      setInput('');
    } catch (error) {
      console.error('[BrainDump] Error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to process your brain dump. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const examplePrompts = [
    "Learn React hooks, practice guitar daily, organize finances",
    "Build a personal website, read 2 books this month, start exercising",
    "Master TypeScript, improve cooking skills, plan vacation"
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle>Brain Dump</CardTitle>
        </div>
        <CardDescription>
          Dump all your tasks, goals, and ideas. Our AI will organize them into actionable tasks and skill nodes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter your tasks, goals, and ideas here... (e.g., 'Learn React, exercise daily, organize finances, build a portfolio website')"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          className="resize-none"
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {input.length} characters
          </div>
          <Button 
            onClick={handleProcess} 
            disabled={isProcessing || !input.trim()}
            className="gap-2"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isProcessing ? 'Processing...' : 'Process with AI'}
            {!isProcessing && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Try these examples:</div>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((prompt, index) => (
              <Badge 
                key={index}
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => setInput(prompt)}
              >
                {prompt}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}