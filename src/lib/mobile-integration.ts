import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// iPhone Calendar Integration
export class CalendarIntegration {
  static async requestPermissions() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Calendar integration only available on mobile devices');
      return false;
    }

    try {
      // Request calendar permissions
      const { value } = await (window as any).Calendar?.requestReadWritePermission();
      return value === 'granted';
    } catch (error) {
      console.error('Calendar permission error:', error);
      return false;
    }
  }

  static async addTaskToCalendar(task: any) {
    if (!Capacitor.isNativePlatform()) {
      console.log('Calendar integration only available on mobile devices');
      return;
    }

    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + (task.estimatedTime || 30) * 60000);

      const event = {
        title: task.title,
        notes: task.description || '',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        location: task.context || '',
        url: '',
        isAllDay: false
      };

      await (window as any).Calendar?.createEvent(event);
      console.log('Event added to calendar successfully');
    } catch (error) {
      console.error('Error adding event to calendar:', error);
    }
  }

  static async syncTasksToCalendar(tasks: any[]) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    for (const task of tasks) {
      if (task.status === 'pending' && task.due_date) {
        await this.addTaskToCalendar(task);
      }
    }
  }
}

// iCloud Storage Integration (using Capacitor Filesystem)
export class iCloudStorage {
  private static readonly STORAGE_KEY = 'sphere_grid_data';

  static async saveToiCloud(data: any) {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to localStorage for web
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return;
    }

    try {
      await Filesystem.writeFile({
        path: `${this.STORAGE_KEY}.json`,
        data: JSON.stringify(data, null, 2),
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      
      console.log('Data saved to iCloud Documents');
    } catch (error) {
      console.error('Error saving to iCloud:', error);
    }
  }

  static async loadFromiCloud(): Promise<any | null> {
    if (!Capacitor.isNativePlatform()) {
      // Fallback to localStorage for web
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    }

    try {
      const result = await Filesystem.readFile({
        path: `${this.STORAGE_KEY}.json`,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      
      return JSON.parse(result.data as string);
    } catch (error) {
      console.log('No existing iCloud data found or error reading:', error);
      return null;
    }
  }

  static async syncData(nodes: any[], tasks: any[], dayPlanSlots: any[] = []) {
    const syncData = {
      nodes,
      tasks,
      dayPlanSlots,
      lastSync: new Date().toISOString(),
      version: '1.0'
    };

    await this.saveToiCloud(syncData);
    console.log('Data synced to iCloud successfully');
  }

  static async restoreData() {
    const data = await this.loadFromiCloud();
    if (data) {
      console.log('Data restored from iCloud:', data);
      return data;
    }
    return null;
  }

  static async exportBackup() {
    const data = await this.loadFromiCloud();
    if (!data) return null;

    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
      exportType: 'full_backup'
    };

    if (Capacitor.isNativePlatform()) {
      try {
        const filename = `sphere_grid_backup_${new Date().toISOString().split('T')[0]}.json`;
        await Filesystem.writeFile({
          path: filename,
          data: JSON.stringify(exportData, null, 2),
          directory: Directory.Documents,
          encoding: Encoding.UTF8
        });
        console.log(`Backup exported as ${filename}`);
        return filename;
      } catch (error) {
        console.error('Export error:', error);
      }
    }

    // Web fallback - download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sphere_grid_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return a.download;
  }
}

// Offline-first data management
export class OfflineDataManager {
  private static readonly SYNC_STATUS_KEY = 'sync_status';

  static async markForSync(type: 'node' | 'task' | 'dayPlan', id: string, action: 'create' | 'update' | 'delete') {
    const pendingSync = this.getPendingSync();
    
    if (!pendingSync[type]) {
      pendingSync[type] = {};
    }
    
    pendingSync[type][id] = {
      action,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(pendingSync));
  }

  static getPendingSync() {
    const stored = localStorage.getItem(this.SYNC_STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  static clearPendingSync() {
    localStorage.removeItem(this.SYNC_STATUS_KEY);
  }

  static hasPendingChanges(): boolean {
    const pending = this.getPendingSync();
    return Object.keys(pending).length > 0;
  }
}