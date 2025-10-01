import { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './hooks/useTheme.tsx';
import { ErrorBoundary } from './components/dev/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <Suspense fallback={
      <div className="min-h-screen bg-[hsl(220,30%,5%)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-xl text-[hsl(220,10%,95%)] font-semibold">Loading…</div>
          <div className="w-12 h-12 border-4 border-[hsl(240,100%,70%)] border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    }>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </Suspense>
  </ErrorBoundary>
);
