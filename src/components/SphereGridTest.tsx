import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Zap, RefreshCw } from 'lucide-react';

interface TestNode {
  id: string;
  title: string;
  domain: string;
  status: string;
  progress: number;
  x: number;
  y: number;
}

export const SphereGridTest: React.FC = () => {
  const testNodes: TestNode[] = [
    { id: '1', title: 'Programming', domain: 'programming', status: 'available', progress: 25, x: 400, y: 300 },
    { id: '2', title: 'Health & Fitness', domain: 'health', status: 'available', progress: 60, x: 320, y: 250 },
    { id: '3', title: 'Finance', domain: 'finance', status: 'completed', progress: 100, x: 480, y: 250 },
    { id: '4', title: 'Creative Work', domain: 'creative', status: 'available', progress: 40, x: 400, y: 200 },
    { id: '5', title: 'Learning', domain: 'learning', status: 'locked', progress: 0, x: 360, y: 350 },
  ];

  const getNodeColor = (domain: string, status: string) => {
    if (status === 'completed') return '#10b981';
    if (status === 'locked') return '#6b7280';
    
    const colors = {
      programming: '#3b82f6',
      health: '#ef4444',
      finance: '#22c55e',
      creative: '#f59e0b',
      learning: '#8b5cf6'
    };
    
    return colors[domain as keyof typeof colors] || '#6b7280';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Simple Sphere Grid Test
          </CardTitle>
          <Badge variant="outline">{testNodes.length} test nodes</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {/* Simple SVG-based sphere grid */}
          <svg 
            width="800" 
            height="600" 
            className="border border-gray-300 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700"
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#374151" strokeWidth="1" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Connection lines */}
            {testNodes.map((node, index) => (
              testNodes.slice(index + 1).map((targetNode) => {
                const distance = Math.sqrt(
                  Math.pow(node.x - targetNode.x, 2) + 
                  Math.pow(node.y - targetNode.y, 2)
                );
                
                if (distance < 150) {
                  return (
                    <line
                      key={`${node.id}-${targetNode.id}`}
                      x1={node.x}
                      y1={node.y}
                      x2={targetNode.x}
                      y2={targetNode.y}
                      stroke="#6b7280"
                      strokeWidth="2"
                      opacity="0.4"
                      strokeDasharray={node.status === 'completed' && targetNode.status === 'completed' ? '' : '5,5'}
                    />
                  );
                }
                return null;
              })
            ))}
            
            {/* Nodes */}
            {testNodes.map((node) => (
              <g key={node.id}>
                {/* Progress ring */}
                {node.progress > 0 && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="28"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3"
                    strokeDasharray={`${(2 * Math.PI * 28 * node.progress) / 100} ${2 * Math.PI * 28}`}
                    transform={`rotate(-90 ${node.x} ${node.y})`}
                    opacity="0.8"
                  />
                )}
                
                {/* Main node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="20"
                  fill={getNodeColor(node.domain, node.status)}
                  stroke={node.status === 'available' ? '#fbbf24' : node.status === 'completed' ? '#22c55e' : '#6b7280'}
                  strokeWidth="3"
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    filter: `drop-shadow(0 0 10px ${getNodeColor(node.domain, node.status)}50)`
                  }}
                />
                
                {/* Status indicator */}
                {node.status === 'completed' && (
                  <circle
                    cx={node.x + 15}
                    cy={node.y - 15}
                    r="8"
                    fill="#22c55e"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
                
                {/* Node label */}
                <text
                  x={node.x}
                  y={node.y + 35}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontFamily="Arial, sans-serif"
                  style={{
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                  }}
                >
                  {node.title}
                </text>
                
                {/* Progress text */}
                <text
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="Arial, sans-serif"
                  fontWeight="bold"
                >
                  {node.progress}%
                </text>
              </g>
            ))}
            
            {/* Center guide */}
            <circle cx="400" cy="300" r="2" fill="#fbbf24" opacity="0.5" />
          </svg>
          
          {/* Instructions */}
          <div className="absolute bottom-2 left-2 bg-black/80 text-white p-2 rounded text-xs">
            <p>This is a simple SVG-based test to verify node rendering works</p>
            <p>If you can see the colored circles above, the issue is with Fabric.js</p>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>Static SVG sphere grid test</span>
          <div className="flex items-center gap-4">
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