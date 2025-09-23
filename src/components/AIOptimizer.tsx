import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  Target, 
  Calendar,
  RotateCw,
  Zap,
  Settings,
  Clock,
  TrendingUp
} from 'lucide-react';
import { aiService } from '@/lib/ai-service';
import { useToast } from '@/hooks/use-toast';

interface AIOptimizerProps {
  onOptimizationComplete: () => void;
}

export const AIOptimizer: React.FC<AIOptimizerProps> = ({ onOptimizationComplete }) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferences, setPreferences] = useState({
    workHours: '9:00-17:00',
    energyPeak: 'morning',
    breakFreq: '25min work, 5min break',
    deepWorkBlocks: '90-120 minutes'
  });
  const { toast } = useToast();

  const handleOptimizeCategories = async () => {
    setIsOptimizing(true);
    try {
      const result = await aiService.optimizeCategories();
      toast({
        title: "Categories Optimized!",
        description: `Applied ${result.updatesApplied} optimizations to improve organization`,
      });
      onOptimizationComplete();
    } catch (error) {
      console.error('Optimization error:', error);
      toast({
        title: "Optimization Failed",
        description: "Failed to optimize categories. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleAutoSchedule = async () => {
    setIsScheduling(true);
    try {
      const result = await aiService.autoScheduleTasks(scheduleDate, preferences);
      toast({
        title: "Schedule Optimized!",
        description: `Created ${result.slotsCreated} optimized time slots for ${scheduleDate}`,
      });
      onOptimizationComplete();
    } catch (error) {
      console.error('Scheduling error:', error);
      toast({
        title: "Scheduling Failed",
        description: "Failed to create optimized schedule. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const handleRebalanceNodes = async () => {
    setIsRebalancing(true);
    try {
      const result = await aiService.rebalanceNodes();
      toast({
        title: "Nodes Rebalanced!",
        description: `Applied ${result.changesApplied} changes to optimize your skill progression`,
      });
      onOptimizationComplete();
    } catch (error) {
      console.error('Rebalancing error:', error);
      toast({
        title: "Rebalancing Failed", 
        description: "Failed to rebalance nodes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRebalancing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Optimization Center
          <Badge variant="outline">Auto</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category & Node Optimization */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Smart Organization</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Automatically organize categories, merge similar nodes, and optimize task connections
          </p>
          <Button 
            onClick={handleOptimizeCategories}
            disabled={isOptimizing}
            className="w-full"
          >
            {isOptimizing ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Optimize Categories & Connections
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Auto Scheduling */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Intelligent Scheduling</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Create optimized daily schedules based on task priority, energy levels, and subtask dependencies
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="schedule-date">Target Date</Label>
              <Input
                id="schedule-date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="work-hours">Work Hours</Label>
              <Input
                id="work-hours"
                placeholder="9:00-17:00"
                value={preferences.workHours}
                onChange={(e) => setPreferences(prev => ({ ...prev, workHours: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="energy-peak">Energy Peak</Label>
              <select 
                id="energy-peak"
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                value={preferences.energyPeak}
                onChange={(e) => setPreferences(prev => ({ ...prev, energyPeak: e.target.value }))}
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div>
              <Label htmlFor="deep-work">Deep Work Blocks</Label>
              <Input
                id="deep-work"
                placeholder="90-120 minutes"
                value={preferences.deepWorkBlocks}
                onChange={(e) => setPreferences(prev => ({ ...prev, deepWorkBlocks: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            onClick={handleAutoSchedule}
            disabled={isScheduling}
            className="w-full"
          >
            {isScheduling ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Creating Schedule...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Auto-Schedule Tasks
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Node Rebalancing */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Progress Rebalancing</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyze node progress, merge underutilized areas, and update XP based on completed work
          </p>
          <Button 
            onClick={handleRebalanceNodes}
            disabled={isRebalancing}
            variant="secondary"
            className="w-full"
          >
            {isRebalancing ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Rebalancing...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4 mr-2" />
                Rebalance Nodes & Progress
              </>
            )}
          </Button>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            AI automatically optimizes based on usage patterns, task completion, and efficiency metrics
          </p>
        </div>
      </CardContent>
    </Card>
  );
};