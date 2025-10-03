import { useState } from 'react';
import { useInbox } from '@/hooks/useInbox';
import { useTasks } from '@/hooks/useTasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Trash2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function InboxView() {
  const { items, addItem, markProcessed, deleteItem } = useInbox();
  const { createTask } = useTasks();
  const { toast } = useToast();
  const [capture, setCapture] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const handleCapture = () => {
    if (!capture.trim()) return;
    addItem(capture);
    setCapture('');
  };

  const handleAtomize = async (itemId: string, content: string) => {
    setProcessing(itemId);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tasks', {
        body: { prompt: content, type: 'suggest' },
      });

      if (error) throw error;

      const suggestions = data?.suggestions || [];
      for (const task of suggestions) {
        createTask({
          title: task.title,
          description: task.description || null,
          priority: task.priority === 'high' ? 5 : task.priority === 'medium' ? 3 : 1,
          category: task.category || 'general',
          difficulty: 'basic',
          estimated_time: 30,
          xp_reward: 25,
        });
      }

      markProcessed(itemId);
      toast({ title: `Atomized into ${suggestions.length} tasks` });
    } catch (error: any) {
      toast({
        title: 'Failed to atomize',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Inbox</h1>
        <p className="text-muted-foreground">
          Capture ideas quickly. Use AI to atomize them into actionable tasks.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Capture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={capture}
              onChange={(e) => setCapture(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCapture()}
              placeholder="Brain dump here... (press Enter)"
              className="flex-1"
            />
            <Button onClick={handleCapture}>Capture</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Your inbox is empty. Start capturing ideas!
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="flex-1 text-sm">{item.content}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAtomize(item.id, item.content)}
                      disabled={processing === item.id}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      {processing === item.id ? 'Processing...' : 'Atomize'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markProcessed(item.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
