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


  useEffect(() => {
    ensureSession()
      .catch((error) => console.error('[Auth boot] failed:', error))
      .finally(() => setAuthReady(true));
  }, []);


  if (!authReady) {
    return <div className="p-4 text-sm">Booting…</div>;
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
