import { LineChart, TrendingUp, Clock, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function ProductivityInsights() {
  const insights = [
    { icon: Clock, text: 'Your peak productivity is 9-11 AM', type: 'success' },
    { icon: TrendingUp, text: '23% more productive this week', type: 'success' },
    { icon: Award, text: '5-day completion streak!', type: 'info' },
  ];

  return (
    <Card className="border-pink-200 dark:border-pink-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <LineChart className="h-5 w-5 text-pink-500" />
          <CardTitle>Productivity Insights</CardTitle>
        </div>
        <CardDescription>
          AI-analyzed patterns and personalized recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, idx) => {
          const Icon = insight.icon;
          return (
            <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
              <Icon className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm">{insight.text}</p>
              </div>
              <Badge variant={insight.type === 'success' ? 'default' : 'secondary'} className="text-xs">
                {insight.type === 'success' ? '✨' : '📊'}
              </Badge>
            </div>
          );
        })}

        <div className="mt-4 p-3 border border-dashed rounded-lg text-center">
          <div className="text-xs text-muted-foreground">
            💡 Try scheduling deep work tasks earlier in the day for best results
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
