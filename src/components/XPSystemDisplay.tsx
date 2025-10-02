import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Zap, Trophy, Target, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface XPData {
  totalXP: number;
  level: number;
  xpForNextLevel: number;
  currentLevelXP: number;
  streak: number;
  rank: string;
}

export const XPSystemDisplay: React.FC = () => {
  const [xpData, setXpData] = useState<XPData>({
    totalXP: 0,
    level: 1,
    xpForNextLevel: 100,
    currentLevelXP: 0,
    streak: 0,
    rank: 'Novice'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadXPData();
    
    // Subscribe to real-time XP updates
    const channel = supabase
      .channel('xp-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'xp_events'
      }, (payload) => {
        console.log('XP Event:', payload);
        loadXPData();
        
        // Show XP gain notification
        toast({
          title: `+${payload.new.amount} XP! 🎉`,
          description: `${payload.new.source}`,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadXPData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get total XP from database function
      const { data: xpResult } = await supabase.rpc('get_user_total_xp');
      const totalXP = xpResult || 0;

      // Calculate level (simple: 100 XP per level)
      const level = Math.floor(totalXP / 100) + 1;
      const xpForCurrentLevel = (level - 1) * 100;
      const xpForNextLevel = level * 100;
      const currentLevelXP = totalXP - xpForCurrentLevel;

      // Get streak from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      // Determine rank based on level
      const ranks = ['Novice', 'Apprentice', 'Adept', 'Expert', 'Master', 'Grandmaster', 'Legend'];
      const rankIndex = Math.min(Math.floor(level / 5), ranks.length - 1);

      setXpData({
        totalXP,
        level,
        xpForNextLevel: xpForNextLevel - xpForCurrentLevel,
        currentLevelXP,
        streak: profile?.current_streak || 0,
        rank: ranks[rankIndex]
      });
    } catch (error) {
      console.error('Error loading XP data:', error);
    }
  };

  const progressPercent = (xpData.currentLevelXP / xpData.xpForNextLevel) * 100;

  return (
    <div className="space-y-4">
      {/* Main XP Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Level and Rank */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <span className="text-3xl font-bold">Level {xpData.level}</span>
                </div>
                <Badge variant="secondary" className="mt-1">
                  {xpData.rank}
                </Badge>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl font-bold text-primary">
                  <Zap className="h-5 w-5" />
                  {xpData.totalXP}
                </div>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {Math.round(xpData.currentLevelXP)} / {xpData.xpForNextLevel} XP
                </span>
                <span className="font-medium">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {xpData.xpForNextLevel - Math.round(xpData.currentLevelXP)} XP until Level {xpData.level + 1}
              </p>
            </div>

            {/* Streak */}
            {xpData.streak > 0 && (
              <div className="flex items-center justify-center gap-2 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="font-bold text-orange-500">
                  {xpData.streak} Day Streak! 🔥
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="p-3 text-center">
            <Target className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="text-lg font-bold">{xpData.level}</div>
            <p className="text-xs text-muted-foreground">Level</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <Zap className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
            <div className="text-lg font-bold">{xpData.totalXP}</div>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
            <div className="text-lg font-bold">{xpData.streak}</div>
            <p className="text-xs text-muted-foreground">Streak</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
