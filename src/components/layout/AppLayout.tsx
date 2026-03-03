import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRenderTracker } from '@/utils/performance-monitor';
import { NavigationDrawer } from '@/components/NavigationDrawer';
import { Sparkles, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  isNavOpen: boolean;
  setIsNavOpen: (open: boolean) => void;
}

export function AppLayout({ children, currentPage, onNavigate, isNavOpen, setIsNavOpen }: AppLayoutProps) {
  useRenderTracker('AppLayout');
  
  const { user } = useAuth();

  // Fermer le drawer lors du changement de page
  useEffect(() => {
    setIsNavOpen(false);
  }, [currentPage, setIsNavOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20">
      
      {/* ✦ BOUTON LOGO ÉTOILE (Desktop & Tablet) */}
      <button
        onClick={() => setIsNavOpen(true)}
        className="fixed top-4 left-4 z-[60] w-12 h-12 rounded-2xl 
          bg-gradient-to-br from-purple-600 to-purple-800 
          hover:from-purple-500 hover:to-purple-700 
          flex items-center justify-center 
          transition-all shadow-xl hover:shadow-purple-500/50 group"
        aria-label="Ouvrir la navigation"
      >
        <span className="text-white text-2xl group-hover:scale-110 transition-transform">✦</span>
      </button>

      {/* ✦ NAVIGATION DRAWER UNIQUE */}
      <NavigationDrawer 
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        currentPage={currentPage}
        onNavigate={onNavigate}
      />

      {/* Header Mobile Simplifié (Uniquement pour le titre et le burger qui ouvre le MÊME drawer) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4 pl-16"> {/* Pl-16 pour laisser la place au bouton étoile */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              Flux
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNavOpen(true)}
            className="rounded-xl"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        "pt-20 lg:pt-8" // Padding pour ne pas être sous le header mobile ou le bouton étoile
      )}>
        <div className="container mx-auto px-4 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}

// Helper pour les classes (à importer si tu ne l'as pas)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}