import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, TrendingUp, Smile, AlertCircle, Home, Car, ShoppingBag, Coffee, Utensils, Zap, ChevronDown, ChevronUp, PieChart as PieChartIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface Transaction {
  amount: number;
  category?: string;
}

interface AllocationRingProps {
  transactions: Transaction[];
  totalIncome: number;
}

const categoryIcons: Record<string, any> = {
  'Famille': Users,
  'Investissements': TrendingUp,
  'Plaisir': Smile,
  'Dette': AlertCircle,
  'Logement': Home,
  'Transport': Car,
  'Shopping': ShoppingBag,
  'Alimentation': Utensils,
  'Loisirs': Coffee,
  'Autres': Zap,
};

const categoryColors: Record<string, string> = {
  'Famille': '#3B82F6',
  'Investissements': '#10B981',
  'Plaisir': '#F59E0B',
  'Dette': '#EF4444',
  'Logement': '#8B5CF6',
  'Transport': '#6B7280',
  'Shopping': '#EC4899',
  'Alimentation': '#14B8A6',
  'Loisirs': '#F97316',
  'Autres': '#64748B',
};

// Generate consistent color from string (for dynamic categories)
function generateColorFromString(str: string): string {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
    '#06B6D4', '#A855F7', '#F43F5E', '#8B5CF6', '#0EA5E9',
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function AllocationRing({ transactions, totalIncome }: AllocationRingProps) {
  const [showAll, setShowAll] = useState(false);
  const TOP_CATEGORIES_LIMIT = 6;

  // ✅ Memoize heavy calculations to prevent memory buildup
  const categorySpending = React.useMemo(() => {
    return transactions
      .filter(t => t.amount < 0)
      .reduce((acc, t) => {
        const cat = t.category || 'Autres';
        acc[cat] = (acc[cat] || 0) + Math.abs(t.amount);
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);

  // Convert to percentage of income and sort
  const allAllocationData = React.useMemo(() => {
    // 🔧 FIX: Calculer le total des dépenses pour le cas où totalIncome = 0
    const totalExpenses = Object.values(categorySpending).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(categorySpending)
      .map(([name, amount]) => ({
        name,
        // 🔧 FIX: Utiliser totalExpenses si pas de revenus (afficher en % des dépenses totales)
        value: totalIncome > 0 
          ? Math.round((amount / totalIncome) * 100) 
          : totalExpenses > 0 
            ? Math.round((amount / totalExpenses) * 100)
            : 0,
        amount,
        color: categoryColors[name] || generateColorFromString(name),
        icon: categoryIcons[name] || Zap,
      }))
      // 🔧 SUPPRIMÉ : .filter(item => item.value > 0) 
      // Cette ligne supprimait tout quand totalIncome = 0
      .filter(item => item.amount > 0) // Filtre sur amount au lieu de value
      .sort((a, b) => b.amount - a.amount); // Tri par montant au lieu de value
  }, [categorySpending, totalIncome]);

  // For chart: show top categories + "Autres" if there are more
  const chartData = React.useMemo(() => {
    const topCategories = allAllocationData.slice(0, TOP_CATEGORIES_LIMIT);
    const otherCategories = allAllocationData.slice(TOP_CATEGORIES_LIMIT);
    
    const data = [...topCategories];
    if (otherCategories.length > 0) {
      const otherTotal = otherCategories.reduce((sum, cat) => sum + cat.value, 0);
      const otherAmount = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
      data.push({
        name: `Autres (${otherCategories.length})`,
        value: otherTotal,
        amount: otherAmount,
        color: '#94A3B8',
        icon: Zap,
      });
    }
    return data;
  }, [allAllocationData]);

  // For legend: show based on showAll state
  const displayData = showAll ? allAllocationData : chartData;

  if (allAllocationData.length === 0) {
    return (
      <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <CardTitle className="text-base text-gray-900 dark:text-white">Allocation des Revenus</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aucune donnée d'allocation disponible
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <CardTitle className="text-base text-gray-900 dark:text-white">
              Allocation des Revenus
            </CardTitle>
          </div>
          {allAllocationData.length > TOP_CATEGORIES_LIMIT && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {allAllocationData.length} catégories
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent pr-2">
            <AnimatePresence mode="popLayout">
              {displayData.map((item, index) => {
                const Icon = item.icon;
                const maxValue = allAllocationData[0]?.value || 1;
                const barWidth = (item.value / maxValue) * 100;
                
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: showAll ? 0 : index * 0.03 }}
                        className="group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div 
                            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${item.color}20` }}
                          >
                            <Icon className="w-3 h-3" style={{ color: item.color }} />
                          </div>
                          <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              {item.amount.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}€
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                              {item.value}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ delay: showAll ? 0 : index * 0.03 + 0.1, duration: 0.5, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-xs">{item.name} : {item.amount.toLocaleString('fr-FR')}€ ({item.value}% des revenus)</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </AnimatePresence>

            {/* Show All / Show Less button */}
            {allAllocationData.length > TOP_CATEGORIES_LIMIT && (
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  className="w-full h-8 text-xs"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Voir moins
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Voir {allAllocationData.length - chartData.length} de plus
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
