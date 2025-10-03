import { Shield, Clock, Focus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export function FocusCoach() {
  const [isActive, setIsActive] = useState(false);

  return (
    <Card className="border-blue-200 dark:border-blue-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <CardTitle>Focus Coach</CardTitle>
        </div>
        <CardDescription>
          Protects your deep work time from distractions and interruptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Focus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isActive ? 'Focus Mode: ON' : 'Ready to protect your time'}
            </span>
          </div>
        </div>
        <Button 
          onClick={() => setIsActive(!isActive)} 
          variant={isActive ? 'destructive' : 'default'}
          className="w-full"
        >
          {isActive ? 'End Focus Session' : 'Start Focus Mode'}
        </Button>
        {isActive && (
          <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
            <Clock className="h-3 w-3 inline mr-1" />
            Notifications silenced • Calendar blocked • AI monitoring
          </div>
        )}
      </CardContent>
    </Card>
  );
}
