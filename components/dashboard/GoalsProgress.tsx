import React from "react";
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Target, Plane, Home as HomeIcon, Wallet, ArrowRight, TrendingUp, Gift, Car } from 'lucide-react';
import { Button } from '../ui/button';

interface Goal {
  id: string;
  name: string;
  current: number;
  target: number;
  deadline: string;
  icon?: string;
  color?: string;
}

interface GoalsProgressProps {
  goals: Goal[];
  onNavigate?: (page: string) => void;
}

const iconMap: Record<string, any> = {
  wallet: Wallet,
  plane: Plane,
  home: HomeIcon,
  target: Target,
  trending: TrendingUp,
  gift: Gift,
  car: Car,
};

export function GoalsProgress({ goals, onNavigate = () => {} }: GoalsProgressProps) {
  // ✅ Memoize filtering and sorting to prevent memory buildup
  const activeGoals = React.useMemo(() => {
    return goals
      .filter(g => g.current < g.target)
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 3);
  }, [goals]);
  return (
    <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
            <Target className="w-5 h-5" />
            Objectifs en Cours
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('goals')}
            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {activeGoals.length === 0 ? (
          <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Aucun objectif en cours
            </p>
            <button
              onClick={() => onNavigate('goals')}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Créer un objectif
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent pr-2 flex-1">
            {activeGoals.map((goal, index) => {
            const Icon = iconMap[goal.icon?.toLowerCase() || 'target'] || Target;
            const goalColor = goal.color || '#3B82F6';
            const progress = (goal.current / goal.target) * 100;
            const remaining = goal.target - goal.current;
            const daysLeft = Math.ceil(
              (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2 cursor-pointer"
                onClick={() => onNavigate('goals')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${goalColor}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: goalColor }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{goal.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {daysLeft > 0 ? `${daysLeft}j restants` : 'Dépassé'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{progress.toFixed(0)}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {remaining.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                  </p>
                </div>
              </div>

                <div className="space-y-1">
                  <Progress value={progress} className="h-1.5" style={{ backgroundColor: `${goalColor}20` }}>
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: goalColor,
                      }}
                    />
                  </Progress>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{goal.current.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€</span>
                  <span>{goal.target.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€</span>
                </div>
                </div>
              </motion.div>
            );
          })}
          </div>
        )}

        {activeGoals.length > 0 && (
          <button 
          onClick={() => onNavigate('goals')}
          className="w-full p-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mt-auto"
          >
            + Ajouter un objectif
          </button>
        )}
      </CardContent>
    </Card>
  );
}
