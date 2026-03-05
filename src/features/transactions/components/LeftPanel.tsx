/**
 * 🎯 LEFT PANEL - VERSION INTEGRALE RESTAURÉE & OPTIMISÉE
 * Intelligence financière, Sync People, Design Tesla & Fix CPU Leak
 */

import { useState, Component, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  Sparkles, 
  X, 
  Activity, 
  Zap, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// UI & Components
import { Button } from '@/components/ui/button';
import { InsightsPanel } from '@/features/insights/components/InsightsPanel';
import { ProjectionDetailsModal } from '@/features/predictions/components/ProjectionDetailsModal';

// Hooks
import { useTransactions } from '@/features/transactions/hooks/useTransactions';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LeftPanelProps {
  onFilterByTransaction?: (id: string) => void;
  onFilterByRecurring?: (ids: string[]) => void;
  onFilterByAnomaly?: (val: any) => void;
  onToggleCollapse?: () => void;
}

// ============================================================================
// ERROR BOUNDARY - PROTECTION DU THREAD IA
// ============================================================================

class LeftPanelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; errorInfo: string | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ [LeftPanel Critical Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-[#050505] border-r border-red-500/20">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
            <Activity className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Moteur IA Interrompu</h3>
          <p className="text-xs text-white/40 mb-8 leading-relaxed max-w-[240px]">
            Une erreur de rendu a été détectée dans l'analyse des flux. 
            {this.state.errorInfo && (
               <span className="block mt-2 text-red-400/60 font-mono">
                 Code: {String(this.state.errorInfo).slice(0, 30)}...
               </span>
            )}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="border-white/10 hover:bg-white/5 text-white/70"
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Réinitialiser le module
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// COMPOSANT PRINCIPAL : LEFT PANEL
// ============================================================================

export function LeftPanel({
  onFilterByTransaction,
  onFilterByRecurring,
  onFilterByAnomaly,
  onToggleCollapse,
}: LeftPanelProps) {
  // --- ÉTATS ---
  const [selectedProjection, setSelectedProjection] = useState<any>(null);
  const [internalView, setInternalView] = useState<'main' | 'details'>('main');

  // --- DATA HOOKS ---
  const { 
    allTransactions = [], 
    categories = [], 
    people = [], 
    filters 
  } = useTransactions();

  // ⚡ OPTIMISATION CPU : On stabilise les data passées aux enfants
  const memoizedTransactions = useMemo(() => allTransactions, [allTransactions.length]);
  const memoizedPeople = useMemo(() => people, [people.length]);

  // --- LOGIQUE DE DÉTECTION ---
  const isFiltering = useMemo(() => {
    const txIds = (filters as any)?.transactionIds;
    return filters.searchTerm !== "" || (Array.isArray(txIds) && txIds.length > 0);
  }, [filters]);

  // --- HANDLERS ---
  const handleToggle = useCallback(() => {
    if (onToggleCollapse) onToggleCollapse();
  }, [onToggleCollapse]);

  const openProjection = useCallback((projection: any) => {
    setSelectedProjection(projection);
    setInternalView('details');
  }, []);

  const closeProjection = useCallback(() => {
    setInternalView('main');
    // On attend la fin de l'animation AnimatePresence (300ms) pour nettoyer la data
    setTimeout(() => setSelectedProjection(null), 300);
  }, []);

  // Monitorage stabilisé
  useEffect(() => {
    if (memoizedTransactions.length > 0) {
      console.log("🧠 [LeftPanel] Data injection stabilized:", {
        txCount: memoizedTransactions.length,
        peopleCount: memoizedPeople.length
      });
    }
  }, [memoizedTransactions.length, memoizedPeople.length]);

  return (
    <div className="relative h-full flex flex-col bg-[#050505] overflow-hidden w-full border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
      
      {/* 🟢 HEADER LUXE */}
      <div className="relative flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent z-10">
        <div 
          className="flex items-center gap-4 cursor-pointer group"
          onClick={handleToggle}
        >
          <div className={`relative w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-700 ${
            isFiltering 
              ? 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]' 
              : 'bg-white/[0.03] border-white/10 group-hover:bg-white/10 group-hover:border-white/20'
          }`}>
            <Sparkles className={`w-5 h-5 ${
              isFiltering ? 'text-cyan-400 scale-110' : 'text-white/40 group-hover:text-cyan-400'
            } transition-all duration-500`} />
            
            {isFiltering && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-[0.1em] uppercase">Intelligence</h2>
              {isFiltering && (
                <motion.span 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-[9px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold flex items-center gap-1"
                >
                  <Zap className="w-2.5 h-2.5 fill-current" /> FOCUS
                </motion.span>
              )}
            </div>
            <p className="text-[9px] text-white/20 uppercase font-black tracking-[0.2em] mt-0.5">Engine v2.6.4</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="w-8 h-8 p-0 text-white/20 hover:text-white hover:bg-white/5 rounded-xl transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* 🔵 ZONE DE CONTENU DYNAMIQUE */}
      <LeftPanelErrorBoundary>
        <div className="flex-1 relative flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {internalView === 'details' ? (
              <motion.div
                key="projection-details"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="flex-1 flex flex-col bg-[#050505]"
              >
                <div className="p-4 border-b border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeProjection}
                    className="w-full justify-start text-white/40 hover:text-white flex items-center gap-3 h-10 px-4 rounded-xl border border-white/5 transition-all group"
                  >
                    <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Quitter l'analyse</span>
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <ProjectionDetailsModal
                    projection={selectedProjection}
                    onClose={closeProjection}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="insights-dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 overflow-y-auto custom-scrollbar"
              >
                <InsightsPanel
                  transactions={memoizedTransactions}
                  categories={categories}
                  // @ts-ignore
                  people={memoizedPeople} 
                  onFilterByTransaction={onFilterByTransaction}
                  onFilterByRecurring={onFilterByRecurring}
                  onFilterByAnomaly={onFilterByAnomaly}
                  onShowProjectionDetails={openProjection}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LeftPanelErrorBoundary>

      {/* 🔘 FOOTER STATUT */}
      <div className="p-4 border-t border-white/5 bg-gradient-to-t from-black/40 to-transparent">
        <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-green-500/60" />
            <div className="flex flex-col">
              <span className="text-[9px] text-white/60 font-black uppercase tracking-widest">Calcul Local</span>
              <span className="text-[8px] text-white/20 font-medium">No Cloud Analysis</span>
            </div>
          </div>
          <div className="h-1 w-8 rounded-full bg-white/5 overflow-hidden">
            <motion.div 
              animate={{ x: [-32, 32] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-full w-4 bg-cyan-500/40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}