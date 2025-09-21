import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Shuffle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MindmapSeederProps {
  onSeeded: () => void;
}

export const MindmapSeeder = ({ onSeeded }: MindmapSeederProps) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const seedMindmap = async () => {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('action-counsellor', {
        body: { 
          action: 'seed_mindmap'
        }
      });

      if (error) throw error;

      toast({
        title: "Mindmap Seeded!",
        description: `Created ${data.nodesCreated} nodes from your mind-map structure.`,
      });
      
      onSeeded();
    } catch (error) {
      console.error('Failed to seed mindmap:', error);
      toast({
        title: "Seeding Failed",
        description: "Failed to seed mindmap. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Seed Your Mindmap
        </CardTitle>
        <CardDescription>
          Import your comprehensive mind-map structure with all domains and goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-2">Your mind-map includes:</p>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">Programming</Badge>
                <Badge variant="outline">Reading</Badge>
                <Badge variant="outline">Health</Badge>
                <Badge variant="outline">Admin</Badge>
                <Badge variant="outline">Business</Badge>
                <Badge variant="outline">Music</Badge>
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={seedMindmap}
          disabled={isSeeding}
          className="w-full"
          size="lg"
        >
          {isSeeding ? (
            <>
              <Shuffle className="w-4 h-4 mr-2 animate-spin" />
              Seeding Mindmap...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Seed Mindmap Structure
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};