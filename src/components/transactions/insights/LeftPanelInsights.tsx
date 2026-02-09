/**
 * 🎯 LEFT PANEL INSIGHTS - VERSION R.A.S.P CONSOLIDÉE + DEBUG
 */

import { useState, useEffect, memo, startTransition, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Calendar, AlertTriangle, Layers } from 'lucide-react';

// Contextes
import { useData, Transaction } from '@/contexts/DataContext';
import { useRules } from '@/contexts/RulesContext';
import { useTransactionSettings } from '@/contexts/TransactionSettingsContext';

// Types
import { PersonRelation, PersonType } from '@/types/people';
import { RecurringPattern } from '@/utils/insights/recurring-detection';

// Hooks & Utils
import { calculateMonthEndProjection } from '@/utils/insights/projection';
import { detectAnomalies } from '@/utils/insights/anomaly-detection';
import { parseTransactionDescription } from '@/utils/transaction-parser';
import { useFinance } from '@/hooks/use-finance';

// Composants Cards
import { ProjectionCard } from '@/components/transactions/insights/cards/ProjectionCard';
import { RecurringCard } from '@/components/transactions/insights/cards/RecurringCard';
import { AnomaliesCard } from '@/components/transactions/insights/cards/AnomaliesCard';
import { ViolationsCard } from '@/components/transactions/insights/cards/ViolationsCard';
import { ProjectionDetailsModal } from '@/components/transactions/insights/ProjectionDetailsModal';

// ──────────────────────────────────────────────
// SETTINGS PAR DÉFAUT
// ──────────────────────────────────────────────
const DEFAULT_RECURRING_SETTINGS = {
  enabled: true,
  minOccurrences: 3,
  maxCoefficientVariation: 35,
  minConfidence: 45,
  activeMultiplier: 1.8,
  typeTolerance: 2
};

interface LeftPanelInsightsProps {
  transactions: Transaction[];
  currentBalance: number;
  onFilterByTransaction?: (transactionId: string) => void;
  onFilterByAnomaly?: (description: string) => void;
  onFilterByRecurring?: (transactionIds: string[]) => void;
  onToggle?: () => void;
}

type ViewMode = 'all' | 'projection' | 'recurring' | 'alerts';

const InsightSkeleton = () => (
  <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-white/10 rounded w-1/3" />
        <div className="h-2 bg-white/10 rounded w-1/2" />
      </div>
    </div>
    <div className="space-y-2 pt-3">
      <div className="h-2 bg-white/10 rounded" />
      <div className="h-2 bg-white/10 rounded w-5/6" />
    </div>
  </div>
);

