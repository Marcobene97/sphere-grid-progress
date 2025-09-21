import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
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
      <div className="p-4 text-sm">
        <div>Booting…</div>
        <div className="text-xs text-gray-500 mt-2">Connecting to database...</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="p-4 text-sm bg-red-50 border border-red-200 rounded">
        <div className="font-semibold text-red-700">Authentication Error</div>
        <div className="text-red-600 mt-1">{authError}</div>
        <div className="text-xs text-red-500 mt-2">
          Check browser console for more details
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
  );
};

export default App;
