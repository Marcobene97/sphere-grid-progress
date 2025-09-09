export interface AppSettings {
  // XP System
  dungeonBonus: number; // Multiplier for dungeon mode (default: 1.25)
  streakCap: number; // Maximum streak bonus days (default: 10)
  efficiencySlope: number; // How much efficiency affects XP (default: 1.0)
  
  // Timer & Focus
  minFocusMinutes: number; // Minimum session for focus bonus (default: 10)
  idleTimeoutSec: number; // Idle detection timeout (default: 300)
  tabHiddenTimeoutSec: number; // Auto-pause when tab hidden (default: 60)
  
  // AI & Automation
  aiSuggestionsEnabled: boolean; // Enable AI task suggestions (default: true)
  aiAnalysisEnabled: boolean; // Enable AI session analysis (default: true)
  autoTaskGeneration: boolean; // Auto-generate tasks when low (default: false)
  
  // Notifications & UI
  soundEnabled: boolean; // Enable sound effects (default: true)
  celebrationAnimations: boolean; // Enable level-up animations (default: true)
  motivationalMessages: boolean; // Show motivational messages (default: true)
  
  // Data & Backup
  autoExport: boolean; // Auto-export weekly (default: true)
  exportFrequencyDays: number; // How often to export (default: 7)
  
  // Theme & Display
  theme: 'dark' | 'light' | 'auto'; // Theme preference (default: dark)
  compactMode: boolean; // Compact UI mode (default: false)
  showAdvancedStats: boolean; // Show detailed analytics (default: false)
}

export const DEFAULT_SETTINGS: AppSettings = {
  // XP System
  dungeonBonus: 1.25,
  streakCap: 10,
  efficiencySlope: 1.0,
  
  // Timer & Focus  
  minFocusMinutes: 10,
  idleTimeoutSec: 300,
  tabHiddenTimeoutSec: 60,
  
  // AI & Automation
  aiSuggestionsEnabled: true,
  aiAnalysisEnabled: true,
  autoTaskGeneration: false,
  
  // Notifications & UI
  soundEnabled: true,
  celebrationAnimations: true,
  motivationalMessages: true,
  
  // Data & Backup
  autoExport: true,
  exportFrequencyDays: 7,
  
  // Theme & Display
  theme: 'dark',
  compactMode: false,
  showAdvancedStats: false
};

export class SettingsManager {
  private static STORAGE_KEY = 'pmg_settings';
  private settings: AppSettings;
  private listeners: ((settings: AppSettings) => void)[] = [];

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(SettingsManager.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(
        SettingsManager.STORAGE_KEY, 
        JSON.stringify(this.settings)
      );
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  updateSetting<K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): void {
    this.settings[key] = value;
    this.saveSettings();
  }

  updateSettings(updates: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
  }

  resetToDefaults(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }

  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(settingsJson: string): boolean {
    try {
      const imported = JSON.parse(settingsJson);
      const validated = this.validateSettings(imported);
      this.settings = validated;
      this.saveSettings();
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  private validateSettings(settings: any): AppSettings {
    const validated: AppSettings = { ...DEFAULT_SETTINGS };
    
    // Validate each setting with type checking and bounds
    if (typeof settings.dungeonBonus === 'number' && settings.dungeonBonus >= 1 && settings.dungeonBonus <= 3) {
      validated.dungeonBonus = settings.dungeonBonus;
    }
    
    if (typeof settings.streakCap === 'number' && settings.streakCap >= 1 && settings.streakCap <= 100) {
      validated.streakCap = settings.streakCap;
    }
    
    if (typeof settings.efficiencySlope === 'number' && settings.efficiencySlope >= 0.1 && settings.efficiencySlope <= 2.0) {
      validated.efficiencySlope = settings.efficiencySlope;
    }
    
    if (typeof settings.minFocusMinutes === 'number' && settings.minFocusMinutes >= 1 && settings.minFocusMinutes <= 60) {
      validated.minFocusMinutes = settings.minFocusMinutes;
    }
    
    if (typeof settings.idleTimeoutSec === 'number' && settings.idleTimeoutSec >= 60 && settings.idleTimeoutSec <= 1800) {
      validated.idleTimeoutSec = settings.idleTimeoutSec;
    }
    
    if (typeof settings.tabHiddenTimeoutSec === 'number' && settings.tabHiddenTimeoutSec >= 10 && settings.tabHiddenTimeoutSec <= 300) {
      validated.tabHiddenTimeoutSec = settings.tabHiddenTimeoutSec;
    }
    
    // Boolean validations
    const booleanKeys: (keyof AppSettings)[] = [
      'aiSuggestionsEnabled', 'aiAnalysisEnabled', 'autoTaskGeneration',
      'soundEnabled', 'celebrationAnimations', 'motivationalMessages',
      'autoExport', 'compactMode', 'showAdvancedStats'
    ];
    
    booleanKeys.forEach(key => {
      if (typeof settings[key] === 'boolean') {
        (validated as any)[key] = settings[key];
      }
    });
    
    if (typeof settings.exportFrequencyDays === 'number' && 
        settings.exportFrequencyDays >= 1 && settings.exportFrequencyDays <= 30) {
      validated.exportFrequencyDays = settings.exportFrequencyDays;
    }
    
    if (['dark', 'light', 'auto'].includes(settings.theme)) {
      validated.theme = settings.theme;
    }
    
    return validated;
  }

  subscribe(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Singleton instance
export const settingsManager = new SettingsManager();