/**
 * 🎯 INSIGHTS PANEL - VERSION CORRIGÉE
 */
import { memo, useEffect } from 'react';
import { useGlobalIntelligence } from '../hooks/use-global-intelligence';
import { ProjectionCard } from '@/features/predictions/components/ProjectionCard';
import { RecurringCard } from '@/features/recurring/components/RecurringCard';
import { ViolationsCard } from '@/features/intelligence/components/ViolationsCard';
import { AnomaliesCard } from '@/features/analytics/components/AnomaliesCard'; 
import { SectionWrapper } from './SectionWrapper';
import { LoadingState } from './LoadingState';
import { TrendingUp, Sparkles, ShieldAlert } from 'lucide-react';
import type { Transaction } from '@/features/transactions/types';

interface InsightsPanelProps {
  transactions: Transaction[]; // Ajouté pour match avec LeftPanel
  categories: any[];          // Ajouté pour match avec LeftPanel
  onFilterByTransaction?: (id: string) => void;
  onFilterByRecurring?: (ids: string[]) => void;
  onFilterByAnomaly?: (val: any) => void;
  onShowProjectionDetails?: (projection: any) => void;
}

export const InsightsPanel = memo(function InsightsPanel({ 
  onFilterByTransaction, 
  onFilterByRecurring,
  onFilterByAnomaly,
  onShowProjectionDetails,
  transactions: externalTransactions // On privilégie les data du parent
}: InsightsPanelProps) {
  
  // Le hook récupère les calculs lourds (projection, recurring)
  const { projection, recurring, alerts, isSyncing, isEmpty, transactions: internalTransactions } = useGlobalIntelligence();

  // Utilise les transactions externes si dispo, sinon les internes
  const activeTransactions = externalTransactions || internalTransactions || [];

  const handleProjectionClick = () => {
    if (onShowProjectionDetails && projection) {
      onShowProjectionDetails(projection);
    }
  };

  if (isSyncing) return <LoadingState />;
  if (isEmpty && activeTransactions.length === 0) {
    return <div className="p-8 text-center text-white/20 text-xs">Aucune donnée à analyser</div>;
  }

  return (
    <div className="flex flex-col gap-8 p-4 custom-scrollbar overflow-y-auto h-full">
      
      {/* SECTION 1 : PROJECTION (Ne s'affiche que si un calcul existe) */}
      <SectionWrapper title="Fin de mois" icon={TrendingUp} color="text-cyan-400">
        {projection ? (
          <ProjectionCard 
            projection={projection} 
            transactions={activeTransactions}
            onShowDetails={handleProjectionClick}
          />
        ) : (
          <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] text-[10px] text-white/20 text-center">
            Analyse du solde en cours...
          </div>
        )}
      </SectionWrapper>

      {/* SECTION 2 : RÉCURRENCES */}
      <SectionWrapper title="Abonnements" icon={Sparkles} color="text-purple-400">
        <RecurringCard 
          recurring={recurring}
          onFilterByRecurring={onFilterByRecurring}
        />
      </SectionWrapper>

      {/* SECTION 3 : SÉCURITÉ & IA */}
      <SectionWrapper title="Sécurité & IA" icon={ShieldAlert} color="text-orange-400">
        <div className="space-y-4">
          <ViolationsCard onFilterByTransaction={onFilterByTransaction} />
          
          {alerts?.violations && alerts.violations.length > 0 && (
            <AnomaliesCard 
              anomalies={alerts.violations} 
              onSelectTransaction={(tx: Transaction) => onFilterByTransaction?.(tx.id)}
              onFilterByAnomaly={(f: { targetId: string, relatedIds: string[] }) => {
                if (onFilterByAnomaly) onFilterByAnomaly(f);
                else onFilterByTransaction?.(f.targetId);
              }}
            />
          )}
        </div>
      </SectionWrapper>
    </div>
  );
});