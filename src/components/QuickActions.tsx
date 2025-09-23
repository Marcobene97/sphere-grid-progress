import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Calendar, Zap, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsProps {
  onTasksGenerated: (tasks: any[], nodes: any[]) => void;
  onDayPlanGenerated: () => void;
  onMindmapSeeded: () => void;
}

export function QuickActions({ onTasksGenerated, onDayPlanGenerated, onMindmapSeeded }: QuickActionsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSeedingMindmap, setIsSeedingMindmap] = useState(false);
  const { toast } = useToast();

  const handleSeedMindmap = async () => {
    setIsSeedingMindmap(true);
    try {
      const result = await aiService.seedMindmap();
      
      onMindmapSeeded();
      
      toast({
        title: "Mindmap Seeded!",
        description: result.message || `Created ${result.nodesCreated} initial skill nodes`,
      });
    } catch (error) {
      console.error('Error seeding mindmap:', error);
      toast({
        title: "Error",
        description: "Failed to seed mindmap",
        variant: "destructive",
      });
    } finally {
      setIsSeedingMindmap(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/markdown' && !file.name.endsWith('.md')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a Markdown (.md) file",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const content = await file.text();
      const parsed = parseMarkdownToNodes(content);
      
      if (parsed.nodes.length === 0) {
        toast({
          title: "No Content Found",
          description: "No valid headings found in the markdown file",
          variant: "destructive",
        });
        return;
      }

      // Convert parsed nodes to task format
      const tasks = parsed.nodes.map(node => ({
        title: node.title,
        description: node.description || '',
        category: inferCategoryFromTitle(node.title),
        difficulty: 'basic',
        priority: 3,
        estimatedTime: 30,
        context: 'desk',
        energy: 'medium',
        valueScore: 3
      }));

      const nodes = parsed.nodes.map(node => ({
        title: node.title,
        domain: inferDomainFromTitle(node.title),
        description: node.description || '',
        goalType: 'project'
      }));

      onTasksGenerated(tasks, nodes);
      
      toast({
        title: "Mindmap Imported!",
        description: `Created ${tasks.length} tasks from markdown headings`,
      });
      
    } catch (error) {
      console.error('Error importing markdown:', error);
      toast({
        title: "Import Failed",
        description: "Failed to process the markdown file",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleGenerateDayPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await aiService.generateDayPlan(today);
      
      onDayPlanGenerated();
      
      toast({
        title: "Day Plan Generated!",
        description: `Created ${result.slotsCreated} scheduled time slots`,
      });
    } catch (error) {
      console.error('Error generating day plan:', error);
      toast({
        title: "Error",
        description: "Failed to generate day plan",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="markdown-upload">
            <Button 
              variant="outline" 
              className="w-full justify-start cursor-pointer" 
              asChild
              disabled={isImporting}
            >
              <span>
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isImporting ? 'Importing...' : 'Import Mindmap (.md)'}
              </span>
            </Button>
          </label>
          <Input
            id="markdown-upload"
            type="file"
            accept=".md,.markdown"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={handleGenerateDayPlan}
          disabled={isGeneratingPlan}
        >
          {isGeneratingPlan ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4 mr-2" />
          )}
          {isGeneratingPlan ? 'Generating...' : "Generate Today's Plan"}
        </Button>

        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={handleSeedMindmap}
          disabled={isSeedingMindmap}
        >
          {isSeedingMindmap ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          {isSeedingMindmap ? 'Creating...' : "Create Initial Mindmap"}
        </Button>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">Supported formats:</div>
          <div className="flex gap-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Markdown
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to parse markdown content into nodes
function parseMarkdownToNodes(content: string) {
  const lines = content.split('\n');
  const nodes: Array<{ title: string; description?: string; level: number }> = [];
  
  let currentDescription = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for markdown headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      
      // Add the previous description if we have one
      if (currentDescription && nodes.length > 0) {
        nodes[nodes.length - 1].description = currentDescription.trim();
      }
      
      nodes.push({
        title,
        level
      });
      
      currentDescription = '';
    } else if (line && !line.startsWith('#')) {
      // Collect description text
      currentDescription += line + ' ';
    }
  }
  
  // Add description to the last node if we have one
  if (currentDescription && nodes.length > 0) {
    nodes[nodes.length - 1].description = currentDescription.trim();
  }
  
  return { nodes };
}

// Helper functions to infer category and domain from titles
function inferCategoryFromTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('code') || lower.includes('program') || lower.includes('dev')) return 'programming';
  if (lower.includes('health') || lower.includes('exercise') || lower.includes('fitness')) return 'health';
  if (lower.includes('money') || lower.includes('finance') || lower.includes('budget')) return 'finance';
  if (lower.includes('learn') || lower.includes('study') || lower.includes('course')) return 'learning';
  return 'general';
}

function inferDomainFromTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('code') || lower.includes('program') || lower.includes('dev') || lower.includes('tech')) return 'programming';
  if (lower.includes('health') || lower.includes('fitness') || lower.includes('workout')) return 'health';
  if (lower.includes('money') || lower.includes('finance') || lower.includes('invest')) return 'finance';
  if (lower.includes('learn') || lower.includes('study') || lower.includes('skill')) return 'learning';
  return 'general';
}