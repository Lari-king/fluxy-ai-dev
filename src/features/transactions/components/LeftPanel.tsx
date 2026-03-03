/**
 * 🎯 LEFT PANEL - VERSION CONNECTÉE (COMPLÈTE + DIAGNOSTIC)
 * Ce panneau centralise l'intelligence financière (Insights, Récurrences, Anomalies).
 * Note : En accord avec la mise à jour du 2026-02-18, les anomalies temporelles 
 * sont désormais centralisées et le filtrage est transmis à l'InsightsPanel.
 */

import { useState, Component, ReactNode, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// UI & Components
import { Button } from '@/components/ui/button';
import { InsightsPanel } from '@/features/insights/components/InsightsPanel';
import { ProjectionDetailsModal } from '@/features/predictions/components/ProjectionDetailsModal';

// Hooks
import { useTransactions } from '@/features/transactions/hooks/useTransactions';

// ============================================================================
// TYPES
// ============================================================================

interface LeftPanelProps {
  onFilterByTransaction?: (id: string) => void;
  onFilterByRecurring?: (ids: string[]) => void;
  onFilterByAnomaly?: (val: any) => void;
}

// ============================================================================
// ERROR BOUNDARY LÉGER
// ============================================================================

class LeftPanelErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ [LeftPanel Error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-8 text-center bg-black/40">
          <div className="max-w-md">
            <h3 className="text-lg font-bold text-red-400 mb-3">
              Erreur dans le panneau Intelligence
            </h3>
            <p className="text-sm text-white/70 mb-6">
              Une erreur inattendue s'est produite. Recharge la page ou réessaie plus tard.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-red-500/30 hover:bg-red-950/30 text-red-400"
            >
              Recharger la page
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function LeftPanel({
  onFilterByTransaction,
  onFilterByRecurring,
  onFilterByAnomaly,
}: LeftPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedProjection, setSelectedProjection] = useState<any>(null);

  // 🔄 RÉCUPÉRATION DES DONNÉES
  const { transactions, categories, isLoading } = useTransactions();

  // 🔍 LOGS DE DIAGNOSTIC - FLUX DE DONNÉES
  useEffect(() => {
    console.group("🧠 [LeftPanel Intelligence]");
    console.log("Statut Loading:", isLoading);
    console.log("Transactions transmises à l'IA:", transactions?.length || 0);
    if (transactions?.length > 0) {
      console.log("Exemple de Data:", transactions[0].description, transactions[0].amount);
    }
    console.groupEnd();
  }, [transactions, isLoading]);

  const handleShowProjectionDetails = (projection: any) => {
    setSelectedProjection(projection);
  };

  const handleCloseProjectionDetails = () => {
    setSelectedProjection(null);
  };

  return (
    <>
      {/* Toggle Button (visible quand le panneau est réduit) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-auto"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(true)}
              className="rounded-l-none rounded-r-xl bg-[#0A0A0A] border border-l-0 border-white/10 text-white hover:bg-white/5 hover:text-cyan-400 h-12 w-8 shadow-2xl"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Panel Container */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? 380 : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative h-full border-r border-white/10 bg-[#0A0A0A] flex flex-col overflow-hidden shrink-0"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center border border-white/5 shadow-inner">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Intelligence</h2>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                </span>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">
                  Temps Réel
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white/20 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Dynamic Content Area */}
        <LeftPanelErrorBoundary>
          <div className="flex-1 relative flex flex-col overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedProjection ? (
                // VUE : DÉTAILS D'UNE PROJECTION
                <motion.div
                  key="projection-details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col bg-black/40"
                >
                  <div className="p-4 border-b border-white/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCloseProjectionDetails}
                      className="w-full justify-start text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-2 group"
                    >
                      <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
                      <span className="text-xs font-bold uppercase tracking-tighter">
                        Fermer la projection
                      </span>
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <ProjectionDetailsModal
                      projection={selectedProjection}
                      onClose={handleCloseProjectionDetails}
                    />
                  </div>
                </motion.div>
              ) : (
                // VUE : TABLEAU DE BORD INSIGHTS (Par défaut)
                <motion.div
                  key="insights-dashboard"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-y-auto custom-scrollbar"
                >
                  <InsightsPanel
                    transactions={transactions}
                    categories={categories}
                    onFilterByTransaction={onFilterByTransaction}
                    onFilterByRecurring={onFilterByRecurring}
                    onFilterByAnomaly={onFilterByAnomaly}
                    onShowProjectionDetails={handleShowProjectionDetails}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </LeftPanelErrorBoundary>

        {/* Footer info */}
        <div className="p-3 border-t border-white/5 bg-black/20">
          <div className="flex justify-between items-center px-2">
            <span className="text-[9px] text-white/20 font-medium uppercase tracking-widest">
              Flux v2.4 stable
            </span>
            <div className="flex gap-1">
              <div className={`w-1 h-1 rounded-full ${isLoading ? 'bg-orange-500/40' : 'bg-green-500/40'}`} />
              <div className="w-1 h-1 rounded-full bg-green-500/40" />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}