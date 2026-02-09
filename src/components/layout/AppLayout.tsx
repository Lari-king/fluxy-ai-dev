import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRenderTracker } from '@/utils/performance-monitor';
import { NavigationDrawer } from '@/components/NavigationDrawer';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  Users,
  TrendingUp,
  Home,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  Sparkles,
  Activity,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/components/ui/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  isNavOpen?: boolean;
  setIsNavOpen?: (open: boolean) => void;
}

export function AppLayout({ children, currentPage, onNavigate, isNavOpen, setIsNavOpen }: AppLayoutProps) {
  useRenderTracker('AppLayout');
  
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentPage]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, gradient: 'from-blue-500 to-purple-600' },
    { id: 'transactions', label: 'Transactions', icon: Receipt, gradient: 'from-purple-500 to-pink-600' },
    { id: 'budgets', label: 'Budgets', icon: Wallet, gradient: 'from-orange-500 to-red-600' },
    { id: 'goals', label: 'Objectifs', icon: Target, gradient: 'from-green-500 to-emerald-600' },
    { id: 'people', label: 'Personnes', icon: Users, gradient: 'from-pink-500 to-rose-600' },
    { id: 'patrimoine', label: 'Patrimoine', icon: TrendingUp, gradient: 'from-cyan-500 to-blue-600' },
    { id: 'familyoffice', label: 'Family Office', icon: Home, gradient: 'from-violet-500 to-purple-600' },
    { id: 'simulator', label: 'Simulateur', icon: Activity, gradient: 'from-yellow-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/20">
      {/* ✦ NAVIGATION DRAWER TRIGGER - Logo Étoile */}
      {setIsNavOpen && (
        <button
          onClick={() => setIsNavOpen(true)}
          className="fixed top-4 left-4 z-[60] w-10 h-10 rounded-xl 
            bg-gradient-to-br from-purple-600 to-purple-800 
            hover:from-purple-500 hover:to-purple-700 
            flex items-center justify-center 
            transition-all shadow-lg hover:shadow-purple-500/50"
          aria-label="Ouvrir la navigation"
        >
          <span className="text-white text-lg">✦</span>
        </button>
      )}

      {/* ✦ NAVIGATION DRAWER */}
      {setIsNavOpen && isNavOpen !== undefined && (
        <NavigationDrawer 
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          currentPage={currentPage}
          onNavigate={onNavigate}
        />
      )}

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              Flux
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="absolute top-0 left-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-8 mt-16">
                  <Avatar className="w-12 h-12 border-2 border-white dark:border-gray-700 shadow-lg">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm text-gray-900 dark:text-white">{user?.name || 'Utilisateur'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                  </div>
                </div>

                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                          isActive
                            ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 space-y-2">
                  <Button
                    variant="ghost"
                    onClick={() => onNavigate('settings')}
                    className="w-full justify-start rounded-xl"
                  >
                    <Settings className="w-5 h-5 mr-3" />
                    Paramètres
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={toggleTheme}
                    className="w-full justify-start rounded-xl"
                  >
                    {theme === 'dark' ? <Sun className="w-5 h-5 mr-3" /> : <Moon className="w-5 h-5 mr-3" />}
                    {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={logout}
                    className="w-full justify-start rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Full Width (pas de sidebar permanente) */}
      <main className="min-h-screen pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}