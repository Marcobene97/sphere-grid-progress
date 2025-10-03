import { Battery, Sunrise, Moon, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function EnergyOptimizer() {
  const currentHour = new Date().getHours();
  
  const getEnergyLevel = () => {
    if (currentHour >= 9 && currentHour < 12) return { level: 'Peak', color: 'bg-green-500', icon: Zap };
    if (currentHour >= 14 && currentHour < 16) return { level: 'High', color: 'bg-blue-500', icon: Sunrise };
    if (currentHour >= 20 || currentHour < 7) return { level: 'Low', color: 'bg-purple-500', icon: Moon };
    return { level: 'Medium', color: 'bg-yellow-500', icon: Battery };
  };

  const energy = getEnergyLevel();
  const Icon = energy.icon;

  return (
    <Card className="border-yellow-200 dark:border-yellow-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Battery className="h-5 w-5 text-yellow-500" />
          <CardTitle>Energy Optimizer</CardTitle>
        </div>
        <CardDescription>
          Tracks your energy patterns and schedules tasks at optimal times
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${energy.color}`} />
            <span className="font-medium">Current Energy: {energy.level}</span>
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Recommended Activities:</div>
          {energy.level === 'Peak' && (
            <div className="space-y-1">
              <Badge variant="secondary">Deep Work</Badge>
              <Badge variant="secondary" className="ml-2">Complex Problem Solving</Badge>
              <p className="text-xs text-muted-foreground mt-2">Your best time for challenging tasks</p>
            </div>
          )}
          {energy.level === 'High' && (
            <div className="space-y-1">
              <Badge variant="secondary">Meetings</Badge>
              <Badge variant="secondary" className="ml-2">Collaboration</Badge>
              <p className="text-xs text-muted-foreground mt-2">Good for social and medium-effort work</p>
            </div>
          )}
          {energy.level === 'Medium' && (
            <div className="space-y-1">
              <Badge variant="secondary">Email</Badge>
              <Badge variant="secondary" className="ml-2">Light Tasks</Badge>
              <p className="text-xs text-muted-foreground mt-2">Save hard work for peak hours</p>
            </div>
          )}
          {energy.level === 'Low' && (
            <div className="space-y-1">
              <Badge variant="secondary">Rest</Badge>
              <Badge variant="secondary" className="ml-2">Planning</Badge>
              <p className="text-xs text-muted-foreground mt-2">Time to recharge for tomorrow</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
