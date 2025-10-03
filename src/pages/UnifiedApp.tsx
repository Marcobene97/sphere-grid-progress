import { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { GridPanel } from '@/components/GridPanel';
import { PlannerBoard } from '@/components/PlannerBoard';
import { SessionView } from '@/components/SessionView';
import { InboxView } from '@/components/InboxView';
import { ReviewModal } from '@/components/ReviewModal';
import { useAppStore } from '@/hooks/useAppStore';

export default function UnifiedApp() {
  const [currentView, setCurrentView] = useState<'grid' | 'planner' | 'sessions' | 'inbox' | 'review'>('planner');
  const { isReviewModalOpen, setIsReviewModalOpen } = useAppStore();

  useEffect(() => {
    // Check hash for session deep-link
    const hash = window.location.hash;
    if (hash.startsWith('#session-')) {
      setCurrentView('sessions');
    }
  }, []);

  const handleNavigate = (view: 'grid' | 'planner' | 'sessions' | 'inbox' | 'review') => {
    if (view === 'review') {
      setIsReviewModalOpen(true);
    } else {
      setCurrentView(view);
    }
  };

  return (
    <>
      <AppShell currentView={currentView} onNavigate={handleNavigate}>
        {currentView === 'grid' && <GridPanel />}
        {currentView === 'planner' && <PlannerBoard />}
        {currentView === 'sessions' && <SessionView />}
        {currentView === 'inbox' && <InboxView />}
      </AppShell>

      <ReviewModal open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen} />
    </>
  );
}
