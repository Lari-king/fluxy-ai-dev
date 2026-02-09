import React, { useState } from 'react';
import { motion } from 'framer-motion'; // Ajusté pour utiliser framer-motion, la librairie standard
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Calendar, HelpCircle, Trophy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SavingsGoalProps {
  currentNetWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

const GOAL_OPTIONS = [
  { value: 5000, label: '5k' },
  { value: 10000, label: '10k' },
  { value: 50000, label: '50k' },
  { value: 100000, label: '100k' },
  { value: 1000000, label: '1M' },
];

export function SavingsGoal({ 
  currentNetWorth, 
  monthlyIncome,
  monthlyExpenses 
}: SavingsGoalProps) {
  const baseMonthlySavings = monthlyIncome - monthlyExpenses;
  const [selectedGoal, setSelectedGoal] = useState(50000);
  const [monthlySavings, setMonthlySavings] = useState(Math.max(0, baseMonthlySavings));

  // Calcul des mois pour atteindre l'objectif (sans rendement pour être prudent)
  const calculateMonthsToGoal = (goal: number, savings: number) => {
    if (savings <= 0) return 999;
    const remainingAmount = goal - currentNetWorth;
    if (remainingAmount <= 0) return 0;
    return Math.ceil(remainingAmount / savings);
  };

  const baseMonths = calculateMonthsToGoal(selectedGoal, baseMonthlySavings);
  const adjustedMonths = calculateMonthsToGoal(selectedGoal, monthlySavings);
  const savedMonths = baseMonths - adjustedMonths;
  const yearsToGoal = (adjustedMonths / 12).toFixed(1);

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + adjustedMonths);

  const progressPercentage = currentNetWorth >= selectedGoal ? 100 : 
    Math.max(0, Math.min(100, (currentNetWorth / selectedGoal) * 100));

  // Jalons intermédiaires
  const milestones = [
    { amount: 0, label: '0€' },
    { amount: 5000, label: '5k€' },
    { amount: 10000, label: '10k€' },
    { amount: 25000, label: '25k€' },
    { amount: 50000, label: '50k€' },
    { amount: 100000, label: '100k€' },
  ].filter(m => m.amount < selectedGoal);

  milestones.push({ amount: selectedGoal, label: `${selectedGoal >= 1000 ? (selectedGoal/1000)+'k' : selectedGoal}€` });

  const getMilestoneStatus = (amount: number) => {
    if (currentNetWorth >= amount) return 'completed';
    return 'pending';
  };

  const getMilestoneMonths = (amount: number) => {
    if (currentNetWorth >= amount) return 0;
    return calculateMonthsToGoal(amount, monthlySavings);
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 backdrop-blur-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Objectif Épargne
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
                  <strong>Calcul :</strong> Mois = (Objectif - Patrimoine actuel) ÷ Épargne mensuelle
                  <br />
                  <strong>Exemple :</strong> ({selectedGoal.toLocaleString('fr-FR')}€ - {currentNetWorth.toLocaleString('fr-FR')}€) ÷ {monthlySavings.toLocaleString('fr-FR')}€ = {adjustedMonths} mois
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Sélection d'objectif */}
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Choisis ton objectif :</p>
          <div className="flex gap-2 flex-wrap">
            {GOAL_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={selectedGoal === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedGoal(option.value)}
                className="flex-1 min-w-[60px]"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Objectif et progression */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Objectif</p>
          <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            {selectedGoal.toLocaleString('fr-FR')}€
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Patrimoine actuel</p>
          <div className={`text-lg font-medium mb-2 ${currentNetWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {currentNetWorth.toLocaleString('fr-FR')}€
          </div>

          {/* Barre de progression */}
          <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            />
          </div>

          {/* Durée */}
          <motion.div
            key={adjustedMonths}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1"
          >
            {yearsToGoal}
          </motion.div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">années</p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{targetDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
          </div>

          {savedMonths > 0 && (
            <Badge variant="outline" className="mt-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
              🚀 {(savedMonths / 12).toFixed(1)} ans économisés !
            </Badge>
          )}
        </div>

        {/* Jalons */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700">
          <p className="text-xs font-medium text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            Jalons à franchir :
          </p>
          <div className="space-y-1.5">
            {milestones.map((milestone) => {
              const status = getMilestoneStatus(milestone.amount);
              const months = getMilestoneMonths(milestone.amount);
              return (
                <div
                  key={milestone.amount}
                  className={`flex items-center justify-between text-xs ${
                    status === 'completed' 
                      ? 'text-green-700 dark:text-green-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {status === 'completed' ? '✅' : '🎯'}
                    {milestone.label}
                  </span>
                  <span className="text-[10px]">
                    {status === 'completed' ? 'Atteint !' : `dans ${months} mois`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Slider d'épargne */}
        <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
          <p className="text-xs font-medium text-pink-900 dark:text-pink-300 mb-2">💪 Boost ton épargne :</p>
          <Slider
            value={[monthlySavings]}
            onValueChange={(values) => setMonthlySavings(values[0])}
            min={0}
            max={1000}
            step={50}
            className="mb-2"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              +{monthlySavings.toLocaleString('fr-FR')}€/mois
            </span>
            {savedMonths > 0 && (
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                {(savedMonths / 12).toFixed(1)} ans gagnés
              </Badge>
            )}
          </div>
        </div>

        {/* Impact message */}
        {monthlySavings > baseMonthlySavings && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
          >
            <p className="text-xs text-green-700 dark:text-green-400">
              💚 <strong>Impact :</strong> Objectif atteint en {yearsToGoal} ans au lieu de {(baseMonths / 12).toFixed(1)} !
              <br />
              📈 Économie : {(savedMonths / 12).toFixed(1)} ans gagnés !
            </p>
          </motion.div>
        )}

        {/* Calcul transparent */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">💡 Calcul :</p>
          <div className="space-y-0.5 text-[10px] text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>• Épargne mensuelle:</span>
              <span className="font-medium">{monthlySavings.toLocaleString('fr-FR')}€/mois</span>
            </div>
            <div className="flex justify-between">
              <span>• Rendement:</span>
              <span className="font-medium">0% (prudent)</span>
            </div>
            <div className="flex justify-between">
              <span>• Mois nécessaires:</span>
              <span className="font-medium">({selectedGoal.toLocaleString('fr-FR')}€ - {currentNetWorth.toLocaleString('fr-FR')}€) ÷ {monthlySavings.toLocaleString('fr-FR')}€ = {adjustedMonths}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}