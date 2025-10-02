import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SimpleDashboard from "./pages/SimpleDashboard";
import NotFound from "./pages/NotFound";
import { ensureSession } from '@/lib/ensureSession';

const queryClient = new QueryClient();

const App = () => {
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('[App] Starting authentication...');
        
        // Add timeout to prevent infinite hanging
        const authPromise = ensureSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timeout after 10 seconds')), 10000)
        );
        
        await Promise.race([authPromise, timeoutPromise]);
        console.log('[App] Authentication successful');
        setAuthReady(true);
      } catch (error) {
        console.error('[App] Authentication failed:', error);
        setAuthError(error instanceof Error ? error.message : 'Authentication failed');
        setAuthReady(true); // Still set to true to show the error UI
      }
    };

    initAuth();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-xl text-foreground font-semibold">Booting…</div>
          <div className="text-sm text-muted-foreground">Connecting to database...</div>
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md p-6 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3">
          <div className="font-semibold text-destructive text-lg">Authentication Error</div>
          <div className="text-destructive-foreground">{authError}</div>
          <div className="text-sm text-muted-foreground">
            Check browser console for more details
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
            <Routes>
              <Route path="/" element={<SimpleDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
  );
};

export default App;
