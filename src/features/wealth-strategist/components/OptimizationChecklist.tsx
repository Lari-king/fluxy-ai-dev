// src/features/wealth-strategist/components/OptimizationChecklist.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  ArrowUpRight, 
  Zap, 
  AlertCircle 
} from 'lucide-react';
import { useWealthAnalysis } from '../hooks/useWealthAnalysis';
import { formatCurrency } from '@/utils/format';

export function OptimizationChecklist() {
  const { liquidAssets, savingsRate, investmentCapacity } = useWealthAnalysis();

  // Logique de recommandations dynamiques
  const recommendations = [
    {
      id: '1',
      title: "Optimisation du Cash Dormant",
      description: `Vous avez ${formatCurrency(liquidAssets)} € sur vos comptes courants. En plaçant 50% sur un support à 4%, vous générez ${formatCurrency((liquidAssets * 0.5 * 0.04) / 12)} € / mois de revenus passifs.`,
      impact: "Revenu Passif",
      status: liquidAssets > 10000 ? 'todo' : 'done',
      icon: <Zap className="w-5 h-5 text-yellow-500" />
    },
    {
      id: '2',
      title: "Seuil de Liberté Financière",
      description: `Votre taux d'épargne actuel est de ${savingsRate.toFixed(1)}%. En l'augmentant à 35%, vous avancez votre date de retraite de 4 ans.`,
      impact: "Liberté +4 ans",
      status: savingsRate < 35 ? 'todo' : 'done',
      icon: <TrendingUp className="w-5 h-5 text-blue-500" />
    },
    {
      id: '3',
      title: "Diversification Family Office",
      description: "Votre exposition aux actifs alternatifs est faible. Pensez à allouer 5% de votre capacité mensuelle au Private Equity.",
      impact: "+2% Rendement Global",
      status: 'todo',
      icon: <ArrowUpRight className="w-5 h-5 text-green-500" />
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border-2 border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black">Checklist d'Optimisation</h3>
          <p className="text-sm text-gray-500">Actions prioritaires pour votre patrimoine</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-2xl text-blue-700 dark:text-blue-300 text-xs font-bold">
          {recommendations.filter(r => r.status === 'done').length} / {recommendations.length} complété
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-5 rounded-3xl border-2 transition-all flex gap-4 ${
              item.status === 'done' 
              ? 'bg-gray-50/50 dark:bg-gray-800/20 border-transparent opacity-60' 
              : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-500'
            }`}
          >
            <div className="mt-1">
              {item.status === 'done' ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300" />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">{item.title}</span>
                  {item.icon}
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                  item.status === 'done' ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'
                }`}>
                  {item.impact}
                </span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                {item.description}
              </p>
              
              {item.status === 'todo' && (
                <button className="mt-4 text-xs font-black text-blue-600 flex items-center gap-1 hover:underline group">
                  Appliquer la recommandation
                  <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Alerte Contextuelle */}
      <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl flex gap-3 items-center">
        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
        <p className="text-xs text-orange-800 dark:text-orange-300 font-medium">
          Vos dépenses "Loisirs" ont augmenté de 12% ce mois-ci, réduisant votre capacité d'investissement de {formatCurrency(investmentCapacity * 0.12)} €.
        </p>
      </div>
    </div>
  );
}