export const LeftPanelInsights = memo(function LeftPanelInsights({
  transactions,
  currentBalance,
  onFilterByTransaction,
  onFilterByAnomaly,
  onFilterByRecurring,
  onToggle,
}: LeftPanelInsightsProps) {
  // 1. ÉTATS LOCAUX
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [projectionData, setProjectionData] = useState<any>(null);
  const [anomaliesData, setAnomaliesData] = useState<any>(null);
  const [recurringData, setRecurringData] = useState<any>(null);
  const [showProjectionDetails, setShowProjectionDetails] = useState(false);

  // 2. CONTEXTES
  const { people, updatePeople, updateTransactions } = useData(); 
  const { violations, isEvaluating } = useRules(); 
  const { settings } = useTransactionSettings();
  
  const finance = useFinance(6);
  const recentTransactions = finance.recentTransactions || [];

  // DEBUG : log des changements d'état pour comprendre pourquoi rien ne s'affiche
  useEffect(() => {
    console.log('[STATE CHANGE] projectionData mis à jour →', !!projectionData);
  }, [projectionData]);

  useEffect(() => {
    console.log('[STATE CHANGE] recurringData mis à jour →', !!recurringData, recurringData?.patterns?.length || 0, 'patterns');
  }, [recurringData]);

  useEffect(() => {
    console.log('[STATE CHANGE] anomaliesData mis à jour →', !!anomaliesData);
  }, [anomaliesData]);

  // ──────────────────────────────────────────────
  // DEBUG : état reçu
  // ──────────────────────────────────────────────
  useEffect(() => {
    console.groupCollapsed('[LEFT PANEL INSIGHTS] DEBUG – état reçu');
    console.log('violations brutes :', violations?.length || 0);
    console.log('isEvaluating :', isEvaluating);
    console.log('activeViolations :', violations?.filter(v => !v.acknowledged)?.length || 0);
    console.groupEnd();
  }, [violations, isEvaluating]);

  // 3. FILTRAGE DES VIOLATIONS
  const activeViolations = useMemo(() => {
    if (!violations?.length) return [];
    const active = violations.filter(v => !v.acknowledged);
    console.log('[LEFT PANEL] activeViolations recalculé :', active.length);
    return active;
  }, [violations]);

  /**
   * 🧠 CRÉATION RELATION + REFRESH RÉCURRENCES
   */
  const handleCreateRelationFromPattern = useCallback((pattern: RecurringPattern) => {
    const parsed = parseTransactionDescription(pattern.description);
    
    const newPerson: PersonRelation = {
      id: crypto.randomUUID(),
      name: parsed.merchant,
      relationship: 'Abonnement IA',
      color: parsed.color || 'purple',
      circle: 'extended',
      totalImpact: Math.abs(pattern.averageAmount),
      personType: PersonType.MORALE, 
      income: 0,             
      expenses: 0,
      notes: "Généré via analyse IA"
    };

    const updatedPeople = [...people, newPerson];
    updatePeople(updatedPeople);

    const patternTxIds = new Set(pattern.transactions.map(t => t.id));
    const updatedTransactions = transactions.map(tx => {
      if (patternTxIds.has(tx.id)) {
        return { ...tx, personId: newPerson.id, category: parsed.category };
      }
      return tx;
    });

    updateTransactions(updatedTransactions);

    // Force re-calcul récurrences avec données mises à jour
    const worker = new Worker(new URL('@/utils/recurring-worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (e) => {
      if (e.data.success) {
        startTransition(() => {
          setRecurringData(e.data.result);
        });
        console.log('[RELATION REFRESH] Récurrences recalculées – bouton devrait passer à "Lien créé"');
      }
    };

    worker.postMessage({
      transactions: updatedTransactions.filter(t => recentTransactions.some(rt => rt.id === t.id)),
      recurringSettings: settings.recurring || DEFAULT_RECURRING_SETTINGS
    });

  }, [people, transactions, updatePeople, updateTransactions, recentTransactions, settings.recurring]);

  // ──────────────────────────────────────────────
  // CALCULS LOURDS DANS WORKER
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!recentTransactions || recentTransactions.length === 0) return;

    console.log('[CALCUL START] Lancement worker');

    const worker = new Worker(new URL('@/utils/recurring-worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (e) => {
      if (e.data.success) {
        console.log('[WORKER] Résultat reçu – patterns :', e.data.result.patterns.length);

        const recurringResult = e.data.result;

        startTransition(() => {
          setRecurringData(recurringResult);
          console.log('[STATE] setRecurringData appelé');
        });

        const projection = calculateMonthEndProjection(
          recentTransactions,
          currentBalance,
          {
            inflationFactor: settings.projection?.inflationFactor,
            userAge: settings.projection?.userAge,
            recurringSettings: settings.recurring
          },
          recurringResult
        );

        startTransition(() => {
          setProjectionData(projection);
          console.log('[STATE] setProjectionData appelé');
        });

        if (settings.anomaly?.enabled) {
          const anomalies = detectAnomalies(recentTransactions, settings.anomaly);
          startTransition(() => setAnomaliesData(anomalies));
          console.log('[STATE] setAnomaliesData appelé');
        }
      } else {
        console.error('[WORKER ERROR]', e.data.error);
      }
    };

    worker.onerror = (err) => {
      console.error('[WORKER ERROR]', err);
    };

    worker.postMessage({
      transactions: recentTransactions,
      recurringSettings: settings.recurring || DEFAULT_RECURRING_SETTINGS
    });

    return () => worker.terminate();
  }, [recentTransactions, currentBalance, settings]);

  // ──────────────────────────────────────────────
  // COMPTEURS
  // ──────────────────────────────────────────────
  const alertsCount = useMemo(() => {
    const count = (anomaliesData?.suspiciousCount || 0) + activeViolations.length;
    console.log('[LEFT PANEL] alertsCount final :', count);
    return count;
  }, [anomaliesData, activeViolations]);

  const recurringCount = useMemo(() => {
    const count = recurringData?.patterns?.filter((p: any) => p.isActive)?.length || 0;
    console.log('[LEFT PANEL] recurringCount :', count);
    return count;
  }, [recurringData]);

  if (showProjectionDetails && projectionData) {
    return (
      <div className="h-full flex flex-col bg-black border-r border-white/10 w-[360px]">
        <ProjectionDetailsModal
          projection={projectionData}
          transactions={recentTransactions}
          currentBalance={currentBalance}
          onClose={() => setShowProjectionDetails(false)}
          onFilterByTransaction={onFilterByTransaction}
          onFilterByRecurring={onFilterByRecurring}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black border-r border-white/10 w-[360px]">
      {/* HEADER & NAV */}
      <div className="relative overflow-hidden border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <motion.button
              onClick={onToggle}
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </motion.button>
            <div>
              <h2 className="text-sm text-white font-medium">Insights IA</h2>
              <p className="text-xs text-white/40">Système R.A.S.P {isEvaluating ? 'en calcul...' : 'actif'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'Vue globale', icon: Layers },
            { id: 'projection', label: 'Projection', icon: TrendingUp, badge: projectionData?.daysRemaining },
            { id: 'recurring', label: 'Abonnements', icon: Calendar, badge: recurringCount > 0 ? recurringCount : undefined },
            { id: 'alerts', label: 'Alertes', icon: AlertTriangle, badge: alertsCount > 0 ? alertsCount : undefined },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setViewMode(item.id as ViewMode)}
              className={`relative flex-1 p-2 rounded-lg transition-all border ${
                viewMode === item.id ? `bg-white/10 border-white/20` : 'bg-white/5 border-white/10 opacity-70'
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <item.icon className={`w-4 h-4 ${viewMode === item.id ? `text-white` : 'text-white/40'}`} />
                <span className={`text-[10px] ${viewMode === item.id ? 'text-white' : 'text-white/50'}`}>{item.label.split(' ')[0]}</span>
              </div>
              {item.badge !== undefined && (
                <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border border-black flex items-center justify-center text-[10px] text-white font-bold">
                  {item.badge}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENU */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            className="h-full overflow-y-auto p-5 space-y-4"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          >
            {viewMode === 'all' && (
              <>
                {!projectionData && !recurringData && !anomaliesData ? (
                  <div className="text-center py-10 text-white/50">
                    Chargement des insights en cours...
                  </div>
                ) : (
                  <>
                    {projectionData ? (
                      <ProjectionCard projection={projectionData} transactions={recentTransactions} onShowDetails={() => setShowProjectionDetails(true)} />
                    ) : (
                      <div className="text-center py-6 text-yellow-400/70">Projection non disponible</div>
                    )}

                    {recurringCount > 0 ? (
                      <RecurringCard 
                        recurring={recurringData} 
                        existingPeople={people} 
                        onFilterByRecurring={onFilterByRecurring}
                        onCreateRelation={handleCreateRelationFromPattern}
                      />
                    ) : recurringData ? (
                      <div className="text-center py-6 text-cyan-400/70">Aucun abonnement détecté</div>
                    ) : null}

                    {alertsCount > 0 ? (
                      <>
                        <AnomaliesCard anomalies={anomaliesData} onFilterByAnomaly={onFilterByAnomaly} />
                        <ViolationsCard violations={activeViolations} onFilterByTransaction={onFilterByTransaction} />
                      </>
                    ) : (
                      <div className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl text-center">
                        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-yellow-400" />
                        <p className="text-sm font-medium text-yellow-300">Aucune alerte active</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {/* ... les autres viewMode restent identiques ... */}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});