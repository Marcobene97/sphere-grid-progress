import { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Eye } from 'lucide-react';

interface PillarsProgressProps {
  user: User;
}

export const PillarsProgress = ({ user }: PillarsProgressProps) => {
  const pillars = [
    {
      key: 'resilience' as const,
      title: 'Resilience',
      description: 'Bouncing back from setbacks',
      icon: Shield,
      value: user.pillars.resilience,
      color: 'hsl(var(--gaming-success))',
      maxValue: 100,
    },
    {
      key: 'consistency' as const,
      title: 'Consistency',
      description: 'Daily habit mastery',
      icon: Zap,
      value: user.pillars.consistency,
      color: 'hsl(var(--gaming-warning))',
      maxValue: 100,
    },
    {
      key: 'focus' as const,
      title: 'Focus',
      description: 'Deep work concentration',
      icon: Eye,
      value: user.pillars.focus,
      color: 'hsl(var(--gaming-info))',
      maxValue: 100,
    },
  ];

  const totalPillarProgress = pillars.reduce((sum, pillar) => sum + pillar.value, 0);
  const maxTotalProgress = pillars.reduce((sum, pillar) => sum + pillar.maxValue, 0);
  const overallProgress = (totalPillarProgress / maxTotalProgress) * 100;

  const getPillarLevel = (value: number) => {
    if (value >= 80) return { level: 'Master', color: 'hsl(var(--gaming-legendary))' };
    if (value >= 60) return { level: 'Expert', color: 'hsl(var(--gaming-success))' };
    if (value >= 40) return { level: 'Advanced', color: 'hsl(var(--gaming-warning))' };
    if (value >= 20) return { level: 'Intermediate', color: 'hsl(var(--gaming-info))' };
    return { level: 'Novice', color: 'hsl(var(--muted-foreground))' };
  };

  return (
    <Card className="bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Shield className="w-5 h-5 text-gaming-success" />
            <Zap className="w-5 h-5 text-gaming-warning" />
            <Eye className="w-5 h-5 text-gaming-info" />
          </div>
          Three Pillars of Mastery
        </CardTitle>
        <CardDescription>
          Your core progression stats • Overall Progress: {overallProgress.toFixed(0)}%
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            const pillarLevel = getPillarLevel(pillar.value);
            const progress = (pillar.value / pillar.maxValue) * 100;

            return (
              <div 
                key={pillar.key}
                className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-transparent to-primary/5 hover:to-primary/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon 
                      className="w-5 h-5" 
                      style={{ color: pillar.color }}
                    />
                    <span className="font-semibold text-sm">{pillar.title}</span>
                  </div>
                  <Badge 
                    variant="outline"
                    className="text-xs"
                    style={{ 
                      borderColor: pillarLevel.color,
                      color: pillarLevel.color
                    }}
                  >
                    {pillarLevel.level}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {pillar.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{pillar.value}</span>
                    <span className="text-xs text-muted-foreground">
                      / {pillar.maxValue}
                    </span>
                  </div>
                  
                  <div className="relative">
                    <Progress 
                      value={progress} 
                      className="h-2"
                    />
                    <div 
                      className="absolute top-0 h-full rounded-full opacity-60 blur-sm"
                      style={{ 
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, ${pillar.color}60, ${pillar.color})`
                      }}
                    />
                  </div>
                </div>
                
                {/* Visual indicator for high values */}
                {pillar.value >= 60 && (
                  <div className="flex justify-center">
                    <div 
                      className="w-2 h-2 rounded-full glow"
                      style={{ backgroundColor: pillar.color }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Overall Progress Bar */}
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Combined Mastery</span>
            <span className="text-xs text-muted-foreground">
              {totalPillarProgress} / {maxTotalProgress} points
            </span>
          </div>
          <Progress value={overallProgress} className="h-3 bg-gradient-to-r from-transparent to-primary/20" />
        </div>
      </CardContent>
    </Card>
  );
};