import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  Target, 
  TrendingUp, 
  Zap,
  Brain,
  Calendar,
  Network
} from 'lucide-react';

export const SystemOverview: React.FC = () => {
  return (
    <Card className="bg-gradient-to-br from-card to-muted border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI-Powered Sphere Grid System
          <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
            Fully Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* System Components */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border-border border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-sm">FFX Sphere Grid</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Interactive node network with path connections, progress tracking, and visual feedback
            </p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border-border border">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-purple-600" />
              <span className="font-medium text-sm">AI Optimization</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatic category sorting, node rebalancing, and intelligent task scheduling
            </p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border-border border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="font-medium text-sm">Smart Scheduling</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Energy-aligned time slots with subtask dependencies and efficiency optimization
            </p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border-border border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-sm">Progress Analytics</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time insights, completion tracking, and performance metrics
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Network className="h-4 w-4" />
            Connected Functionality
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Brain dump → AI analysis → Node creation → Task scheduling</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Node progress → XP calculation → Level progression</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Task completion → Node advancement → Path unlocking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Schedule optimization → Energy alignment → Efficiency scoring</span>
            </div>
          </div>
        </div>

        {/* Controls Guide */}
        <div className="bg-muted/50 backdrop-blur-sm p-3 rounded-lg border-border border">
          <h5 className="font-medium text-sm mb-2">Quick Controls</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div>
              <strong>Sphere Grid:</strong> Scroll to zoom, Alt+click to pan, click nodes to select
            </div>
            <div>
              <strong>AI Optimizer:</strong> Auto-categorize, schedule tasks, rebalance progress
            </div>
            <div>
              <strong>Schedule:</strong> Real-time updates, energy matching, completion tracking
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};