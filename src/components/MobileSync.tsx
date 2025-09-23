import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, 
  Cloud, 
  Smartphone, 
  Download, 
  Upload, 
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import { CalendarIntegration, iCloudStorage, OfflineDataManager } from '@/lib/mobile-integration';
import { useToast } from '@/hooks/use-toast';

interface MobileSyncProps {
  nodes: any[];
  tasks: any[];
  onDataRestore?: (data: any) => void;
}

export function MobileSync({ nodes, tasks, onDataRestore }: MobileSyncProps) {
  const [calendarEnabled, setCalendarEnabled] = useState(false);
  const [iCloudEnabled, setICloudEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for pending changes
    setPendingChanges(OfflineDataManager.hasPendingChanges());
    
    // Load last sync time
    const lastSyncTime = localStorage.getItem('last_icloud_sync');
    if (lastSyncTime) {
      setLastSync(lastSyncTime);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when data changes and iCloud is enabled
  useEffect(() => {
    if (iCloudEnabled && nodes.length > 0) {
      handleiCloudSync();
    }
  }, [nodes, tasks, iCloudEnabled]);

  const handleCalendarSync = async () => {
    try {
      await CalendarIntegration.syncTasksToCalendar(tasks);
      setCalendarEnabled(true);
      toast({
        title: "Calendar Synced!",
        description: "Your tasks have been added to iPhone Calendar",
      });
    } catch (error) {
      toast({
        title: "Calendar Sync Failed",
        description: "Unable to sync with iPhone Calendar",
        variant: "destructive",
      });
    }
  };

  const handleiCloudSync = async () => {
    try {
      await iCloudStorage.syncData(nodes, tasks);
      const now = new Date().toISOString();
      setLastSync(now);
      localStorage.setItem('last_icloud_sync', now);
      setPendingChanges(false);
      OfflineDataManager.clearPendingSync();
      
      toast({
        title: "iCloud Synced!",
        description: "Your data has been backed up to iCloud",
      });
    } catch (error) {
      toast({
        title: "iCloud Sync Failed",
        description: "Unable to sync with iCloud",
        variant: "destructive",
      });
    }
  };

  const handleRestoreFromiCloud = async () => {
    try {
      const data = await iCloudStorage.restoreData();
      if (data && onDataRestore) {
        onDataRestore(data);
        toast({
          title: "Data Restored!",
          description: `Restored ${data.nodes?.length || 0} nodes and ${data.tasks?.length || 0} tasks from iCloud`,
        });
      } else {
        toast({
          title: "No Data Found",
          description: "No backup data found in iCloud",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Restore Failed",
        description: "Unable to restore data from iCloud",
        variant: "destructive",
      });
    }
  };

  const handleExportBackup = async () => {
    try {
      const filename = await iCloudStorage.exportBackup();
      if (filename) {
        toast({
          title: "Backup Exported!",
          description: `Backup saved as ${filename}`,
        });
      }
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export backup",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Mobile Integration
          </CardTitle>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="default" className="gap-1">
                <Wifi className="h-3 w-3" />
                Online
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {pendingChanges && (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Pending Sync
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* iPhone Calendar Integration */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <div className="font-medium">iPhone Calendar</div>
              <div className="text-sm text-muted-foreground">
                Sync tasks to your iPhone calendar
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={calendarEnabled}
              onCheckedChange={setCalendarEnabled}
            />
            {calendarEnabled && (
              <Button size="sm" onClick={handleCalendarSync}>
                Sync Now
              </Button>
            )}
          </div>
        </div>

        {/* iCloud Storage */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Cloud className="h-5 w-5 text-blue-500" />
            <div>
              <div className="font-medium">iCloud Storage</div>
              <div className="text-sm text-muted-foreground">
                Auto-backup your progress to iCloud
                {lastSync && (
                  <div className="text-xs">
                    Last sync: {new Date(lastSync).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={iCloudEnabled}
              onCheckedChange={setICloudEnabled}
            />
            {iCloudEnabled && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleiCloudSync}
            disabled={!iCloudEnabled}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Backup Now
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRestoreFromiCloud}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Restore
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportBackup}
            className="gap-2 col-span-2"
          >
            <Download className="h-4 w-4" />
            Export Full Backup
          </Button>
        </div>

        {/* Offline Mode Info */}
        {!isOnline && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">Offline Mode</span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Changes will sync to iCloud when connection is restored
            </p>
          </div>
        )}

        {/* Data Summary */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {nodes.length} skill nodes • {tasks.length} tasks • No server required
        </div>
        
      </CardContent>
    </Card>
  );
}