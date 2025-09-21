import { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ensureSession } from '@/lib/ensureSession';
import { DebugBanner } from '@/components/dev/DebugBanner';
import { envCheck, supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

const App = () => {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const viteUrl = (import.meta as any)?.env?.VITE_SUPABASE_URL;
    const viteKey = (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY;
    const nextUrl = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : undefined;
    const nextKey = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

    console.info('ENV CHECK', {
      hasUrl: Boolean(viteUrl || nextUrl),
      hasKey: Boolean(viteKey || nextKey),
      status: envCheck(),
    });
  }, []);

  useEffect(() => {
    ensureSession()
      .catch((error) => console.error('[Auth boot] failed:', error))
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (!authReady) return;

    (async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('id').limit(1);
        console.info('SUPABASE PROBE', { rows: data?.length ?? 0, error });
      } catch (probeError) {
        console.error('SUPABASE PROBE CRASH', probeError);
      }
    })();
  }, [authReady]);

  if (!authReady) {
    return <div className="p-4 text-sm">Booting…</div>;
  }

  return (
    <>
      <DebugBanner />
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
    </>
  );
};

export default App;
