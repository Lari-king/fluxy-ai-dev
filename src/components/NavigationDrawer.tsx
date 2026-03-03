import React from 'react';
import { 
  X, 
  LayoutDashboard, 
  CreditCard, 
  Target, 
  TrendingUp, 
  Users, 
  Home, 
  Settings, 
  Sparkles,
  Zap,
  Briefcase,
  ArrowUpRight
} from 'lucide-react';
import { useWealthAnalysis } from '@/features/wealth-strategist/hooks/useWealthAnalysis';
import { formatCurrency } from '@/utils/format';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage?: string;
  onNavigate?: (page: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'transactions', label: 'Transactions', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'budgets', label: 'Budgets', icon: <Target className="w-5 h-5" /> },
  { id: 'goals', label: 'Objectifs', icon: <TrendingUp className="w-5 h-5" /> },
  { id: 'simulator', label: 'Stratège', icon: <Zap className="w-5 h-5" />, badge: 'NEW' },
  { id: 'people', label: 'Personnes', icon: <Users className="w-5 h-5" /> },
];

export function NavigationDrawer({ isOpen, onClose, currentPage = 'dashboard', onNavigate }: NavigationDrawerProps) {
  const { currentNetWorth, investmentCapacity } = useWealthAnalysis();
  
  const handleNavigate = (pageId: string) => {
    onNavigate?.(pageId);
    onClose();
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <nav className={`fixed left-0 top-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r border-white/10 z-[60] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg">
              <span className="text-white text-lg font-bold">✦</span>
            </div>
            <h2 className="text-white font-light tracking-wide text-lg">Flux</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/10">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold mb-1">Patrimoine Net</p>
            <p className="text-xl font-black text-white">{formatCurrency(currentNetWorth)} €</p>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-white/40 font-bold">Capacité d'inv.</p>
                <p className="text-sm font-bold text-green-400">+{formatCurrency(investmentCapacity)}/m</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 space-y-1 overflow-y-auto max-h-[calc(100vh-400px)]">
          {NAV_ITEMS.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <div className={isActive ? 'text-white' : 'text-white/40 group-hover:text-white transition-colors'}>{item.icon}</div>
                <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                {item.badge && <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500 text-white">{item.badge}</span>}
              </button>
            );
          })}
        </div>

        <div className="mx-6 my-4 border-t border-white/10" />

        <div className="px-4">
          <button
            onClick={() => handleNavigate('ultrainsights')}
            className={`w-full relative overflow-hidden rounded-2xl p-4 group transition-all border ${currentPage === 'ultrainsights' ? 'border-purple-400 bg-purple-500/20' : 'border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20'}`}
          >
            <div className="relative flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-purple-300" />
              <div className="flex-1 text-left">
                <p className="text-white text-sm font-bold">Ultra Insights</p>
                <p className="text-white/40 text-[10px]">Analyse prédictive IA</p>
              </div>
            </div>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-black/40">
          <button onClick={() => handleNavigate('settings')} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">A</div>
            <div className="flex-1 text-left">
              <p className="text-white text-sm font-bold">Aimé</p>
              <p className="text-white/40 text-[10px]">Strategist Mode</p>
            </div>
            <Settings className="w-4 h-4 text-white/20" />
          </button>
        </div>
      </nav>
    </>
  );
}