import { ToggleLeft, Briefcase, Home, Code, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const contexts = [
  { name: 'Work Mode', icon: Briefcase, color: 'text-blue-500' },
  { name: 'Creative Mode', icon: Palette, color: 'text-purple-500' },
  { name: 'Deep Focus', icon: Code, color: 'text-green-500' },
  { name: 'Personal Time', icon: Home, color: 'text-orange-500' },
];

export function ContextSwitcher() {
  const [activeContext, setActiveContext] = useState(0);
  const CurrentIcon = contexts[activeContext].icon;

  return (
    <Card className="border-cyan-200 dark:border-cyan-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ToggleLeft className="h-5 w-5 text-cyan-500" />
          <CardTitle>Context Switcher</CardTitle>
        </div>
        <CardDescription>
          Seamlessly transitions your workspace between different work modes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg text-center">
          <CurrentIcon className={`h-8 w-8 mx-auto mb-2 ${contexts[activeContext].color}`} />
          <div className="font-semibold">{contexts[activeContext].name}</div>
          <div className="text-xs text-muted-foreground mt-1">Active Context</div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {contexts.map((context, idx) => {
            const Icon = context.icon;
            return (
              <Button
                key={context.name}
                variant={activeContext === idx ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveContext(idx)}
                className="justify-start"
              >
                <Icon className={`h-4 w-4 mr-2 ${context.color}`} />
                <span className="text-xs">{context.name}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
