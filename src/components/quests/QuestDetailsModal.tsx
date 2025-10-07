import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Zap, Calendar, Clock, Target, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface QuestDetailsModalProps {
  questId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuestDetails {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  xp_reward: number;
  difficulty: string;
  estimated_time: number;
  created_at: string;
  due_date?: string;
  tags?: string[];
  completed_at?: string;
}

export function QuestDetailsModal({ questId, open, onOpenChange }: QuestDetailsModalProps) {
  const [quest, setQuest] = useState<QuestDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (questId && open) {
      loadQuest();
    }
  }, [questId, open]);

  const loadQuest = async () => {
    if (!questId) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', questId)
      .single();
    
    if (data) setQuest(data);
    setLoading(false);
  };

  if (!quest && !loading) return null;

  const difficultyColors = {
    basic: 'bg-green-500/10 text-green-500 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl pr-6">{quest?.title || 'Loading...'}</DialogTitle>
          <DialogDescription>
            {quest?.created_at && `Created ${format(new Date(quest.created_at), 'PPP')}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading quest details...</div>
        ) : quest ? (
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500">
                <Zap className="h-3 w-3 mr-1" />
                {quest.xp_reward} XP
              </Badge>
              <Badge variant="outline" className={difficultyColors[quest.difficulty as keyof typeof difficultyColors]}>
                {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
              </Badge>
              <Badge variant="secondary">
                <Target className="h-3 w-3 mr-1" />
                Priority {quest.priority}
              </Badge>
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                ~{quest.estimated_time}min
              </Badge>
              {quest.status === 'completed' && quest.completed_at && (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                  ✓ Completed {format(new Date(quest.completed_at), 'PPP')}
                </Badge>
              )}
            </div>

            {/* Description */}
            {quest.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{quest.description}</p>
              </div>
            )}

            {/* Due Date */}
            {quest.due_date && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due Date
                </h3>
                <p className="text-muted-foreground">{format(new Date(quest.due_date), 'PPP')}</p>
              </div>
            )}

            {/* Tags */}
            {quest.tags && quest.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {quest.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium capitalize">{quest.status}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Quest ID:</span>
                  <p className="font-mono text-xs">{quest.id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
