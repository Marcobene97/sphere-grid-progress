import { ReactNode, useEffect } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useXP } from '@/hooks/useXP';
import { calcLevel } from '@/core/xpEngine';
import { Button } from '@/components/ui/button';
import { Plus, Command, Grid3x3, Calendar, Play, Inbox, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommandPalette } from './CommandPalette';
import { AddSheet } from './AddSheet';

interface AppShellProps {
  children: ReactNode;
  currentView: 'grid' | 'planner' | 'sessions' | 'inbox' | 'review';
  onNavigate: (view: 'grid' | 'planner' | 'sessions' | 'inbox' | 'review') => void;
}

export function AppShell({ children, currentView, onNavigate }: AppShellProps) {
  const { isPaletteOpen, setIsPaletteOpen, setIsAddSheetOpen } = useAppStore();
  const { xp, loadXP } = useXP();
  const levelInfo = calcLevel(xp);

  useEffect(() => {
    loadXP();
  }, [loadXP]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(true);
      }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          setIsAddSheetOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsPaletteOpen, setIsAddSheetOpen]);

  const navItems = [
    { id: 'grid' as const, label: 'Grid', icon: Grid3x3 },
    { id: 'planner' as const, label: 'Planner', icon: Calendar },
    { id: 'sessions' as const, label: 'Sessions', icon: Play },
    { id: 'inbox' as const, label: 'Inbox', icon: Inbox },
    { id: 'review' as const, label: 'Review', icon: BarChart3 },
  ];

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Top Bar */}
      <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPaletteOpen(true)}
            className="gap-2"
          >
            <Command className="h-4 w-4" />
            <span className="text-xs text-muted-foreground">⌘K</span>
          </Button>
        </div>
        
        <div className="font-semibold">Sphere Grid Progress</div>
        
        <Button
          onClick={() => setIsAddSheetOpen(true)}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav */}
        <aside className="w-48 border-r bg-card p-2">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    currentView === item.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Right Rail - Context */}
        <aside className="w-64 border-l bg-card p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Progress</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level</span>
                <span className="font-semibold">{levelInfo.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total XP</span>
                <span className="font-semibold">{xp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To Next</span>
                <span className="font-semibold">{levelInfo.xpToNext}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <CommandPalette 
        open={isPaletteOpen} 
        onOpenChange={setIsPaletteOpen}
        onNavigate={onNavigate}
      />
      <AddSheet />
    </div>
  );
}
