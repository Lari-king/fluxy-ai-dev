import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { TransactionSettingsProvider } from './contexts/TransactionSettingsContext';
import { RulesProvider } from './contexts/RulesContext';
import { LoginPage } from './components/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
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
import { Toaster } from './components/ui/sonner';

// 🔬 FLUX SMART : Import du benchmark pour exposition dans window
import './src/utils/insights/benchmark-global';
import './src/utils/insights/console-helpers';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isNavOpen, setIsNavOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-20 h-20 relative mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-spin" 
                 style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de Flux...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Render page content based on currentPage
  let PageComponent;
  switch (currentPage) {
    case 'dashboard':
      PageComponent = <Dashboard onNavigate={setCurrentPage} />;
      break;
    case 'transactions':
      PageComponent = <Transactions />;
      break;
    case 'budgets':
      PageComponent = <Budgets />;
      break;
    case 'goals':
      PageComponent = <Goals />;
      break;
    case 'people':
      PageComponent = <People />;
      break;
    case 'familyoffice':
      PageComponent = <FamilyOffice />;
      break;
    case 'patrimoine':
      PageComponent = <Patrimoine />;
      break;
    case 'simulator':
      PageComponent = <Simulator />;
      break;
    case 'ultrainsights':
      PageComponent = <UltraInsights onBack={() => setCurrentPage('dashboard')} />;
      break;
    case 'settings':
      PageComponent = <Settings />;
      break;
    default:
      PageComponent = <Dashboard onNavigate={setCurrentPage} />;
  }

  return (
    <AppLayout 
      currentPage={currentPage} 
      onNavigate={setCurrentPage}
      isNavOpen={isNavOpen}
      setIsNavOpen={setIsNavOpen}
    >
      {PageComponent}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <TransactionSettingsProvider>
            <RulesProvider>
              <AppContent />
              <Toaster />
            </RulesProvider>
          </TransactionSettingsProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}