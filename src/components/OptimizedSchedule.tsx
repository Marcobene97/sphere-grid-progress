import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Calendar, 
  Zap,
  CheckCircle,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TimeSlot {
  id: string;
  slot_start: string;
  slot_end: string;
  subtask_id?: string;
  locked: boolean;
  date: string;
}

interface OptimizedScheduleProps {
  selectedDate?: string;
  onSlotUpdate?: (slotId: string, updates: any) => void;
}

export const OptimizedSchedule: React.FC<OptimizedScheduleProps> = ({ 
  selectedDate = new Date().toISOString().split('T')[0],
  onSlotUpdate
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadSchedule();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, [selectedDate]);

  const loadSchedule = async () => {
    try {
      const { data: slots } = await supabase
        .from('day_plan_slots')
        .select(`
          *,
          subtasks(id, title, status, est_minutes, tasks(title, priority, difficulty))
        `)
        .eq('date', selectedDate)
        .order('slot_start');

      setTimeSlots(slots || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (datetime: string) => {
    return new Date(datetime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const isCurrentSlot = (slot: TimeSlot) => {
    const now = currentTime;
    const start = new Date(slot.slot_start);
    const end = new Date(slot.slot_end);
    return now >= start && now <= end;
  };

  const isUpcoming = (slot: TimeSlot) => {
    const now = currentTime;
    const start = new Date(slot.slot_start);
    return start > now;
  };

  const isPast = (slot: TimeSlot) => {
    const now = currentTime;
    const end = new Date(slot.slot_end);
    return end < now;
  };

  const getSlotDuration = (slot: TimeSlot) => {
    const start = new Date(slot.slot_start);
    const end = new Date(slot.slot_end);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
  };

  const getEnergyLevel = (slot: TimeSlot, subtask: any) => {
    if (!subtask) return 'medium';
    
    const tags = subtask.tags || [];
    if (tags.includes('energy-high')) return 'high';
    if (tags.includes('energy-low')) return 'low';
    return 'medium';
  };

  const markSlotComplete = async (slotId: string, subtaskId?: string) => {
    if (subtaskId) {
      await supabase
        .from('subtasks')
        .update({ status: 'done' })
        .eq('id', subtaskId);
    }
    
    loadSchedule(); // Refresh
    onSlotUpdate?.(slotId, { completed: true });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Optimized Schedule
            <RotateCw className="h-4 w-4 animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading schedule...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Optimized Schedule
          <Badge variant="outline">{selectedDate}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {timeSlots.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No schedule found for {selectedDate}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use the AI Optimizer to create an optimized schedule
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {timeSlots.map((slot: any) => {
              const subtask = slot.subtasks;
              const task = subtask?.tasks;
              const duration = getSlotDuration(slot);
              const isCurrent = isCurrentSlot(slot);
              const isSlotUpcoming = isUpcoming(slot);
              const isSlotPast = isPast(slot);
              const energyLevel = getEnergyLevel(slot, subtask);

              return (
                <div 
                  key={slot.id}
                  className={`
                    p-3 rounded-lg border transition-all
                    ${isCurrent ? 'bg-primary/10 border-primary ring-2 ring-primary/20' : ''}
                    ${isSlotPast ? 'opacity-60' : ''}
                    ${isSlotUpcoming ? 'border-dashed' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {formatTime(slot.slot_start)} - {formatTime(slot.slot_end)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {duration}m
                      </Badge>
                      {energyLevel && (
                        <Badge 
                          variant={energyLevel === 'high' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {energyLevel} energy
                        </Badge>
                      )}
                    </div>
                    
                    {isCurrent && (
                      <Badge className="animate-pulse">
                        <Play className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>

                  {subtask ? (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{subtask.title}</p>
                          {task && (
                            <p className="text-xs text-muted-foreground">
                              {task.title} • Priority {task.priority} • {task.difficulty}
                            </p>
                          )}
                        </div>
                        
                        {subtask.status === 'done' ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Done
                          </Badge>
                        ) : isCurrent ? (
                          <Button 
                            size="sm" 
                            onClick={() => markSlotComplete(slot.id, subtask.id)}
                            className="h-8"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {slot.locked ? (
                        <>
                          <Pause className="h-4 w-4" />
                          <span className="text-sm">Blocked Time</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">Open Time Slot</span>
                        </>
                      )}
                    </div>
                  )}

                  {isCurrent && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-primary">
                        <Zap className="h-3 w-3" />
                        <span>Focus time - stay on task for best results</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {timeSlots.length > 0 && (
          <div className="pt-2 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Schedule optimized by AI for maximum efficiency and energy alignment
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};