import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { dataLayer } from '@/lib/supabase-data';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SettingsState {
  dailyXPGoal: number;
  workSessionLength: number;
  reminderTime: string;
  soundEnabled: boolean;
  theme: 'dark' | 'light';
  dungeonBonus: boolean;
  streakCap: number;
  minFocusMinutes: number;
  idleTimeout: number;
  efficiencySlope: number;
}

const defaultSettings: SettingsState = {
  dailyXPGoal: 200,
  workSessionLength: 25,
  reminderTime: '09:00',
  soundEnabled: true,
  theme: 'dark',
  dungeonBonus: false,
  streakCap: 30,
  minFocusMinutes: 5,
  idleTimeout: 300,
  efficiencySlope: 1.20
};

export function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const userSettings = await dataLayer.getUserSettings(session.user.id);
          if (userSettings) {
            setSettings(prev => ({ ...prev, ...userSettings }));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [toast]);

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      await dataLayer.updateUserSettings(user.id, settings);
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "All settings have been reset to defaults",
    });
  };

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please sign in to access settings</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Customize your productivity experience</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic preferences for your productivity system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyGoal">Daily XP Goal</Label>
                <Input
                  id="dailyGoal"
                  type="number"
                  value={settings.dailyXPGoal}
                  onChange={(e) => updateSetting('dailyXPGoal', parseInt(e.target.value) || 200)}
                  min="50"
                  max="1000"
                />
                <p className="text-xs text-muted-foreground">Target XP to earn each day</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionLength">Work Session Length (minutes)</Label>
                <Input
                  id="sessionLength"
                  type="number"
                  value={settings.workSessionLength}
                  onChange={(e) => updateSetting('workSessionLength', parseInt(e.target.value) || 25)}
                  min="10"
                  max="120"
                />
                <p className="text-xs text-muted-foreground">Default Pomodoro session length</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reminderTime">Daily Reminder Time</Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={settings.reminderTime}
                  onChange={(e) => updateSetting('reminderTime', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">When to send daily reminders</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value: 'dark' | 'light') => updateSetting('theme', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound">Sound Effects</Label>
                <p className="text-xs text-muted-foreground">Play sounds for notifications and achievements</p>
              </div>
              <Switch
                id="sound"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* XP System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>XP System Configuration</CardTitle>
            <CardDescription>Fine-tune how experience points are calculated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="streakCap">Maximum Streak Bonus</Label>
                <Input
                  id="streakCap"
                  type="number"
                  value={settings.streakCap}
                  onChange={(e) => updateSetting('streakCap', parseInt(e.target.value) || 30)}
                  min="7"
                  max="365"
                />
                <p className="text-xs text-muted-foreground">Days at which streak bonus caps out</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minFocus">Minimum Focus Minutes</Label>
                <Input
                  id="minFocus"
                  type="number"
                  value={settings.minFocusMinutes}
                  onChange={(e) => updateSetting('minFocusMinutes', parseInt(e.target.value) || 5)}
                  min="1"
                  max="30"
                />
                <p className="text-xs text-muted-foreground">Minimum session time to earn XP</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idleTimeout">Idle Timeout (seconds)</Label>
                <Input
                  id="idleTimeout"
                  type="number"
                  value={settings.idleTimeout}
                  onChange={(e) => updateSetting('idleTimeout', parseInt(e.target.value) || 300)}
                  min="60"
                  max="1800"
                />
                <p className="text-xs text-muted-foreground">Auto-pause sessions after inactivity</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="efficiency">Efficiency Slope</Label>
                <Input
                  id="efficiency"
                  type="number"
                  step="0.01"
                  value={settings.efficiencySlope}
                  onChange={(e) => updateSetting('efficiencySlope', parseFloat(e.target.value) || 1.20)}
                  min="1.00"
                  max="2.00"
                />
                <p className="text-xs text-muted-foreground">XP multiplier for time efficiency</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dungeon">Dungeon Mode</Label>
                <p className="text-xs text-muted-foreground">
                  +25% XP bonus but no streak protection 
                  <Badge variant="secondary" className="ml-2">Hardcore</Badge>
                </p>
              </div>
              <Switch
                id="dungeon"
                checked={settings.dungeonBonus}
                onCheckedChange={(checked) => updateSetting('dungeonBonus', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 justify-end">
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset to Defaults
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}