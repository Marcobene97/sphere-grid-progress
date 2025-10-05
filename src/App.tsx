import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import AuthPage from '@/pages/AuthPage';
import Dashboard from '@/pages/Dashboard';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/" replace /> : <AuthPage />} 
      />
      <Route 
        path="/" 
        element={user ? <Dashboard /> : <Navigate to="/auth" replace />} 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
