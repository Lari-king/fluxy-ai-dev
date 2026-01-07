import React from 'react';
import { useFinancialKPIs } from '../../hooks/useFinancialKPIs';
import { useChartData } from '../../hooks/useChartData';
import { KPIMetric } from './KPIMetric';
import { MiniLineChart } from './MiniLineChart';
import { DollarSign, Zap, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { CategoryBreakdown } from './CategoryBreakdown'; // NOUVEAU
import { CashFlowBarChart } from './DetailedBarChart'; // NOUVEAU
import { TimePeriodSelector, TimePeriod } from './PeriodSelector'; // NOUVEAU

/**
 * EnhancedFinancialWidget est le composant principal du tableau de bord
 * affichant les KPIs financiers et les mini-graphiques de tendance.
 */
export const EnhancedFinancialWidget: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriod>('30d'); // NOUVEL ÉTAT

  const { 
    netWorthFormatted, 
    monthlyCashFlowFormatted, 
    savingsRateFormatted, 
    isLoading: isKpiLoading,
    monthlyCashFlow
  } = useFinancialKPIs();
  
  const { 
    netWorthHistory, 
    cashFlowHistory, 
    isLoading: isChartLoading 
  } = useChartData();

  const isLoading = isKpiLoading || isChartLoading;
  
  const isCashFlowPositive = monthlyCashFlow >= 0;
  const netWorthTrend = "1.5% (simulé)"; 

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      {/* En-tête avec titre et sélecteur de période */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-4 sm:mb-0">
          Tableau de Bord Financier
        </h2>
        <div className="flex items-center gap-3">
             <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
             <TimePeriodSelector 
                selectedPeriod={selectedPeriod} 
                onSelectPeriod={setSelectedPeriod} 
             />
        </div>
      </div>

      {/* Section des KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Valeur Nette */}
        <KPIMetric
          title="Valeur Nette Totale"
          value={netWorthFormatted}
          changeValue={netWorthTrend}
          isPositive={!isLoading && true}
          isLoading={isLoading}
          icon={DollarSign}
        />

        {/* KPI 2: Flux de Trésorerie Mensuel */}
        <KPIMetric
          title="Flux de Trésorerie (30j)"
          value={monthlyCashFlowFormatted}
          changeValue={isCashFlowPositive ? 'Rentrant' : 'Sortant'}
          isPositive={!isLoading && isCashFlowPositive}
          isLoading={isLoading}
          icon={isCashFlowPositive ? TrendingUp : TrendingDown}
        />

        {/* KPI 3: Taux d'Épargne */}
        <KPIMetric
          title="Taux d'Épargne (30j)"
          value={savingsRateFormatted}
          changeValue="Objectif: 15%"
          isPositive={!isLoading && true} 
          isLoading={isLoading}
          icon={Zap}
        />
        
        {/* KPI 4: Placeholder/Custom */}
         <KPIMetric
          title="Solde Proch. Jours"
          value="Prévision: 45 200 €"
          changeValue="+2% (simulé)"
          isPositive={!isLoading && true} 
          isLoading={isLoading}
          icon={DollarSign}
        />
      </div>

      {/* Section des Graphiques de Tendance (Mini Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Mini Chart 1: Historique de la Valeur Nette */}
        <MiniLineChart
          title="Évolution de la Valeur Nette (12M)"
          data={netWorthHistory}
          color="#4f46e5" // Indigo
          isLoading={isLoading}
        />

        {/* Mini Chart 2: Historique du Flux de Trésorerie */}
        <MiniLineChart
          title="Flux de Trésorerie Mensuel (12M)"
          data={cashFlowHistory.map(d => ({...d, value: d.value}))}
          color={isCashFlowPositive ? '#10b981' : '#ef4444'} // Émeraude ou Rouge
          isLoading={isLoading}
        />
      </div>
      
      {/* Section des Graphiques Détaillés (Bar Chart et Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Graphique 3: Flux de Trésorerie Mensuel Détaillé (2/3 largeur sur grand écran) */}
        <div className="lg:col-span-2">
            <CashFlowBarChart /> 
        </div>

        {/* Graphique 4: Répartition par Catégorie (1/3 largeur sur grand écran) */}
        <div className="lg:col-span-1">
            <CategoryBreakdown /> 
        </div>
      </div>
    </div>
  );
};