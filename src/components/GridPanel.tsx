import { useNodes } from '@/hooks/useNodes';
import { useAppStore } from '@/hooks/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function GridPanel() {
  const { nodes } = useNodes();
  const { selectedNodeId, setSelectedNodeId } = useAppStore();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sphere Grid</h1>
        <p className="text-muted-foreground">
          Select a node to filter tasks. Click a node to view its details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => (
          <Card
            key={node.id}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg',
              selectedNodeId === node.id && 'ring-2 ring-primary'
            )}
            onClick={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{node.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground line-clamp-2">{node.description}</p>
                <div className="flex justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{node.domain}</span>
                  <span
                    className={cn(
                      'text-xs px-2 py-1 rounded',
                      node.status === 'completed' && 'bg-green-500/20 text-green-700',
                      node.status === 'in_progress' && 'bg-blue-500/20 text-blue-700',
                      node.status === 'available' && 'bg-yellow-500/20 text-yellow-700',
                      node.status === 'locked' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {node.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{node.progress}% progress</span>
                  <span>{node.time_spent} min spent</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {nodes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No nodes yet. Create your first goals and milestones.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
