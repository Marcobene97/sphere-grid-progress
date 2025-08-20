import { User } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface XPBarProps {
  user: User;
  showRank?: boolean;
  className?: string;
}

export const XPBar = ({ user, showRank = true, className = '' }: XPBarProps) => {
  const xpInCurrentLevel = user.currentXP;
  const xpForCurrentLevel = user.currentXP + user.xpToNextLevel;
  const progressPercentage = xpForCurrentLevel > 0 ? (xpInCurrentLevel / xpForCurrentLevel) * 100 : 0;

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'SSS': return 'hsl(var(--gaming-legendary))';
      case 'SS': return 'hsl(280 100% 65%)';
      case 'S': return 'hsl(45 100% 65%)';
      case 'A': return 'hsl(var(--gaming-success))';
      case 'B': return 'hsl(var(--gaming-info))';
      case 'C': return 'hsl(var(--primary))';
      case 'D': return 'hsl(var(--secondary))';
      default: return 'hsl(var(--muted-foreground))';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Level {user.level}</span>
          {showRank && (
            <Badge 
              variant="outline" 
              className="text-xs font-bold glow"
              style={{ 
                borderColor: getRankColor(user.rank),
                color: getRankColor(user.rank)
              }}
            >
              {user.rank} Rank
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {user.xpToNextLevel > 0 ? `${user.xpToNextLevel} XP to next level` : 'MAX LEVEL'}
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={progressPercentage} 
          className="h-3 bg-gradient-to-r from-transparent to-primary/20"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-primary-foreground drop-shadow-sm">
            {xpInCurrentLevel.toLocaleString()} / {(xpInCurrentLevel + user.xpToNextLevel).toLocaleString()} XP
          </span>
        </div>
        
        {/* Glow effect for progress bar */}
        <div 
          className="absolute top-0 h-full bg-gradient-to-r from-primary/60 to-primary rounded-full opacity-60 blur-sm"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Total XP: {user.totalXP.toLocaleString()}</span>
        <span>Streak: {user.streaks.current} days</span>
      </div>
    </div>
  );
};