import { BookOpen, Lightbulb, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function KnowledgeSynthesizer() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const synthesize = async () => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      toast({
        title: '📝 Notes Synthesized!',
        description: 'Your reading has been converted into structured notes',
      });
      setInput('');
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <Card className="border-purple-200 dark:border-purple-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-purple-500" />
          <CardTitle>Knowledge Synthesizer</CardTitle>
        </div>
        <CardDescription>
          Transforms articles and notes into structured, actionable insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Paste an article, notes, or ideas to synthesize..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          className="resize-none"
        />
        
        <div className="flex gap-2">
          <Button 
            onClick={synthesize} 
            disabled={!input.trim() || isProcessing}
            className="flex-1"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Synthesize'}
          </Button>
          <Button variant="outline" size="icon">
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
