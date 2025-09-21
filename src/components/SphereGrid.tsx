import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { SphereNode as SphereNodeType, Task } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SphereGridProps {
  nodes: SphereNodeType[];
  tasks: Task[];
  onNodeClick: (node: SphereNodeType) => void;
  onNodeUpdate: (nodeId: string, updates: Partial<SphereNodeType>) => void;
}

type SphereNodeData = SphereNodeType & {
  onClick: (node: SphereNodeType) => void;
  taskStats?: {
    total: number;
    completed: number;
  };
};

const SphereNodeComponent = ({ data }: { data: SphereNodeData }) => {
  const getNodeColor = () => {
    switch (data.status) {
      case 'locked': return 'hsl(var(--node-locked))';
      case 'available': return 'hsl(var(--node-available))';
      case 'in_progress': return 'hsl(var(--primary))';
      case 'completed': return 'hsl(var(--node-completed))';
      case 'mastered': return 'hsl(var(--node-mastered))';
      default: return 'hsl(var(--muted))';
    }
  };

  const getBranchColor = () => {
    switch (data.branch) {
      case 'programming': return 'hsl(var(--gaming-info))';
      case 'finance': return 'hsl(var(--gaming-success))';
      case 'music': return 'hsl(var(--gaming-warning))';
      default: return 'hsl(var(--primary))';
    }
  };

  const getTypeIcon = () => {
    switch (data.type) {
      case 'basic': return '⭐';
      case 'intermediate': return '💎';
      case 'advanced': return '👑';
      case 'master': return '🏆';
      default: return '📖';
    }
  };

  const taskStats = data.taskStats ?? { total: 0, completed: 0 };
  const isClickable = data.status !== 'locked';

  return (
    <Card
      className={`w-48 p-3 cursor-pointer transition-all duration-300 border-2 hover:scale-105 ${
        isClickable ? 'hover:shadow-lg' : 'opacity-60 cursor-not-allowed'
      } ${data.status === 'completed' || data.status === 'mastered' ? 'node-unlock' : ''}`}
      style={{
        borderColor: getNodeColor(),
        backgroundColor: `${getNodeColor()}15`,
      }}
      onClick={() => isClickable && data.onClick(data)}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className="text-xs"
            style={{ backgroundColor: getBranchColor(), color: 'white' }}
          >
            {data.branch}
          </Badge>
          <span className="text-lg">{getTypeIcon()}</span>
        </div>

        <h3 className="font-bold text-sm text-foreground">{data.title}</h3>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {data.description}
        </p>

        {data.status !== 'locked' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress</span>
              <span>{data.progress}%</span>
            </div>
            <Progress value={data.progress} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>+{data.rewards.xp} XP</span>
          {data.timeSpent > 0 && (
            <span>{Math.floor(data.timeSpent / 60)}h {data.timeSpent % 60}m</span>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Tasks: {taskStats.completed}/{taskStats.total}
        </div>

        {data.status === 'locked' && data.prerequisites.length > 0 && (
          <div className="text-xs text-destructive">
            Requires: {data.prerequisites.length} prerequisite{data.prerequisites.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Card>
  );
};

const nodeTypes = {
  sphereNode: SphereNodeComponent,
};

export const SphereGrid = ({ nodes, tasks, onNodeClick, onNodeUpdate }: SphereGridProps) => {
  const nodeTaskStats = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();

    tasks.forEach(task => {
      if (!task.nodeId) return;
      const stats = map.get(task.nodeId) ?? { total: 0, completed: 0 };
      stats.total += 1;
      if (task.status === 'completed') {
        stats.completed += 1;
      }
      map.set(task.nodeId, stats);
    });

    return map;
  }, [tasks]);

  const flowNodes: Node[] = useMemo(
    () =>
      nodes.map(node => ({
        id: node.id,
        type: 'sphereNode',
        position: node.position,
        data: { ...node, onClick: onNodeClick, taskStats: nodeTaskStats.get(node.id) },
        draggable: true,
      })),
    [nodes, onNodeClick, nodeTaskStats]
  );

  const flowEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    nodes.forEach(node => {
      node.unlocks.forEach(unlockedNodeId => {
        edges.push({
          id: `${node.id}-${unlockedNodeId}`,
          source: node.id,
          target: unlockedNodeId,
          type: 'smoothstep',
          animated: node.status === 'completed' || node.status === 'mastered',
          style: {
            stroke: node.status === 'completed' || node.status === 'mastered'
              ? 'hsl(var(--primary))'
              : 'hsl(var(--muted-foreground))',
            strokeWidth: 2,
          },
        });
      });
    });
    return edges;
  }, [nodes]);

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDragStop = useCallback(
    (_event: any, node: Node) => {
      onNodeUpdate(node.id, { position: node.position });
    },
    [onNodeUpdate]
  );

  return (
    <div className="w-full h-[600px] bg-card rounded-lg border">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gradient-to-br from-background to-muted/20"
      >
        <Background
          color="hsl(var(--border))"
          gap={20}
          size={1}
          className="opacity-30"
        />
        <Controls
          className="bg-card border border-border rounded-lg"
          showZoom
          showFitView
          showInteractive={false}
        />
        <MiniMap
          className="bg-card border border-border rounded-lg"
          nodeColor={(node) => {
            const sphereNode = nodes.find(n => n.id === node.id);
            if (!sphereNode) return 'hsl(var(--muted))';

            switch (sphereNode.status) {
              case 'locked': return 'hsl(var(--node-locked))';
              case 'available': return 'hsl(var(--node-available))';
              case 'in_progress': return 'hsl(var(--primary))';
              case 'completed': return 'hsl(var(--node-completed))';
              case 'mastered': return 'hsl(var(--node-mastered))';
              default: return 'hsl(var(--muted))';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};
