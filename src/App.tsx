import React, { useState } from 'react';

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

// Pages
import { Dashboard } from './components/pages/Dashboard';
import { Transactions } from './components/pages/Transactions';
import { Budgets } from './components/pages/Budgets';
import { Goals } from './components/pages/Goals';
import { Patrimoine } from './components/pages/Patrimoine';
import { Simulator } from './components/pages/Simulator';
import { People } from './components/pages/People';
import { FamilyOffice } from './components/pages/FamilyOffice';
import { Settings } from './components/pages/Settings';
import { UltraInsights } from './components/pages/UltraInsights';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isNavOpen, setIsNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background text-primary">
        <div className="animate-pulse font-medium">Initialisation du cockpit...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':     return <Dashboard onNavigate={setCurrentPage} />;
      case 'transactions':  return <Transactions />;
      case 'budgets':       return <Budgets />;
      case 'goals':         return <Goals />;
      case 'people':        return <People />;
      case 'familyoffice':  return <FamilyOffice />;
      case 'patrimoine':    return <Patrimoine />;
      case 'simulator':     return <Simulator />;
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
                <Toaster />
              </RulesProvider>
            </TransactionSettingsProvider>
          </StorageProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}