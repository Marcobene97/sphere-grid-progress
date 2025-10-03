import { Coffee, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const breakIdeas = [
  { type: 'Micro', duration: '5 min', activity: 'Stretch at your desk', emoji: '🧘' },
  { type: 'Short', duration: '10 min', activity: 'Walk outside for fresh air', emoji: '🚶' },
  { type: 'Power', duration: '15 min', activity: 'Power nap or meditation', emoji: '😴' },
  { type: 'Active', duration: '20 min', activity: 'Quick exercise or yoga', emoji: '💪' },
  { type: 'Social', duration: '15 min', activity: 'Chat with a friend', emoji: '💬' },
  { type: 'Creative', duration: '10 min', activity: 'Doodle or journaling', emoji: '🎨' },
];

export function SmartBreakGenerator() {
  const [currentBreak, setCurrentBreak] = useState(breakIdeas[0]);
  const { toast } = useToast();

  const generateBreak = () => {
    const randomBreak = breakIdeas[Math.floor(Math.random() * breakIdeas.length)];
    setCurrentBreak(randomBreak);
    toast({
      title: `${randomBreak.emoji} Time for a ${randomBreak.type} Break!`,
      description: randomBreak.activity,
    });
  };

  return (
    <Card className="border-orange-200 dark:border-orange-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Coffee className="h-5 w-5 text-orange-500" />
          <CardTitle>Smart Break Generator</CardTitle>
        </div>
        <CardDescription>
          AI-powered break suggestions to recharge your energy and focus
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg text-center">
          <div className="text-4xl mb-2">{currentBreak.emoji}</div>
          <div className="font-semibold">{currentBreak.type} Break</div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
            <Clock className="h-3 w-3" />
            {currentBreak.duration}
          </div>
          <div className="text-sm mt-2">{currentBreak.activity}</div>
        </div>
        
        <Button onClick={generateBreak} className="w-full" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Suggest New Break
        </Button>
      </CardContent>
    </Card>
  );
}
