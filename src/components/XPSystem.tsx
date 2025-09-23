import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, Zap, Trophy, Award } from 'lucide-react';
import { useXP } from '@/hooks/useXP';
import { levelFromXP } from '@/lib/game/score';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { awardTaskXP, awardSessionXP, syncXP } from '@/lib/xp-sync';

export const XPSystem: React.FC = () => {
  const { xp, loadXP, isLoading } = useXP();
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const { toast } = useToast();
  
  const levelInfo = levelFromXP(xp);
  
  useEffect(() => {
    loadXP();
    loadRecentXPEvents();
  }, []);

  const loadRecentXPEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('xp_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      setRecentEvents(data || []);
    } catch (error) {
      console.error('Failed to load XP events:', error);
    }
  };

  const handleRefresh = async () => {
    await syncXP();
    await loadRecentXPEvents();
    toast({
      title: "XP Synchronized",
      description: "Your experience points have been synced with database",
    });
  };

  const handleTestXP = async () => {
    const xpGained = await awardSessionXP({
      durationMin: 25,
      difficulty: 'intermediate',
      streakDays: 1
    });
    
    await loadRecentXPEvents();
    
    toast({
      title: `+${xpGained} XP Awarded!`,
      description: "Test work session completed",
    });
  };

  const xpInCurrentLevel = xp - levelInfo.current;
  const xpForNextLevel = levelInfo.next - levelInfo.current;
  const progressPercentage = xpForNextLevel > 0 ? (xpInCurrentLevel / xpForNextLevel) * 100 : 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-gaming-legendary" />
            Experience System
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Sync XP
            </Button>
            <Button variant="outline" size="sm" onClick={handleTestXP}>
              <Award className="h-4 w-4 mr-2" />
              Test +XP
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-gradient-to-r from-primary to-gaming-epic text-primary-foreground">
                Level {levelInfo.level}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {levelInfo.xpToNext > 0 ? `${levelInfo.xpToNext} XP to next level` : 'MAX LEVEL'}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-muted"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground drop-shadow-sm">
                {xpInCurrentLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>

        {/* Total XP */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-gaming-success/5 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gaming-legendary" />
            <span className="font-medium">Total Experience</span>
          </div>
          <span className="text-xl font-bold text-primary">{xp.toLocaleString()} XP</span>
        </div>

        {/* Recent XP Events */}
        {recentEvents.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Recent Activity</h4>
            <div className="space-y-1">
              {recentEvents.map((event, index) => (
                <div key={event.id || index} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-gaming-success" />
                    <span className="capitalize">{event.source.replace('_', ' ')}</span>
                  </div>
                  <Badge variant="outline" className="text-gaming-success">
                    +{event.amount} XP
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};