import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Trophy, Zap, Target } from 'lucide-react';

interface Reward {
  id: string;
  type: 'xp' | 'level_up' | 'rank_up' | 'streak' | 'achievement';
  title: string;
  description: string;
  value: number;
  icon?: React.ReactNode;
  color: string;
}

interface RewardNotificationProps {
  rewards: Reward[];
  onComplete: () => void;
}

export const RewardNotification = ({ rewards, onComplete }: RewardNotificationProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (rewards.length > 0) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        if (currentIndex < rewards.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setIsVisible(false);
          setTimeout(onComplete, 300);
        }
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [currentIndex, rewards.length, onComplete]);

  if (rewards.length === 0 || !isVisible) return null;

  const currentReward = rewards[currentIndex];

  const getIcon = (type: string) => {
    switch (type) {
      case 'xp':
        return <Sparkles className="w-6 h-6" />;
      case 'level_up':
        return <Zap className="w-6 h-6" />;
      case 'rank_up':
        return <Trophy className="w-6 h-6" />;
      case 'streak':
        return <Target className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const getAnimation = (type: string) => {
    switch (type) {
      case 'level_up':
        return 'animate-pulse';
      case 'rank_up':
        return 'animate-bounce';
      default:
        return 'animate-pulse';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className={`
        relative overflow-hidden border-2 shadow-2xl max-w-md mx-4
        ${currentReward.color === 'gold' ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900' : ''}
        ${currentReward.color === 'blue' ? 'border-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900' : ''}
        ${currentReward.color === 'purple' ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900' : ''}
        ${currentReward.color === 'green' ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900' : ''}
        transform transition-all duration-500 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}>
        {/* Animated background sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-1 h-1 bg-white rounded-full animate-ping`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>

        <CardContent className="p-6 text-center relative">
          <div className={`mb-4 flex justify-center ${getAnimation(currentReward.type)}`}>
            <div className={`
              p-4 rounded-full shadow-lg
              ${currentReward.color === 'gold' ? 'bg-yellow-200 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200' : ''}
              ${currentReward.color === 'blue' ? 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200' : ''}
              ${currentReward.color === 'purple' ? 'bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-200' : ''}
              ${currentReward.color === 'green' ? 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-200' : ''}
            `}>
              {currentReward.icon || getIcon(currentReward.type)}
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-2">{currentReward.title}</h3>
          <p className="text-muted-foreground mb-4">{currentReward.description}</p>
          
          <Badge 
            variant="secondary" 
            className={`
              text-lg px-4 py-2 font-bold
              ${currentReward.color === 'gold' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' : ''}
              ${currentReward.color === 'blue' ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200' : ''}
              ${currentReward.color === 'purple' ? 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200' : ''}
              ${currentReward.color === 'green' ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' : ''}
            `}
          >
            {currentReward.type === 'xp' && `+${currentReward.value} XP`}
            {currentReward.type === 'level_up' && `Level ${currentReward.value}!`}
            {currentReward.type === 'rank_up' && `Rank ${currentReward.value}!`}
            {currentReward.type === 'streak' && `${currentReward.value} Day Streak!`}
          </Badge>

          {rewards.length > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {rewards.map((_, index) => (
                <div
                  key={index}
                  className={`
                    w-2 h-2 rounded-full transition-colors
                    ${index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'}
                  `}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};