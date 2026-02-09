import React, { useState } from 'react';
import { motion } from 'framer-motion'; // motion/react n'est pas un import standard, j'utilise framer-motion qui est la librairie la plus courante
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Chemin ajusté
import { AlertCircle, CheckCircle, Calendar, TrendingUp, HelpCircle, Scissors } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Chemin ajusté
import { Slider } from '@/components/ui/slider'; // Chemin ajusté
import { Badge } from '@/components/ui/badge'; // Chemin ajusté
import { Button } from '@/components/ui/button'; // Chemin ajusté

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  emoji: string;
}

interface BalanceRecoveryProps {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  topCategories: CategorySpending[];
}

export function BalanceRecovery({ 
  currentBalance, 
  monthlyIncome, 
  monthlyExpenses,
  topCategories 
}: BalanceRecoveryProps) {
  const [reductionAmount, setReductionAmount] = useState(0);
  const [categoryReductions, setCategoryReductions] = useState<Record<string, number>>({});

  const isInOverdraft = currentBalance < 0;
  const monthlySavings = monthlyIncome - monthlyExpenses;
  
  // Calcul des jours pour sortir du découvert
  const calculateDaysToRecovery = (reduction: number) => {
    if (!isInOverdraft) return 0;

    // Si l'épargne nette est positive (mensualités > dépenses), on calcule
    if (monthlySavings > 0) {
        const adjustedSavings = monthlySavings + reduction;
        if (adjustedSavings <= 0) return 999; // Cas où la réduction est insuffisante pour maintenir une épargne positive
        const dailySavings = adjustedSavings / 30;
        return Math.ceil(Math.abs(currentBalance) / dailySavings);
    } 
    
    // Si l'épargne nette est négative (dépenses > mensualités), il faut une réduction
    // pour avoir une épargne nette positive (monthlySavings + reduction > 0).
    else if (monthlySavings <= 0) {
        const adjustedSavings = monthlySavings + reduction;
        if (adjustedSavings <= 0) return 999; // Toujours en déficit même avec la réduction
        const dailySavings = adjustedSavings / 30;
        return Math.ceil(Math.abs(currentBalance) / dailySavings);
    }

    return 999; // Default fallback pour éviter les divisions par zéro
  };

  const baseDays = calculateDaysToRecovery(0);
  const adjustedDays = calculateDaysToRecovery(reductionAmount);
  const savedDays = baseDays === 999 ? 0 : baseDays - adjustedDays; // Ne pas calculer si le baseDays est 999

  const exitDate = new Date();
  exitDate.setDate(exitDate.getDate() + adjustedDays);

  // Le progrès est calculé en comparant le découvert (Abs(currentBalance)) à ce que 
  // l'on épargne en un mois (monthlySavings * 30).
  const progressPercentage = isInOverdraft ? 
    Math.min(100, ((monthlySavings + reductionAmount) * 30 / Math.abs(currentBalance)) * 100)
    : 100;

  const handleCategoryQuickCut = (category: string, currentAmount: number) => {
    const reduction = currentAmount * 0.1; // 10% de réduction
    setCategoryReductions(prev => ({
      ...prev,
      [category]: (prev[category] || 0) + reduction
    }));
    setReductionAmount(prev => prev + reduction);
  };

  const handleSliderChange = (values: number[]) => {
    // Lorsque le slider est utilisé, on écrase les réductions par catégorie
    // pour ne pas cumuler le slider et les clics rapides, simplifiant la simulation.
    setReductionAmount(values[0]);
    setCategoryReductions({});
  };

  if (!isInOverdraft) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            Retour à l'Équilibre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="text-5xl mb-2"
            >
              ✅
            </motion.div>
            <p className="text-base font-medium text-green-700 dark:text-green-400 mb-1">
              Équilibre maintenu !
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Continue comme ça, ton solde reste positif
            </p>
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Revenus mensuels:</span>
                <span className="font-medium text-green-600">+{monthlyIncome.toLocaleString('fr-FR')}€</span>
              </div>
              <div className="flex justify-between">
                <span>Dépenses mensuelles:</span>
                <span className="font-medium text-red-600">-{monthlyExpenses.toLocaleString('fr-FR')}€</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                <span>Épargne nette:</span>
                <span className="font-medium text-gray-900 dark:text-white">+{monthlySavings.toLocaleString('fr-FR')}€/mois</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Composant pour l'état de découvert
  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            Retour à l'Équilibre
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <HelpCircle className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  <strong>Calcul :</strong> Jours = |Solde| ÷ (Épargne nette / 30)
                  <br />
                  <strong>Exemple :</strong> {Math.abs(currentBalance).toLocaleString('fr-FR')}€ ÷ ({monthlySavings.toLocaleString('fr-FR')}€ / 30) = {baseDays === 999 ? 'Infini' : baseDays} jours
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Solde actuel */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Solde actuel</p>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            {currentBalance.toLocaleString('fr-FR')}€
          </div>
          
          {/* Barre de progression */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="absolute h-full bg-gradient-to-r from-red-500 via-orange-500 to-green-500 rounded-full"
            />
          </div>

          {/* Jours restants */}
          <motion.div
            key={adjustedDays}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1"
          >
            {adjustedDays === 999 ? '∞' : adjustedDays}
          </motion.div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">jours</p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{adjustedDays === 999 ? 'Impossible' : exitDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          {savedDays > 0 && (
            <Badge variant="outline" className="mt-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
              🚀 {savedDays} jours économisés !
            </Badge>
          )}
        </div>

        {/* Détails du calcul */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">💡 Comment ce calcul est fait :</p>
          <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex justify-between">
              <span>• Revenus mensuels:</span>
              <span className="font-medium text-green-600">+{monthlyIncome.toLocaleString('fr-FR')}€</span>
            </div>
            <div className="flex justify-between">
              <span>• Dépenses mensuelles:</span>
              <span className="font-medium text-red-600">-{monthlyExpenses.toLocaleString('fr-FR')}€</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-blue-200 dark:border-blue-800">
              <span>• Épargne nette:</span>
              <span className="font-medium">+{monthlySavings.toLocaleString('fr-FR')}€/mois</span>
            </div>
            <div className="flex justify-between">
              <span>• Jours pour 0€ (sans réduction):</span>
              <span className="font-medium">{baseDays === 999 ? 'Impossible' : `${Math.abs(currentBalance).toLocaleString('fr-FR')}€ ÷ (${monthlySavings.toLocaleString('fr-FR')}€/30) = ${baseDays}j`}</span>
            </div>
          </div>
        </div>

        {/* Top catégories */}
        {topCategories.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">🎯 Tes plus grosses dépenses :</p>
            <div className="space-y-2">
              {topCategories.slice(0, 3).map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {cat.category}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {cat.amount.toLocaleString('fr-FR')}€ ({cat.percentage.toFixed(0)}% du total)
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCategoryQuickCut(cat.category, cat.amount)}
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={`Simuler -10% de ${cat.category}`}
                  >
                    <Scissors className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slider de simulation */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <p className="text-xs font-medium text-purple-900 dark:text-purple-300 mb-2">🔧 Simule une réduction :</p>
          <Slider
            value={[reductionAmount]}
            onValueChange={handleSliderChange}
            max={Math.max(500, monthlyExpenses)} // Max slider est la plus grande des deux valeurs: 500 ou toutes les dépenses mensuelles
            step={10}
            className="mb-2"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Réduction simulée : -{reductionAmount.toLocaleString('fr-FR')}€/mois
            </span>
            {(reductionAmount > 0 && savedDays > 0) && (
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                {savedDays}j gagnés
              </Badge>
            )}
            {reductionAmount > 0 && adjustedDays === 999 && (
              <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
                ⚠️ Toujours déficitaire
              </Badge>
            )}
          </div>
        </div>

        {/* Impact message */}
        {reductionAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
          >
            <p className="text-xs text-green-700 dark:text-green-400">
              💚 <strong>Impact :</strong> Sortie en {adjustedDays} jours au lieu de {baseDays === 999 ? 'Impossible' : baseDays} !
              <br />
              Nouvelle épargne nette : {(monthlySavings + reductionAmount).toLocaleString('fr-FR')}€/mois
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}