import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Download, Upload, RotateCcw } from 'lucide-react';
import { AppSettings, settingsManager } from '@/core/settings';
import { useToast } from '@/hooks/use-toast';

export const SettingsPanel = () => {
  const [settings, setSettings] = useState<AppSettings>(settingsManager.getSettings());
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = settingsManager.subscribe(setSettings);
    return unsubscribe;
  }, []);

  const updateSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    settingsManager.updateSetting(key, value);
    setHasChanges(true);
  };

  const handleExportSettings = () => {
    try {
      const settingsJson = settingsManager.exportSettings();
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pmg-settings.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Settings Exported",
        description: "Settings have been downloaded successfully."
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export settings.",
        variant: "destructive"
      });
    }
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const settingsJson = e.target?.result as string;
            const success = settingsManager.importSettings(settingsJson);
            
            if (success) {
              toast({
                title: "Settings Imported",
                description: "Settings have been imported successfully."
              });
              setHasChanges(false);
            } else {
              throw new Error('Invalid settings file');
            }
          } catch (error) {
            toast({
              title: "Import Failed",
              description: "Failed to import settings. Please check the file format.",
              variant: "destructive"
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetToDefaults = () => {
    settingsManager.resetToDefaults();
    setHasChanges(false);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to their default values."
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <CardTitle>Settings</CardTitle>
          {hasChanges && (
            <Badge variant="secondary" className="ml-2">
              Unsaved Changes
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportSettings}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportSettings}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* XP System Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">XP System</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dungeon Mode Bonus: {Math.round((settings.dungeonBonus - 1) * 100)}%</Label>
              <Slider
                value={[settings.dungeonBonus]}
                onValueChange={([value]) => updateSetting('dungeonBonus', value)}
                min={1}
                max={2}
                step={0.05}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Max Streak Bonus Days: {settings.streakCap}</Label>
              <Slider
                value={[settings.streakCap]}
                onValueChange={([value]) => updateSetting('streakCap', value)}
                min={1}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Efficiency Impact: {settings.efficiencySlope}x</Label>
              <Slider
                value={[settings.efficiencySlope]}
                onValueChange={([value]) => updateSetting('efficiencySlope', value)}
                min={0.1}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Timer & Focus Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Timer & Focus</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Min Focus Session: {settings.minFocusMinutes} min</Label>
              <Slider
                value={[settings.minFocusMinutes]}
                onValueChange={([value]) => updateSetting('minFocusMinutes', value)}
                min={1}
                max={60}
                step={1}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Idle Timeout: {Math.round(settings.idleTimeoutSec / 60)} min</Label>
              <Slider
                value={[settings.idleTimeoutSec]}
                onValueChange={([value]) => updateSetting('idleTimeoutSec', value)}
                min={60}
                max={1800}
                step={30}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tab Hidden Timeout: {settings.tabHiddenTimeoutSec}s</Label>
              <Slider
                value={[settings.tabHiddenTimeoutSec]}
                onValueChange={([value]) => updateSetting('tabHiddenTimeoutSec', value)}
                min={10}
                max={300}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* AI & Automation */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">AI & Automation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-suggestions">AI Task Suggestions</Label>
              <Switch
                id="ai-suggestions"
                checked={settings.aiSuggestionsEnabled}
                onCheckedChange={(checked) => updateSetting('aiSuggestionsEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="ai-analysis">AI Session Analysis</Label>
              <Switch
                id="ai-analysis"
                checked={settings.aiAnalysisEnabled}
                onCheckedChange={(checked) => updateSetting('aiAnalysisEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-tasks">Auto Task Generation</Label>
              <Switch
                id="auto-tasks"
                checked={settings.autoTaskGeneration}
                onCheckedChange={(checked) => updateSetting('autoTaskGeneration', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* UI & Notifications */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Interface & Notifications</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound">Sound Effects</Label>
                <Switch
                  id="sound"
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="animations">Level-up Animations</Label>
                <Switch
                  id="animations"
                  checked={settings.celebrationAnimations}
                  onCheckedChange={(checked) => updateSetting('celebrationAnimations', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="messages">Motivational Messages</Label>
                <Switch
                  id="messages"
                  checked={settings.motivationalMessages}
                  onCheckedChange={(checked) => updateSetting('motivationalMessages', checked)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value: 'dark' | 'light' | 'auto') => updateSetting('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="compact">Compact Mode</Label>
                <Switch
                  id="compact"
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="advanced-stats">Advanced Analytics</Label>
                <Switch
                  id="advanced-stats"
                  checked={settings.showAdvancedStats}
                  onCheckedChange={(checked) => updateSetting('showAdvancedStats', checked)}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Backup Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Data & Backup</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-export">Auto Export</Label>
              <Switch
                id="auto-export"
                checked={settings.autoExport}
                onCheckedChange={(checked) => updateSetting('autoExport', checked)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Export Frequency: {settings.exportFrequencyDays} days</Label>
              <Slider
                value={[settings.exportFrequencyDays]}
                onValueChange={([value]) => updateSetting('exportFrequencyDays', value)}
                min={1}
                max={30}
                step={1}
                className="w-full"
                disabled={!settings.autoExport}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};