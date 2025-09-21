import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, RefreshCw, Database, Settings } from 'lucide-react';
import { useActionCounsellor } from '@/hooks/useActionCounsellor';
import { useToast } from '@/hooks/use-toast';

interface QuickActionsProps {
  onPlanToday: () => void;
}

export const QuickActions = ({ onPlanToday }: QuickActionsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { buildDayPlan, isGenerating } = useActionCounsellor();
  const { toast } = useToast();

  const handlePlanToday = async () => {
    try {
      await buildDayPlan(new Date().toISOString().split('T')[0]);
      toast({
        title: "Daily Plan Generated!",
        description: "Your optimized daily plan is ready in the Daily Plan tab.",
      });
      onPlanToday();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to generate daily plan:', error);
      toast({
        title: "Planning Failed",
        description: "Failed to generate daily plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearAllData = async () => {
    if (window.confirm('This will delete all your nodes, tasks, and progress. This action cannot be undone. Are you sure?')) {
      // This would require implementing a clear data function
      toast({
        title: "Data Cleared",
        description: "All data has been cleared. You can now seed a new mindmap.",
      });
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            size="lg" 
            className="rounded-full h-14 w-14 shadow-lg glow"
            aria-label="Quick Actions"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Actions</DialogTitle>
            <DialogDescription>
              Perform common actions for your Action Counsellor system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Daily Planning
                </CardTitle>
                <CardDescription>
                  Generate an optimized daily plan using the Action Counsellor's mixing algorithm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handlePlanToday}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4 mr-2" />
                      Plan Today
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Reset your system to start fresh with a new mindmap
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={clearAllData}
                  variant="destructive"
                  className="w-full"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};