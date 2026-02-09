/**
 * 🧭 NAVIGATION DRAWER - INVISIBLE PAR DÉFAUT
 * 
 * Drawer de navigation glassmorphism qui apparaît via le logo étoile
 * Design cohérent avec le dark mode system
 */

import React from 'react';
import { X, LayoutDashboard, CreditCard, Target, TrendingUp, Users, Home, Settings, Moon, Sparkles } from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'transactions', label: 'Transactions', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'budgets', label: 'Budgets', icon: <Target className="w-5 h-5" /> },
  { id: 'goals', label: 'Objectifs', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'people', label: 'Personnes', icon: <Users className="w-5 h-5" /> },
  { id: 'patrimoine', label: 'Patrimoine', icon: <Home className="w-5 h-5" /> },
];

export function NavigationDrawer({ isOpen, onClose, currentPage = 'transactions', onNavigate }: NavigationDrawerProps) {
  
  const handleNavigate = (pageId: string) => {
    onNavigate?.(pageId);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] 
          transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <nav 
        className={`fixed left-0 top-0 h-full w-80 
          bg-black/95 backdrop-blur-xl border-r border-white/10 
          z-[60] transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="navigation"
        aria-label="Navigation principale"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 
              flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">✦</span>
            </div>
            <div>
              <h2 className="text-white font-light">Flux</h2>
              <p className="text-xs text-white/40">Votre finance intelligente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Fermer la navigation"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 
                  rounded-xl transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
              >
                <div className={isActive ? 'text-white' : 'text-white/60'}>
                  {item.icon}
                </div>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/60">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="mx-4 my-6 border-t border-white/10" />

        {/* Ultra Insights - Bouton spécial */}
        <div className="px-4 mb-4">
          <button
            onClick={() => handleNavigate('ultrainsights')}
            className="w-full relative overflow-hidden rounded-xl p-4 group transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3) 0%, rgba(168, 85, 247, 0.2) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)',
            }}
            role="menuitem"
          >
            {/* Effet de brillance animé */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
            />
            
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <Sparkles className="w-6 h-6 text-purple-300" />
                <div className="absolute inset-0 animate-pulse">
                  <Sparkles className="w-6 h-6 text-purple-200" />
                </div>
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-medium flex items-center gap-2">
                  Ultra Insights
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/50 text-purple-100">
                    BETA
                  </span>
                </div>
                <p className="text-white/60 text-xs">
                  Analyse avancée
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Bottom Section */}
        <div className="px-4 space-y-1">
          <button
            onClick={() => handleNavigate('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 
              rounded-xl transition-all ${
              currentPage === 'settings'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
            role="menuitem"
            aria-current={currentPage === 'settings' ? 'page' : undefined}
          >
            <Settings className="w-5 h-5 text-white/60" />
            <span className="flex-1 text-left">Paramètres</span>
          </button>

          {/* Mode sombre (désactivé car déjà en dark) */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 
              rounded-xl transition-all text-white/70 hover:bg-white/5 hover:text-white"
            role="menuitem"
            disabled
          >
            <Moon className="w-5 h-5 text-white/60" />
            <span className="flex-1 text-left">Mode sombre</span>
            <div className="w-10 h-6 bg-purple-600 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </button>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/40">
          <button className="w-full p-3 hover:bg-white/5 rounded-xl transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 
              flex items-center justify-center text-white font-medium">
              U
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-white text-sm truncate">Utilisateur</p>
              <p className="text-white/40 text-xs truncate">user@flux.app</p>
            </div>
          </button>
        </div>

        {/* Screen Reader Status */}
        <div role="status" aria-live="polite" className="sr-only">
          {isOpen ? 'Menu de navigation ouvert' : 'Menu de navigation fermé'}
        </div>
      </nav>
    </>
  );
}