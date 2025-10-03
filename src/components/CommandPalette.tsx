import { useEffect, useState } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Grid3x3, Calendar, Play, Inbox, BarChart3, Plus } from 'lucide-react';
import { useAppStore } from '@/hooks/useAppStore';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (view: 'grid' | 'planner' | 'sessions' | 'inbox' | 'review') => void;
}

export function CommandPalette({ open, onOpenChange, onNavigate }: CommandPaletteProps) {
  const { setIsAddSheetOpen } = useAppStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const commands = [
    {
      group: 'Navigation',
      items: [
        { label: 'Grid', icon: Grid3x3, action: () => onNavigate('grid') },
        { label: 'Planner', icon: Calendar, action: () => onNavigate('planner') },
        { label: 'Sessions', icon: Play, action: () => onNavigate('sessions') },
        { label: 'Inbox', icon: Inbox, action: () => onNavigate('inbox') },
        { label: 'Review', icon: BarChart3, action: () => onNavigate('review') },
      ],
    },
    {
      group: 'Actions',
      items: [
        { 
          label: 'New Task', 
          icon: Plus, 
          action: () => {
            onOpenChange(false);
            setIsAddSheetOpen(true);
          } 
        },
      ],
    },
  ];

  const handleSelect = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {commands.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.label}
                  onSelect={() => handleSelect(item.action)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
