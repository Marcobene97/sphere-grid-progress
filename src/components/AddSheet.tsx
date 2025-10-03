import { useState } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useTasks } from '@/hooks/useTasks';
import { useNodes } from '@/hooks/useNodes';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AddSheet() {
  const { isAddSheetOpen, setIsAddSheetOpen, selectedNodeId } = useAppStore();
  const { createTask } = useTasks();
  const { nodes } = useNodes();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [nodeId, setNodeId] = useState(selectedNodeId || '');
  const [effort, setEffort] = useState<'S' | 'M' | 'L'>('M');
  const [dueDate, setDueDate] = useState('');

  const effortToMinutes = { S: 30, M: 60, L: 120 };
  const effortToXP = { S: 25, M: 50, L: 100 };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createTask({
      title,
      description: description || null,
      node_id: nodeId || null,
      estimated_time: effortToMinutes[effort],
      xp_reward: effortToXP[effort],
      due_date: dueDate || null,
      priority: 3,
      difficulty: 'basic',
      category: 'general',
    });

    // Reset form
    setTitle('');
    setDescription('');
    setEffort('M');
    setDueDate('');
    setIsAddSheetOpen(false);
  };

  return (
    <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Add New Task</SheetTitle>
          <SheetDescription>
            Create a task and optionally link it to a grid node
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="node">Link to Node (optional)</Label>
            <Select value={nodeId} onValueChange={setNodeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a node..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="effort">Effort</Label>
            <Select value={effort} onValueChange={(v: any) => setEffort(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="S">Small (~30 min, 25 XP)</SelectItem>
                <SelectItem value="M">Medium (~1 hr, 50 XP)</SelectItem>
                <SelectItem value="L">Large (~2 hrs, 100 XP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date (optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Create Task
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAddSheetOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
