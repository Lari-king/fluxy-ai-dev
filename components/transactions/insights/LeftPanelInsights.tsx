/**
 * 🎯 LEFT PANEL INSIGHTS - VERSION RÉINVENTÉE 2026
 * 
 * Design System sophistiqué et minimaliste :
 * - Navigation fluide et intuitive
 * - Hiérarchie visuelle claire
 * - Micro-interactions raffinées
 * - Performance optimisée
 * 
 * Architecture :
 * - Hero compact avec état global
 * - Navigation par contexte (pas des tabs basiques)
 * - Cards unifiées avec variations subtiles
 * - Transitions fluides entre vues
 */

import { useState, useEffect, useMemo, memo, startTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react';

import { Transaction } from '../../../contexts/DataContext';
import { calculateMonthEndProjection } from '../../../src/utils/insights/projection';
import { detectAnomalies } from '../../../src/utils/insights/anomaly-detection';
import { detectRecurringPatterns } from '../../../src/utils/insights/recurring-detection';

import { useRules } from '../../../contexts/RulesContext';
import { useTransactionSettings } from '../../../contexts/TransactionSettingsContext';
import { useRuleViolationsCache } from '../../../hooks/useRuleViolationsCache';
import { useRecentTransactions } from '../../../hooks/useRecentTransactions';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';

import { ProjectionCard } from './cards/ProjectionCard';
import { RecurringCard } from './cards/RecurringCard';
import { AnomaliesCard } from './cards/AnomaliesCard';
import { ViolationsCard } from './cards/ViolationsCard';
import { ProjectionDetailsModal } from './ProjectionDetailsModal';

interface LeftPanelInsightsProps {
  transactions: Transaction[];
  currentBalance: number;
  onFilterByTransaction?: (transactionId: string) => void;
  onFilterByAnomaly?: (description: string) => void;
  onFilterByRecurring?: (transactionIds: string[]) => void;
  onToggle?: () => void;
}

type ViewMode = 'all' | 'projection' | 'recurring' | 'alerts';

// Skeleton élégant
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
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [projectionData, setProjectionData] = useState<any>(null);
  const [anomaliesData, setAnomaliesData] = useState<any>(null);
  const [recurringData, setRecurringData] = useState<any>(null);
  const [violationsLoaded, setViolationsLoaded] = useState(false);
  const [showProjectionDetails, setShowProjectionDetails] = useState(false);

  const { rules } = useRules();
  const { settings } = useTransactionSettings();

  // Performance : Debounce
  const debouncedTransactions = useDebouncedValue(transactions, 800);
  const { recent: recentTransactions } = useRecentTransactions(debouncedTransactions, 6);
  const ruleViolations = useRuleViolationsCache(rules, violationsLoaded ? recentTransactions : []);

  // Calculs étagés
  useEffect(() => {
    if (recentTransactions.length === 0) return;

    let cancelled = false;
    const timers: NodeJS.Timeout[] = [];

    const compute = () => {
      // Projection
      timers.push(setTimeout(() => {
        if (cancelled) return;
        const projection = calculateMonthEndProjection(recentTransactions, currentBalance, {
          inflationFactor: settings.projection?.inflationFactor,
          userAge: settings.projection?.userAge,
        });
        startTransition(() => setProjectionData(projection));
      }, 0));

      // Anomalies
      timers.push(setTimeout(() => {
        if (cancelled) return;
        if (!settings.anomaly?.enabled) {
          setAnomaliesData({ anomalies: [], suspiciousCount: 0 });
          return;
        }
        const anomalies = detectAnomalies(recentTransactions, settings.anomaly);
        startTransition(() => setAnomaliesData(anomalies));
      }, 300));

      // Récurrences
      timers.push(setTimeout(() => {
        if (cancelled) return;
        if (!settings.recurring?.enabled) {
          setRecurringData({ patterns: [], totalRecurringTransactions: 0, monthlyRecurringAmount: 0 });
          return;
        }
        const recurring = detectRecurringPatterns(recentTransactions, settings.recurring);
        startTransition(() => setRecurringData(recurring));
      }, 800));

      // Violations
      timers.push(setTimeout(() => {
        if (cancelled) return;
        setViolationsLoaded(true);
      }, 1200));
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(compute, { timeout: 3000 });
    } else {
      setTimeout(compute, 100);
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [recentTransactions, currentBalance, settings]);
  
  // Compteurs
  const alertsCount = (anomaliesData?.suspiciousCount || 0) + ruleViolations.length;
  const recurringCount = recurringData?.patterns.filter((p: any) => p.isActive).length || 0;

  // Mode détails
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
      
      {/* HERO - Compact & Élégant */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl" />
        
        <div className="relative p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <motion.button
                onClick={onToggle}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer hover:scale-105 transition-transform"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400 }}
                title="Fermer les insights"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </motion.button>
              <div>
                <h2 className="text-sm text-white font-medium">Insights IA</h2>
                <p className="text-xs text-white/40">Analyse en temps réel</p>
              </div>
            </div>
          </div>
          
          {/* Navigation contextuelle */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'Vue globale', icon: Layers, color: 'cyan' },
              { id: 'projection', label: 'Projection', icon: TrendingUp, color: 'blue', badge: projectionData?.daysRemaining },
              { id: 'recurring', label: 'Abonnements', icon: Calendar, color: 'purple', badge: recurringCount > 0 ? recurringCount : undefined },
              { id: 'alerts', label: 'Alertes', icon: AlertTriangle, color: 'orange', badge: alertsCount > 0 ? alertsCount : undefined },
            ].map((item) => {
              const isActive = viewMode === item.id;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setViewMode(item.id as ViewMode)}
                  className={`relative flex-1 p-2 rounded-lg transition-all ${
                    isActive 
                      ? `bg-${item.color}-500/20 border border-${item.color}-500/40` 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon className={`w-4 h-4 ${isActive ? `text-${item.color}-400` : 'text-white/60'}`} />
                    <span className={`text-[10px] ${isActive ? 'text-white' : 'text-white/50'}`}>
                      {item.label.split(' ')[0]}
                    </span>
                  </div>
                  {item.badge !== undefined && (
                    <div className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-${item.color}-500 border border-black flex items-center justify-center`}>
                      <span className="text-[10px] text-white font-medium">{item.badge}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full overflow-y-auto scrollbar-thin"
          >
            <div className="p-5 space-y-4">
              
              {/* VUE GLOBALE */}
              {viewMode === 'all' && (
                <>
                  {!projectionData ? (
                    <InsightSkeleton />
                  ) : (
                    <ProjectionCard
                      projection={projectionData}
                      transactions={recentTransactions}
                      onShowDetails={() => setShowProjectionDetails(true)}
                    />
                  )}

                  {recurringData?.patterns.some((p: any) => p.isActive) && (
                    <>
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="text-[10px] text-white/30 uppercase tracking-wider">Engagements</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                      
                      {!recurringData ? (
                        <InsightSkeleton />
                      ) : (
                        <RecurringCard 
                          recurring={recurringData} 
                          onFilterByRecurring={onFilterByRecurring} 
                        />
                      )}
                    </>
                  )}

                  {(anomaliesData?.suspiciousCount > 0 || ruleViolations.length > 0) && (
                    <>
                      <div className="flex items-center gap-2 py-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <span className="text-[10px] text-white/30 uppercase tracking-wider">Alertes</span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      </div>
                      
                      {!anomaliesData ? (
                        <InsightSkeleton />
                      ) : (
                        <AnomaliesCard 
                          anomalies={anomaliesData} 
                          onFilterByAnomaly={onFilterByAnomaly} 
                        />
                      )}

                      {!violationsLoaded ? (
                        <InsightSkeleton />
                      ) : (
                        <ViolationsCard 
                          violations={ruleViolations} 
                          onFilterByTransaction={onFilterByTransaction} 
                        />
                      )}
                    </>
                  )}

                  {projectionData && anomaliesData && recurringData && violationsLoaded && 
                   !recurringData.patterns.some((p: any) => p.isActive) && 
                   anomaliesData.suspiciousCount === 0 && 
                   ruleViolations.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-green-400" />
                      </div>
                      <p className="text-sm text-white/80 mb-1">Tout est optimal !</p>
                      <p className="text-xs text-white/40">Aucune alerte à signaler</p>
                    </motion.div>
                  )}
                </>
              )}

              {/* VUE PROJECTION */}
              {viewMode === 'projection' && (
                <>
                  {!projectionData ? (
                    <InsightSkeleton />
                  ) : (
                    <ProjectionCard
                      projection={projectionData}
                      transactions={recentTransactions}
                      onShowDetails={() => setShowProjectionDetails(true)}
                    />
                  )}
                </>
              )}

              {/* VUE RÉCURRENCES */}
              {viewMode === 'recurring' && (
                <>
                  {!recurringData ? (
                    <InsightSkeleton />
                  ) : recurringData.patterns.some((p: any) => p.isActive) ? (
                    <RecurringCard 
                      recurring={recurringData} 
                      onFilterByRecurring={onFilterByRecurring} 
                    />
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                        <Calendar className="w-8 h-8 text-purple-400" />
                      </div>
                      <p className="text-sm text-white/80 mb-1">Aucun abonnement</p>
                      <p className="text-xs text-white/40">Les paiements récurrents apparaîtront ici</p>
                    </motion.div>
                  )}
                </>
              )}

              {/* VUE ALERTES */}
              {viewMode === 'alerts' && (
                <>
                  {!anomaliesData || !violationsLoaded ? (
                    <>
                      <InsightSkeleton />
                      <InsightSkeleton />
                    </>
                  ) : (anomaliesData.suspiciousCount > 0 || ruleViolations.length > 0) ? (
                    <>
                      <AnomaliesCard 
                        anomalies={anomaliesData} 
                        onFilterByAnomaly={onFilterByAnomaly} 
                      />
                      <ViolationsCard 
                        violations={ruleViolations} 
                        onFilterByTransaction={onFilterByTransaction} 
                      />
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center py-12 text-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-green-400" />
                      </div>
                      <p className="text-sm text-white/80 mb-1">Tout est en ordre !</p>
                      <p className="text-xs text-white/40">Aucune alerte détectée</p>
                    </motion.div>
                  )}
                </>
              )}

              <div className="h-4" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});