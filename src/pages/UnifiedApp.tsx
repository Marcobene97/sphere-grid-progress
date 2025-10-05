import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PlannerBoard } from '@/components/PlannerBoard';
import { InboxView } from '@/components/InboxView';
import { ReviewModal } from '@/components/ReviewModal';
import { useAppStore } from '@/hooks/useAppStore';

export default function UnifiedApp() {
  const [currentView, setCurrentView] = useState<'planner' | 'inbox' | 'review'>('planner');
  const { isReviewModalOpen, setIsReviewModalOpen } = useAppStore();

  const handleNavigate = (view: 'planner' | 'inbox' | 'review') => {
    if (view === 'review') {
      setIsReviewModalOpen(true);
    } else {
      setCurrentView(view);
    }
  };

  return (
    <>
      <AppShell currentView={currentView} onNavigate={handleNavigate}>
        {currentView === 'planner' && <PlannerBoard />}
        {currentView === 'inbox' && <InboxView />}
      </AppShell>

      <ReviewModal open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen} />
    </>
  );
}
