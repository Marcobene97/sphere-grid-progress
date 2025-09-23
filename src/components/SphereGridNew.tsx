import React, { useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SphereNode } from '@/types/new-index';

interface SphereGridProps {
  nodes: SphereNode[];
  onNodeClick: (node: SphereNode) => void;
  onNodeUpdate: (nodeId: string, position: { x: number; y: number }) => void;
}

const SphereNodeComponent = ({ data }: NodeProps) => {
  const { node, onClick } = data as { node: SphereNode; onClick: (node: SphereNode) => void };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'locked': return 'bg-gray-500/20 border-gray-500';
      case 'available': return 'bg-green-500/20 border-green-500';
      case 'in_progress': return 'bg-blue-500/20 border-blue-500';
      case 'completed': return 'bg-purple-500/20 border-purple-500';
      case 'mastered': return 'bg-gold-500/20 border-gold-500';
      default: return 'bg-gray-500/20 border-gray-500';
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain) {
      case 'programming': return 'text-cyan-400';
      case 'health': return 'text-green-400';
      case 'finance': return 'text-yellow-400';
      case 'learning': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div 
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all
        hover:scale-105 hover:shadow-lg min-w-[200px] max-w-[250px]
        ${getStatusColor(node.status)}
      `}
      onClick={() => onClick(node)}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-sm leading-tight">{node.title}</h3>
          <Badge variant="outline" className={`text-xs ${getDomainColor(node.domain)}`}>
            {node.domain}
          </Badge>
        </div>
        
        {node.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {node.description}
          </p>
        )}
        
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span>Progress</span>
            <span>{node.progress}%</span>
          </div>
          <Progress value={node.progress} className="h-1" />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{node.metadata.xp || 0} XP</span>
          <Badge variant="secondary" className="text-xs">
            {node.goalType}
          </Badge>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  sphereNode: SphereNodeComponent,
};

export function SphereGridNew({ nodes, onNodeClick, onNodeUpdate }: SphereGridProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((node) => ({
      id: node.id,
      type: 'sphereNode',
      position: { x: node.position.x, y: node.position.y },
      data: {
        node,
        onClick: (clickedNode: SphereNode) => {
          setSelectedNodeId(clickedNode.id);
          onNodeClick(clickedNode);
        }
      },
      selected: selectedNodeId === node.id
    }));
  }, [nodes, selectedNodeId, onNodeClick]);

  const flowEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    nodes.forEach((node) => {
      // Create edges for unlocked nodes
      if (node.unlocks) {
        node.unlocks.forEach((unlockedId) => {
          const targetNode = nodes.find(n => n.id === unlockedId);
          if (targetNode) {
            edges.push({
              id: `${node.id}-${unlockedId}`,
              source: node.id,
              target: unlockedId,
              type: 'smoothstep',
              style: { 
                stroke: node.metadata.color || '#22c55e',
                strokeWidth: 2
              },
              animated: node.status === 'in_progress'
            });
          }
        });
      }
    });
    
    return edges;
  }, [nodes]);

  const [reactFlowNodes, , onNodesChange] = useNodesState(flowNodes);
  const [reactFlowEdges, , onEdgesChange] = useEdgesState(flowEdges);

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      onNodeUpdate(node.id, node.position);
    },
    [onNodeUpdate]
  );

  // Update nodes when props change
  const [, setNodes] = useNodesState(flowNodes);
  const [, setEdges] = useEdgesState(flowEdges);
  
  React.useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  React.useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  return (
    <div className="w-full h-[600px] bg-background border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background color="#333" gap={16} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            const sphereNode = nodes.find(n => n.id === node.id);
            return sphereNode?.metadata.color || '#22c55e';
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
        />
      </ReactFlow>
    </div>
  );
}