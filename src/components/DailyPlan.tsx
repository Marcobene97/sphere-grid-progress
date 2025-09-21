import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Target, Shuffle, Lock, Unlock } from 'lucide-react';
import { DayPlanSlot, Subtask, Task } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { useActionCounsellor } from '@/hooks/useActionCounsellor';

interface DailyPlanProps {
  date: string;
  dayPlanSlots: DayPlanSlot[];
  subtasks: Subtask[];
  tasks: Task[];
  onSlotsUpdate: () => void;
}

export const DailyPlan = ({ date, dayPlanSlots, subtasks, tasks, onSlotsUpdate }: DailyPlanProps) => {
  const { isGenerating, buildDayPlan } = useActionCounsellor();
  const { toast } = useToast();

  const todaysSlots = useMemo(() => 
    dayPlanSlots
      .filter(slot => slot.date === date)
      .sort((a, b) => new Date(a.slotStart).getTime() - new Date(b.slotStart).getTime()),
    [dayPlanSlots, date]
  );

  const subtaskMap = useMemo(() => {
    const map = new Map();
    subtasks.forEach(subtask => map.set(subtask.id, subtask));
    return map;
  }, [subtasks]);

  const taskMap = useMemo(() => {
    const map = new Map();
    tasks.forEach(task => map.set(task.id, task));
    return map;
  }, [tasks]);

  const generateDayPlan = async () => {
    const result = await buildDayPlan(date, {
      dayStart: '06:00',
      dayEnd: '19:00',
      sprintDuration: 45,
      breakDuration: 15
    });
    
    if (result) {
      onSlotsUpdate();
    }
  };

  const toggleSlotLock = async (slotId: string, currentlyLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('day_plan_slots')
        .update({ locked: !currentlyLocked })
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: currentlyLocked ? "Slot Unlocked" : "Slot Locked",
        description: currentlyLocked ? "Time slot can now be rescheduled." : "Time slot is now protected from changes.",
      });
      
      onSlotsUpdate();
    } catch (error) {
      console.error('Failed to toggle slot lock:', error);
    }
  };

  const getContextColor = (context: string) => {
    switch (context) {
      case 'desk': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'gym': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'errand': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'reading': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'quiet': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getEnergyIcon = (energy: string) => {
    switch (energy) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
      default: return '⚪';
    }
  };

  const getDomainColor = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'programming': return 'bg-gaming-info text-white';
      case 'reading': return 'bg-gaming-warning text-white';
      case 'health': return 'bg-gaming-success text-white';
      case 'admin': return 'bg-gaming-rare text-white';
      case 'business': return 'bg-gaming-legendary text-white';
      case 'music': return 'bg-gaming-epic text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Daily Plan
            </CardTitle>
            <CardDescription>
              Interleaved schedule for {new Date(date).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button 
            onClick={generateDayPlan}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Shuffle className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Shuffle className="w-4 h-4" />
                Plan Today
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {todaysSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No time slots planned for today.</p>
            <p className="text-sm">Click "Plan Today" to generate your daily schedule.</p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {todaysSlots.map((slot) => {
                const subtask = slot.subtaskId ? subtaskMap.get(slot.subtaskId) : null;
                const task = subtask?.taskId ? taskMap.get(subtask.taskId) : null;
                
                return (
                  <Card key={slot.id} className={`relative transition-all duration-200 hover:shadow-sm ${
                    slot.locked ? 'ring-2 ring-primary' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-mono">
                              {formatTime(slot.slotStart)} - {formatTime(slot.slotEnd)}
                            </span>
                            {slot.locked && (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            )}
                          </div>
                          
                          {subtask ? (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm">{subtask.title}</h4>
                              
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={getDomainColor(task?.category || 'general')}>
                                  {task?.category || 'General'}
                                </Badge>
                                
                                <Badge className={getContextColor(task?.context || 'desk')}>
                                  {task?.context || 'desk'}
                                </Badge>
                                
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <span>{getEnergyIcon(task?.energy || 'medium')}</span>
                                  <span>{subtask.estMinutes}m</span>
                                </div>
                                
                                {subtask.tags.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground italic">
                              Available time slot
                            </div>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSlotLock(slot.id, slot.locked)}
                          className="ml-2"
                        >
                          {slot.locked ? (
                            <Unlock className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};