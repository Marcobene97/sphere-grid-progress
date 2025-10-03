import { useState, useEffect } from 'react';
import { useDailyReview } from '@/hooks/useDailyReview';
import { useTasks } from '@/hooks/useTasks';
import { useXP } from '@/hooks/useXP';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { format } from 'date-fns';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewModal({ open, onOpenChange }: ReviewModalProps) {
  const { review, saveReview } = useDailyReview();
  const { tasks } = useTasks();
  const { xp } = useXP();

  const [wins, setWins] = useState('');
  const [blockers, setBlockers] = useState('');
  const [lessons, setLessons] = useState('');

  useEffect(() => {
    if (review) {
      setWins(review.wins || '');
      setBlockers(review.blockers || '');
      setLessons(review.lessons || '');
    }
  }, [review]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const completedToday = tasks.filter(
    (t) => t.completed_at && format(new Date(t.completed_at), 'yyyy-MM-dd') === today
  );
  const plannedToday = tasks.filter(
    (t) => t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === today
  );

  const handleSave = () => {
    const markdown = generateMarkdown();
    saveReview({
      wins,
      blockers,
      lessons,
      xp_earned: xp,
      tasks_completed: completedToday.length,
      tasks_planned: plannedToday.length,
      markdown_export: markdown,
    });
    onOpenChange(false);
  };

  const generateMarkdown = () => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    let md = `# Daily Note - ${dateStr}\n\n`;
    md += `**XP Today:** ${xp}\n`;
    md += `**Tasks Completed:** ${completedToday.length} / ${plannedToday.length}\n\n`;
    
    md += `## ✅ Done\n`;
    completedToday.forEach((t) => {
      md += `- ${t.title}\n`;
    });
    md += `\n`;

    md += `## 🎯 Planned\n`;
    plannedToday.forEach((t) => {
      md += `- ${t.title}${t.status === 'completed' ? ' ✅' : ''}\n`;
    });
    md += `\n`;

    if (wins) {
      md += `## 🏆 Wins\n${wins}\n\n`;
    }
    if (blockers) {
      md += `## 🚧 Blockers\n${blockers}\n\n`;
    }
    if (lessons) {
      md += `## 💡 Lessons\n${lessons}\n\n`;
    }

    return md;
  };

  const handleExport = () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daily-${format(new Date(), 'yyyy-MM-dd')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Daily Review</DialogTitle>
          <DialogDescription>Reflect on your day and export to Markdown</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold">{xp}</div>
              <div className="text-xs text-muted-foreground">Total XP</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{completedToday.length}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{plannedToday.length}</div>
              <div className="text-xs text-muted-foreground">Planned</div>
            </div>
          </div>

          <div>
            <Label htmlFor="wins">🏆 Wins</Label>
            <Textarea
              id="wins"
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              rows={3}
              placeholder="What went well today?"
            />
          </div>

          <div>
            <Label htmlFor="blockers">🚧 Blockers</Label>
            <Textarea
              id="blockers"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              rows={3}
              placeholder="What got in the way?"
            />
          </div>

          <div>
            <Label htmlFor="lessons">💡 Lessons</Label>
            <Textarea
              id="lessons"
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              rows={3}
              placeholder="What did you learn?"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              Save Review
            </Button>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export MD
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
