import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Database, Shuffle, AlertCircle, Upload, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MindmapSeederProps {
  onSeeded: () => void;
}

export const MindmapSeeder = ({ onSeeded }: MindmapSeederProps) => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'text/markdown' || file.name.endsWith('.md'))) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a markdown (.md) file.",
        variant: "destructive",
      });
    }
  };

  const seedMindmap = async () => {
    setIsSeeding(true);
    try {
      let markdownContent = '';
      
      if (selectedFile) {
        markdownContent = await selectedFile.text();
      }

      const { data, error } = await supabase.functions.invoke('action-counsellor', {
        body: { 
          action: 'seed_mindmap',
          markdownContent
        }
      });

      if (error) throw error;

      toast({
        title: "Mindmap Imported!",
        description: `Created ${data.nodesCreated} nodes from your ${selectedFile ? 'markdown file' : 'default structure'}.`,
      });
      
      onSeeded();
    } catch (error) {
      console.error('Failed to seed mindmap:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import mindmap. Please try again.",
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
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="markdown-file">Upload Markdown File (Optional)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="markdown-file"
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown"
              onChange={handleFileSelect}
              className="flex-1"
            />
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                {selectedFile.name}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Upload your own markdown mindmap structure, or use the default template below.
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-2">Default template includes:</p>
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
              {selectedFile ? 'Importing File...' : 'Seeding Template...'}
            </>
          ) : (
            <>
              {selectedFile ? <Upload className="w-4 h-4 mr-2" /> : <Database className="w-4 h-4 mr-2" />}
              {selectedFile ? 'Import Markdown' : 'Use Default Template'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};