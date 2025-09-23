import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  TrendingUp, 
  Clock, 
  Zap,
  CheckCircle2,
  Calendar,
  Star,
  Activity
} from 'lucide-react';
import { FFXSphereGrid } from './FFXSphereGrid';
import { OptimizedSchedule } from './OptimizedSchedule';
import { AIOptimizer } from './AIOptimizer';
import { SphereNode, Task } from '@/types/new-index';
import { aiService } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

interface UnifiedProgressSystemProps {
  nodes: SphereNode[];
  tasks: Task[];
  onNodeClick: (node: SphereNode) => void;
  onNodeUpdate: (nodeId: string, updates: Partial<SphereNode>) => void;
  onDataRefresh: () => void;
}

export const UnifiedProgressSystem: React.FC<UnifiedProgressSystemProps> = ({
  nodes,
  tasks,
  onNodeClick,
  onNodeUpdate,
  onDataRefresh
}) => {
  const [activeView, setActiveView] = useState<'grid' | 'analytics' | 'schedule'>('grid');
  const [systemStats, setSystemStats] = useState({
    totalXP: 0,
    completionRate: 0,
    activeStreaks: 0,
    efficiencyScore: 85
  });
  const { toast } = useToast();

  useEffect(() => {
    calculateSystemStats();
  }, [nodes, tasks]);

  const calculateSystemStats = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const completedNodes = nodes.filter(n => n.status === 'completed');
    
    const totalXP = nodes.reduce((sum, node) => sum + (node.metadata?.xp || 0), 0);
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
    const avgProgress = nodes.length > 0 ? 
      nodes.reduce((sum, n) => sum + (n.progress || 0), 0) / nodes.length : 0;
    
    const efficiencyScore = Math.round((completionRate + avgProgress) / 2);
    
    setSystemStats({
      totalXP,
      completionRate: Math.round(completionRate),
      activeStreaks: completedNodes.length,
      efficiencyScore
    });
  };

  const handleAutoOptimize = async () => {
    try {
      // Run all optimizations in sequence
      await aiService.optimizeCategories();
      await aiService.rebalanceNodes();
      await aiService.autoScheduleTasks(new Date().toISOString().split('T')[0]);
      
      toast({
        title: "System Optimized!",
        description: "All components have been synchronized and optimized",
      });
      
      onDataRefresh();
    } catch (error) {
      console.error('Auto-optimization error:', error);
      toast({
        title: "Optimization Incomplete",
        description: "Some optimizations may have failed. Check individual components.",
        variant: "destructive"
      });
    }
  };

  const getNodeConnectionInsights = () => {
    const domainClusters = nodes.reduce((acc, node) => {
      if (!acc[node.domain]) acc[node.domain] = [];
      acc[node.domain].push(node);
      return acc;
    }, {} as Record<string, SphereNode[]>);

    return Object.entries(domainClusters).map(([domain, domainNodes]) => ({
      domain,
      nodeCount: domainNodes.length,
      avgProgress: domainNodes.reduce((sum, n) => sum + (n.progress || 0), 0) / domainNodes.length,
      tasksCount: tasks.filter(t => 
        domainNodes.some(n => n.id === t.nodeId)
      ).length
    }));
  };

  const connectionInsights = getNodeConnectionInsights();

  return (
    <div className="space-y-6">
      {/* System Overview Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Unified Progress System
              <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                AI-Powered
              </Badge>
            </CardTitle>
            
            <Button onClick={handleAutoOptimize} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Zap className="h-4 w-4 mr-2" />
              Auto-Optimize All
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Total XP</span>
              </div>
              <div className="text-2xl font-bold text-primary">{systemStats.totalXP}</div>
            </div>
            
            <div className="bg-gradient-to-br from-gaming-success/5 to-gaming-success/10 p-4 rounded-lg border border-gaming-success/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-gaming-success" />
                <span className="text-sm font-medium text-foreground">Completion Rate</span>
              </div>
              <div className="text-2xl font-bold text-gaming-success">{systemStats.completionRate}%</div>
            </div>
            
            <div className="bg-gradient-to-br from-gaming-epic/5 to-gaming-epic/10 p-4 rounded-lg border border-gaming-epic/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-gaming-epic" />
                <span className="text-sm font-medium text-foreground">Active Nodes</span>
              </div>
              <div className="text-2xl font-bold text-gaming-epic">{systemStats.activeStreaks}</div>
            </div>
            
            <div className="bg-gradient-to-br from-gaming-warning/5 to-gaming-warning/10 p-4 rounded-lg border border-gaming-warning/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-gaming-warning" />
                <span className="text-sm font-medium text-foreground">Efficiency</span>
              </div>
              <div className="text-2xl font-bold text-gaming-warning">{systemStats.efficiencyScore}%</div>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2 mb-4">
            <Button 
              variant={activeView === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('grid')}
            >
              <Target className="h-4 w-4 mr-2" />
              Sphere Grid
            </Button>
            <Button 
              variant={activeView === 'analytics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('analytics')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button 
              variant={activeView === 'schedule' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('schedule')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Content Based on Active View */}
      {activeView === 'grid' && (
        <FFXSphereGrid 
          nodes={nodes}
          onNodeClick={onNodeClick}
          onNodeUpdate={onNodeUpdate}
        />
      )}

      {activeView === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Domain Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Domain Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {connectionInsights.map((insight) => (
                <div key={insight.domain} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{insight.domain}</span>
                    <Badge variant="outline">
                      {insight.nodeCount} nodes • {insight.tasksCount} tasks
                    </Badge>
                  </div>
                  <Progress value={insight.avgProgress} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    Average Progress: {Math.round(insight.avgProgress)}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* AI Optimizer */}
          <AIOptimizer onOptimizationComplete={onDataRefresh} />
        </div>
      )}

      {activeView === 'schedule' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <OptimizedSchedule selectedDate={new Date().toISOString().split('T')[0]} />
          
          {/* Schedule Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Peak Productivity</span>
                  </div>
                  <Badge>9:00 - 11:00 AM</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gaming-success/5 rounded-lg border border-gaming-success/20">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gaming-success" />
                    <span className="text-sm font-medium text-foreground">Focus Score</span>
                  </div>
                  <Badge variant="secondary">{systemStats.efficiencyScore}%</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gaming-epic/5 rounded-lg border border-gaming-epic/20">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gaming-epic" />
                    <span className="text-sm font-medium text-foreground">Energy Alignment</span>
                  </div>
                  <Badge>Optimal</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>🔗 All systems connected and synchronized</span>
            <div className="flex items-center gap-4">
              <span>Last sync: Just now</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Online</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};