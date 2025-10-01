import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Circle, Line, Text, FabricObject, Point, Shadow } from 'fabric';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Target,
  Zap,
  Star,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { SphereNode } from '@/types/new-index';

interface FFXSphereGridProps {
  nodes: SphereNode[];
  onNodeClick?: (node: SphereNode) => void;
  onNodeUpdate?: (nodeId: string, updates: Partial<SphereNode>) => void;
}

interface GridNode extends SphereNode {
  fabricObject?: FabricObject;
  connections: string[];
}

export const FFXSphereGrid: React.FC<FFXSphereGridProps> = ({ 
  nodes, 
  onNodeClick, 
  onNodeUpdate 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedNode, setSelectedNode] = useState<GridNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [gridNodes, setGridNodes] = useState<GridNode[]>([]);

  // Enhanced node positioning algorithm (FFX-style layout)
  const generateFFXLayout = useCallback((nodeList: SphereNode[]): GridNode[] => {
    const centerX = 400; // Canvas center
    const centerY = 300; // Canvas center
    const baseRadius = 80; // Smaller base radius
    const spacing = 40; // Spacing between nodes
    
    console.log('FFX Grid: Generating layout for', nodeList.length, 'nodes');
    
    return nodeList.map((node, index) => {
      let x, y, connections: string[] = [];
      
      if (index === 0) {
        // Central starting node
        x = centerX;
        y = centerY;
      } else {
        // Circular/spiral pattern for better visibility
        const angleStep = (2 * Math.PI) / Math.max(6, nodeList.length - 1);
        const ring = Math.floor((index - 1) / 6) + 1;
        const posInRing = (index - 1) % 6;
        const angle = posInRing * angleStep;
        const radius = baseRadius + (ring - 1) * spacing;
        
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }
      
      // Create smart connections based on domain similarity
      connections = nodeList
        .filter((otherNode, otherIndex) => {
          if (otherIndex === index) return false;
          return otherNode.domain === node.domain && Math.random() > 0.5;
        })
        .slice(0, 2) // Max 2 connections per node
        .map(connectedNode => connectedNode.id);
      
      console.log(`FFX Grid: Node ${node.title} positioned at (${x.toFixed(0)}, ${y.toFixed(0)})`);
      
      return {
        ...node,
        position: { x, y },
        connections
      };
    });
  }, []);

  // Initialize the fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    try {
      const canvas = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#0a0a23',
        selection: false,
        renderOnAddRemove: true,
        skipTargetFind: false
      });

      // Ensure canvas is properly sized and visible
      canvas.setDimensions({ width: 800, height: 600 });
      canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
      canvas.setZoom(1);

      // Verify canvas context is ready
      const ctx = canvas.getContext();
      if (!ctx) {
        console.error('FFX Grid: Failed to get canvas context');
        return;
      }

      // Enable zooming and panning
      canvas.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 3) zoom = 3;
        if (zoom < 0.5) zoom = 0.5;
        canvas.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom);
        setZoomLevel(zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      // Pan with alt + drag
      let isDragging = false;
      let lastPosX = 0;
      let lastPosY = 0;

      canvas.on('mouse:down', (opt) => {
        const evt = opt.e as MouseEvent;
        if (evt.altKey) { 
          isDragging = true;
          canvas.selection = false;
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
      });

      canvas.on('mouse:move', (opt) => {
        if (isDragging) {
          const evt = opt.e as MouseEvent;
          const vpt = canvas.viewportTransform!;
          vpt[4] += evt.clientX - lastPosX;
          vpt[5] += evt.clientY - lastPosY;
          canvas.requestRenderAll();
          lastPosX = evt.clientX;
          lastPosY = evt.clientY;
        }
      });

      canvas.on('mouse:up', () => {
        isDragging = false;
        canvas.selection = true;
      });

      console.log('FFX Grid: Canvas initialized successfully with dimensions:', canvas.width, 'x', canvas.height);
      setFabricCanvas(canvas);

      return () => {
        try {
          canvas.dispose();
        } catch (error) {
          console.error('FFX Grid: Error disposing canvas:', error);
        }
      };
    } catch (error) {
      console.error('FFX Grid: Error initializing canvas:', error);
    }
  }, []);

  // Update grid when nodes change
  useEffect(() => {
    console.log('FFX Grid: Nodes updated:', nodes.length, 'nodes received');
    console.log('FFX Grid: Sample node data:', nodes.slice(0, 2));
    
    if (nodes.length === 0) {
      console.log('FFX Grid: No nodes provided, setting empty grid');
      setGridNodes([]);
      return;
    }
    
    const enhancedNodes = generateFFXLayout(nodes);
    console.log('FFX Grid: Generated grid nodes:', enhancedNodes.length);
    console.log('FFX Grid: Sample enhanced node:', enhancedNodes[0]);
    
    setGridNodes(enhancedNodes);
  }, [nodes, generateFFXLayout]);

  // Render nodes and connections on canvas
  useEffect(() => {
    console.log('FFX Grid: Canvas render effect triggered');
    console.log('FFX Grid: Canvas ready:', !!fabricCanvas, 'Nodes to render:', gridNodes.length);
    
    if (!fabricCanvas) {
      console.log('FFX Grid: Canvas not ready yet');
      return;
    }

    // Safely clear canvas with context check
    try {
      // Remove all objects instead of calling clear() to avoid context issues
      const objects = fabricCanvas.getObjects();
      objects.forEach(obj => fabricCanvas.remove(obj));
      
      if (gridNodes.length === 0) {
        console.log('FFX Grid: No nodes to render');
        fabricCanvas.renderAll();
        return;
      }

      console.log('FFX Grid: Clearing canvas and starting render...');
      fabricCanvas.backgroundColor = 'rgba(10, 10, 35, 0.95)';
    } catch (error) {
      console.error('FFX Grid: Error clearing canvas:', error);
      return;
    }
    
    // First pass: Draw connections (lines behind nodes)
    gridNodes.forEach((node, nodeIndex) => {
      node.connections.forEach((connectionId) => {
        const targetNode = gridNodes.find(n => n.id === connectionId);
        if (!targetNode) return;

        const line = new Line(
          [node.position.x, node.position.y, targetNode.position.x, targetNode.position.y],
          {
            stroke: getConnectionColor(node, targetNode),
            strokeWidth: 2,
            opacity: 0.6,
            selectable: false,
            evented: false,
            strokeDashArray: node.status === 'completed' && targetNode.status === 'completed' 
              ? [] : [5, 5] 
          }
        );
        fabricCanvas.add(line);
      });
    });

    // Second pass: Draw nodes
    let renderedNodes = 0;
    gridNodes.forEach((node, nodeIndex) => {
      const nodeColor = getNodeColor(node);
      const nodeRadius = getNodeRadius(node);
      
      console.log(`FFX Grid: Rendering node ${nodeIndex + 1}/${gridNodes.length}: "${node.title}" at (${node.position.x}, ${node.position.y}) with color ${nodeColor} and radius ${nodeRadius}`);

      // Main node circle
      const circle = new Circle({
        left: node.position.x,
        top: node.position.y,
        radius: nodeRadius,
        fill: nodeColor,
        stroke: getNodeBorderColor(node),
        strokeWidth: 4,
        selectable: true,
        evented: true,
        originX: 'center',
        originY: 'center',
        shadow: new Shadow({
          color: nodeColor,
          blur: 20,
          offsetX: 0,
          offsetY: 0,
          affectStroke: false,
          includeDefaultValues: true,
          nonScaling: false
        })
      });

      // Progress ring for nodes with progress
      if (node.progress && node.progress > 0) {
        const circumference = 2 * Math.PI * (nodeRadius + 6);
        const progressLength = (circumference * node.progress) / 100;
        
        const progressRing = new Circle({
          left: node.position.x,
          top: node.position.y,
          radius: nodeRadius + 6,
          fill: 'transparent',
          stroke: '#22c55e',
          strokeWidth: 3,
          strokeDashArray: [progressLength, circumference],
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center'
        });
        fabricCanvas.add(progressRing);
      }

      // Node text label
      const text = new Text(node.title.substring(0, 15) + (node.title.length > 15 ? '...' : ''), {
        left: node.position.x,
        top: node.position.y + nodeRadius + 15,
        originX: 'center',
        originY: 'top',
        fontSize: 12,
        fill: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        selectable: false,
        evented: false,
        shadow: new Shadow({
          color: 'rgba(0,0,0,0.8)',
          blur: 3,
          offsetX: 1,
          offsetY: 1,
          affectStroke: false,
          includeDefaultValues: true,
          nonScaling: false
        })
      });

      // Status icons
      if (node.status === 'completed') {
        const checkIcon = new Circle({
          left: node.position.x + nodeRadius - 5,
          top: node.position.y - nodeRadius - 5,
          radius: 8,
          fill: '#22c55e',
          stroke: '#ffffff',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center'
        });
        fabricCanvas.add(checkIcon);
      }

      // Click handler for nodes
      circle.on('mousedown', () => {
        console.log('FFX Grid: Node clicked:', node.title);
        setSelectedNode(node);
        onNodeClick?.(node);
        
        // Visual feedback animation
        circle.animate({
          scaleX: 1.3,
          scaleY: 1.3
        }, {
          duration: 150,
          onChange: () => fabricCanvas.renderAll(),
          onComplete: () => {
            circle.animate({
              scaleX: 1,
              scaleY: 1
            }, {
              duration: 150,
              onChange: () => fabricCanvas.renderAll()
            });
          }
        });
      });

      fabricCanvas.add(circle);
      fabricCanvas.add(text);
      
      // Store reference
      node.fabricObject = circle;
      renderedNodes++;
    });

    console.log(`FFX Grid: Render complete. Added ${renderedNodes} nodes. Total canvas objects: ${fabricCanvas.getObjects().length}`);
    fabricCanvas.renderAll();
    
    // Force a re-render after a short delay to ensure visibility
    setTimeout(() => {
      console.log('FFX Grid: Force re-render - objects now:', fabricCanvas.getObjects().length);
      fabricCanvas.renderAll();
    }, 100);
    
    // Additional debug: Log all canvas objects
    console.log('FFX Grid: Canvas objects:', fabricCanvas.getObjects().map(obj => obj.constructor.name));
    
  }, [fabricCanvas, gridNodes, onNodeClick]);

  const getNodeColor = (node: GridNode): string => {
    const colors = {
      programming: '#3b82f6',
      health: '#ef4444', 
      finance: '#22c55e',
      learning: '#8b5cf6',
      creative: '#f59e0b',
      general: '#6b7280'
    };
    
    if (node.status === 'completed') return '#10b981';
    if (node.status === 'locked') return '#374151';
    
    return colors[node.domain as keyof typeof colors] || colors.general;
  };

  const getNodeBorderColor = (node: GridNode): string => {
    if (node.status === 'available') return '#fbbf24';
    if (node.status === 'completed') return '#22c55e';
    return '#6b7280';
  };

  const getNodeRadius = (node: GridNode): number => {
    const baseRadius = 40; // Increased from 15 to 40 for better visibility
    if (node.goalType === 'project') return baseRadius + 15; // Projects are larger
    if (node.goalType === 'habit') return baseRadius + 10; // Habits medium
    return baseRadius; // One-off tasks base size
  };

  const getConnectionColor = (node1: GridNode, node2: GridNode): string => {
    if (node1.status === 'completed' && node2.status === 'completed') {
      return '#22c55e';
    }
    if (node1.domain === node2.domain) {
      return '#3b82f6';
    }
    return '#6b7280';
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!fabricCanvas) return;
    
    const zoom = fabricCanvas.getZoom();
    const newZoom = direction === 'in' ? zoom * 1.2 : zoom / 1.2;
    const clampedZoom = Math.max(0.3, Math.min(3, newZoom));
    
    fabricCanvas.setZoom(clampedZoom);
    setZoomLevel(clampedZoom);
    fabricCanvas.renderAll();
  };

  const handleReset = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.setZoom(1);
    fabricCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    setZoomLevel(1);
    fabricCanvas.renderAll();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            FFX Sphere Grid
            <Badge variant="outline">{gridNodes.length} nodes</Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleZoom('out')}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">{Math.round(zoomLevel * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => handleZoom('in')}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative w-full">
          <canvas 
            ref={canvasRef}
            width={800}
            height={600}
            className="border border-gray-700 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 w-full max-w-full"
          />
          
          {/* Debug Info - Always show in development */}
          <div className="absolute top-2 right-2 bg-black/80 text-white p-2 rounded text-xs space-y-1">
            <div>Canvas: {fabricCanvas ? '✅' : '❌'}</div>
            <div>Raw Nodes: {nodes.length}</div>
            <div>Grid Nodes: {gridNodes.length}</div>
            <div>Canvas Objects: {fabricCanvas?.getObjects().length || 0}</div>
            <div>Zoom: {Math.round(zoomLevel * 100)}%</div>
            {selectedNode && (
              <div className="text-yellow-300">Selected: {selectedNode.title}</div>
            )}
          </div>
          
          {/* Empty State */}
          {gridNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-center text-white">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No sphere nodes to display</p>
                <p className="text-sm opacity-75">Create nodes using the Brain Dump feature or Node Creation Test</p>
                <div className="mt-4 text-xs bg-black/30 p-3 rounded">
                  <p>Debug: Received {nodes.length} nodes from props</p>
                  <p>Generated {gridNodes.length} grid nodes</p>
                  <p>Canvas objects: {fabricCanvas?.getObjects().length || 0}</p>
                </div>
              </div>
            </div>
          )}
          
          {selectedNode && (
            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getNodeColor(selectedNode) }}
                />
                <span className="font-semibold">{selectedNode.title}</span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {selectedNode.domain}
                  </Badge>
                  <Badge variant={selectedNode.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedNode.status}
                  </Badge>
                </div>
                
                {selectedNode.progress && (
                  <div className="flex items-center gap-2">
                    <Star className="h-3 w-3" />
                    <span>Progress: {selectedNode.progress}%</span>
                  </div>
                )}
                
                {selectedNode.connections.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>{selectedNode.connections.length} connections</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Scroll to zoom • Alt+drag to pan • Click nodes to interact</span>
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (fabricCanvas) {
                  fabricCanvas.setZoom(1);
                  fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
                  fabricCanvas.renderAll();
                  setZoomLevel(1);
                }
              }}
            >
              Reset View
            </Button>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span>Locked</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};