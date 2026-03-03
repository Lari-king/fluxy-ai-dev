// src/features/wealth-strategist/components/InvestmentCapacityCard.tsx
import React from 'react';
import { Zap, ArrowUpRight, Wallet, PieChart } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Progress } from '@/components/ui/progress';

interface CapacityProps {
  capacity: number;
  savings: number;
  rate: number;
}

export function InvestmentCapacityCard({ capacity, savings, rate }: CapacityProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border-2 border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Zap className="w-32 h-32 text-blue-600" />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-yellow-500 fill-current" />
              Moteur d'Investissement
            </h3>
            <p className="text-gray-500 font-medium">Ce que vous pouvez injecter sur les marchés chaque mois</p>
          </div>
          
          <div className="text-left md:text-right">
            <div className="text-4xl font-black text-blue-600 tracking-tighter">
              {formatCurrency(capacity)} <span className="text-lg text-gray-400">/ mois</span>
            </div>
            <div className="flex items-center gap-2 mt-1 md:justify-end text-sm font-bold text-green-600">
              <ArrowUpRight className="w-4 h-4" />
              Taux d'effort : {rate.toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-gray-500 flex items-center gap-2">
                <Wallet className="w-4 h-4" /> Épargne mensuelle nette
              </span>
              <span>{formatCurrency(savings)} €</span>
            </div>
            <Progress value={rate} className="h-2 bg-gray-100 dark:bg-gray-800" />
            <p className="text-[10px] text-gray-400 leading-tight">
              *Calculé sur la moyenne de vos revenus et dépenses des 30 derniers jours.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-6 flex items-center gap-6 border border-blue-100 dark:border-blue-800/50">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm">
              <PieChart className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-1">Potentiel de réallocation</p>
              <p className="text-sm text-blue-900 dark:text-blue-200 font-medium">
                Vous avez <span className="font-black underline">8,400 €</span> de liquidités qui pourraient rapporter <span className="font-black">58€/mois</span> supplémentaires.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}