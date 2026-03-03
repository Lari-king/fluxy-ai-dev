import { useState } from 'react';

// Contexts
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { StorageProvider } from './contexts/StorageContext';
import { TransactionSettingsProvider } from './contexts/TransactionSettingsContext';
import { RulesProvider } from './contexts/RulesContext';

// Layout & UI
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './components/auth/LoginPage';
import { Toaster } from './components/ui/sonner';

// Pages & Features
import { Dashboard } from './components/pages/Dashboard';
import { BudgetsPage as Budgets } from './components/pages/Budgets'; 
import { Goals } from './components/pages/Goals';
import { People } from './components/pages/People';
import { Settings } from './components/pages/Settings';
import { UltraInsights } from './components/pages/UltraInsights';

// Import de la nouvelle vue modularisée (Correction Erreur 2307)
import { TransactionsView } from './features/transactions/views/TransactionsView';

// Nouveau Module Intelligence
import { StrategistDashboard } from './features/wealth-strategist/components/StrategistDashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isNavOpen, setIsNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050505] text-white">
        <div className="animate-pulse font-medium text-lg tracking-tight">Initialisation du cockpit...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':     return <Dashboard onNavigate={setCurrentPage} />;
      case 'transactions':  return <TransactionsView />; // Utilisation de la vue corrigée
      case 'budgets':       return <Budgets />;
      case 'goals':         return <Goals />;
      case 'people':        return <People />;
      case 'patrimoine':    
      case 'simulator':     
        return <StrategistDashboard />;
      case 'ultrainsights': return <UltraInsights onBack={() => setCurrentPage('dashboard')} />;
      case 'settings':      return <Settings />;
      default:              return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <AppLayout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      isNavOpen={isNavOpen}
      setIsNavOpen={setIsNavOpen}
    >
      {renderPage()}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <StorageProvider>
            <TransactionSettingsProvider>
              <RulesProvider>
                <AppContent />
                {/* Toaster pour les notifications globales (CRUD, Import, etc.) */}
                <Toaster position="top-center" richColors />
              </RulesProvider>
            </TransactionSettingsProvider>
          </StorageProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}