export interface TimerGuardConfig {
  idleTimeoutMs: number; // Default: 5 minutes
  tabHiddenTimeoutMs: number; // Default: 60 seconds  
  minFocusChunkMs: number; // Default: 10 minutes
  idleCheckIntervalMs: number; // Default: 30 seconds
}

export const DEFAULT_TIMER_CONFIG: TimerGuardConfig = {
  idleTimeoutMs: 5 * 60 * 1000, // 5 minutes
  tabHiddenTimeoutMs: 60 * 1000, // 60 seconds
  minFocusChunkMs: 10 * 60 * 1000, // 10 minutes
  idleCheckIntervalMs: 30 * 1000 // 30 seconds
};

export type IdleReason = 'user_idle' | 'tab_hidden' | 'manual_pause';

export interface TimerGuardCallbacks {
  onIdleDetected: (reason: IdleReason) => void;
  onIdleConfirmed: (reason: IdleReason) => void;
  onIdleResolved: () => void;
  onAutoPause: (reason: IdleReason) => void;
}

export class TimerGuard {
  private config: TimerGuardConfig;
  private callbacks: TimerGuardCallbacks;
  private isActive = false;
  private lastActivity = Date.now();
  private idleCheckInterval?: NodeJS.Timeout;
  private visibilityHandler?: () => void;
  private activityHandlers: (() => void)[] = [];
  private tabHiddenTime?: number;
  private idlePromptTimeout?: NodeJS.Timeout;

  constructor(config: Partial<TimerGuardConfig> = {}, callbacks: TimerGuardCallbacks) {
    this.config = { ...DEFAULT_TIMER_CONFIG, ...config };
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Activity detection
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const activityHandler = () => {
      this.lastActivity = Date.now();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, activityHandler, true);
      this.activityHandlers.push(() => {
        document.removeEventListener(event, activityHandler, true);
      });
    });

    // Visibility change detection
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.tabHiddenTime = Date.now();
      } else {
        if (this.tabHiddenTime && this.isActive) {
          const hiddenDuration = Date.now() - this.tabHiddenTime;
          if (hiddenDuration > this.config.tabHiddenTimeoutMs) {
            this.callbacks.onAutoPause('tab_hidden');
          }
        }
        this.tabHiddenTime = undefined;
        this.lastActivity = Date.now();
      }
    };
    
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastActivity = Date.now();
    this.startIdleCheck();
  }

  stop(): void {
    this.isActive = false;
    this.stopIdleCheck();
    if (this.idlePromptTimeout) {
      clearTimeout(this.idlePromptTimeout);
      this.idlePromptTimeout = undefined;
    }
  }

  pause(): void {
    this.isActive = false;
    this.stopIdleCheck();
  }

  resume(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastActivity = Date.now();
    this.startIdleCheck();
  }

  private startIdleCheck(): void {
    if (this.idleCheckInterval) return;
    
    this.idleCheckInterval = setInterval(() => {
      if (!this.isActive) return;
      
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivity;
      
      // Check for tab hidden auto-pause
      if (document.hidden && this.tabHiddenTime) {
        const hiddenDuration = now - this.tabHiddenTime;
        if (hiddenDuration > this.config.tabHiddenTimeoutMs) {
          this.callbacks.onAutoPause('tab_hidden');
          return;
        }
      }
      
      // Check for user idle
      if (timeSinceActivity > this.config.idleTimeoutMs) {
        this.handleIdleDetection();
      }
    }, this.config.idleCheckIntervalMs);
  }

  private stopIdleCheck(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = undefined;
    }
  }

  private handleIdleDetection(): void {
    this.callbacks.onIdleDetected('user_idle');
    
    // Give user 30 seconds to respond
    this.idlePromptTimeout = setTimeout(() => {
      this.callbacks.onAutoPause('user_idle');
    }, 30 * 1000);
  }

  confirmActive(): void {
    this.lastActivity = Date.now();
    if (this.idlePromptTimeout) {
      clearTimeout(this.idlePromptTimeout);
      this.idlePromptTimeout = undefined;
    }
    this.callbacks.onIdleResolved();
  }

  getTimeSinceActivity(): number {
    return Date.now() - this.lastActivity;
  }

  isQualifiedFocusSession(sessionDurationMs: number): boolean {
    return sessionDurationMs >= this.config.minFocusChunkMs;
  }

  destroy(): void {
    this.stop();
    
    // Remove event listeners
    this.activityHandlers.forEach(removeHandler => removeHandler());
    this.activityHandlers = [];
    
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
  }
}

// Singleton instance for global timer management
let globalTimerGuard: TimerGuard | null = null;

export const createTimerGuard = (
  config?: Partial<TimerGuardConfig>, 
  callbacks?: TimerGuardCallbacks
): TimerGuard => {
  if (globalTimerGuard) {
    globalTimerGuard.destroy();
  }
  
  if (!callbacks) {
    throw new Error('TimerGuard callbacks are required');
  }
  
  globalTimerGuard = new TimerGuard(config, callbacks);
  return globalTimerGuard;
};

export const getTimerGuard = (): TimerGuard | null => globalTimerGuard;