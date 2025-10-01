import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Workflow, Sparkles, ArrowRight, Loader2, CheckCircle2, Zap, Clock, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkflowProcessorProps {
  onWorkflowProcessed: () => void;
}

export function WorkflowProcessor({ onWorkflowProcessed }: WorkflowProcessorProps) {
  const [markdown, setMarkdown] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleProcess = async () => {
    if (!markdown.trim()) {
      toast({
        title: "Empty Input",
        description: "Please enter your workflow markdown",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      console.log('[WorkflowProcessor] Processing markdown workflow...');
      
      const { data, error } = await supabase.functions.invoke('workflow-processor', {
        body: { markdown: markdown.trim() }
      });

      if (error) {
        throw error;
      }

      console.log('[WorkflowProcessor] Result:', data);
      
      if (!data.success) {
        throw new Error('Workflow processing failed');
      }

      setResult(data);
      
      toast({
        title: "Workflow Processed! 🎉",
        description: `Created ${data.stats.tasksCreated} tasks, ${data.stats.subtasksCreated} subtasks, and ${data.stats.nodesCreated} nodes`,
      });
      
      onWorkflowProcessed();
    } catch (error) {
      console.error('[WorkflowProcessor] Error:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process your workflow. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleMarkdown = `# Active Workflows

## Programming
- Trading System of Agents
  - Complete registration form
- Freecodecamp - Responsive Web Design
- n8n
- Heilbronn - C
  - Read Textbook
- Excel Course
  - Complete 1st run making notes

## Self-hygiene
- Hair
- Teeth
- Gym

## Driving License
- Practice questions till exam

## DJ
- Ableton`;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          <CardTitle>Workflow Processor</CardTitle>
        </div>
        <CardDescription>
          Paste your markdown workflow. AI will intelligently parse, estimate times, calculate XP, and create tasks with subtasks using reasoning and your historical data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder={exampleMarkdown}
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          rows={16}
          className="resize-none font-mono text-sm"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{markdown.length} characters</span>
            <span>•</span>
            <span>{markdown.split('\n').filter(l => l.trim().startsWith('-')).length} tasks detected</span>
          </div>
          <Button 
            onClick={handleProcess} 
            disabled={isProcessing || !markdown.trim()}
            className="gap-2"
            size="lg"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isProcessing ? 'Processing with AI...' : 'Process Workflow'}
            {!isProcessing && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>

        {isProcessing && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI is analyzing your workflow...
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Parsing hierarchical structure</p>
              <p>• Analyzing historical completion patterns</p>
              <p>• Estimating realistic completion times</p>
              <p>• Calculating XP rewards</p>
              <p>• Generating actionable subtasks</p>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {result && (
          <div className="space-y-4 p-4 bg-accent rounded-lg border-2 border-primary">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Workflow Processed Successfully!</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">{result.stats.tasksCreated}</div>
                <div className="text-xs text-muted-foreground">Tasks Created</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-primary">{result.stats.subtasksCreated}</div>
                <div className="text-xs text-muted-foreground">Subtasks Generated</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <div className="text-2xl font-bold">{result.stats.totalEstimatedTime}</div>
                </div>
                <div className="text-xs text-muted-foreground">Total Minutes</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <div className="text-2xl font-bold">{result.stats.totalExpectedXP}</div>
                </div>
                <div className="text-xs text-muted-foreground">Expected XP</div>
              </div>
            </div>

            {result.workflow?.domains && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Domains Covered:</div>
                <div className="flex flex-wrap gap-2">
                  {result.workflow.domains.map((domain: string) => (
                    <Badge key={domain} variant="secondary">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.reasoning && (
              <div className="space-y-2 text-sm">
                <div className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  AI Analysis:
                </div>
                <div className="text-muted-foreground italic">
                  {result.reasoning}
                </div>
              </div>
            )}

            <Button 
              onClick={() => {
                setMarkdown('');
                setResult(null);
              }}
              variant="outline"
              className="w-full"
            >
              Process Another Workflow
            </Button>
          </div>
        )}

        <div className="space-y-2 text-sm">
          <div className="font-medium">Features:</div>
          <ul className="space-y-1 text-muted-foreground">
            <li>✓ Intelligent parsing of hierarchical markdown</li>
            <li>✓ Historical data analysis for realistic time estimates</li>
            <li>✓ XP calculation based on difficulty and priority</li>
            <li>✓ Automatic subtask generation with dependencies</li>
            <li>✓ Node/domain creation for skill tracking</li>
            <li>✓ Reasoning model for advanced analysis (o3)</li>
          </ul>
        </div>

        <div className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setMarkdown(exampleMarkdown)}
            className="w-full"
          >
            Load Example Workflow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
