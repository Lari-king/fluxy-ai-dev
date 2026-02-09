import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Calendar } from 'lucide-react';

interface OverdraftIndicatorProps {
  currentBalance: number;
}

export function OverdraftIndicator({ currentBalance }: OverdraftIndicatorProps) {
  const isCurrentlyInOverdraft = currentBalance < 0;
  const daysUntilOverdraftExit = 45; // If currently in overdraft
  const exitDate = new Date();
  exitDate.setDate(exitDate.getDate() + daysUntilOverdraftExit);

  // Scenarios
  const scenarios = [
    {
      name: 'Scénario actuel',
      days: 45,
      color: '#3B82F6',
      emoji: '📊',
    },
    {
      name: 'Scénario optimiste',
      days: 28,
      color: '#10B981',
      emoji: '🚀',
    },
    {
      name: 'Scénario pessimiste',
      days: 72,
      color: '#F59E0B',
      emoji: '⚠️',
    },
  ];

  if (!isCurrentlyInOverdraft) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 backdrop-blur-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            État du Découvert
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
              Aucun découvert !
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Continue comme ça, tu gères parfaitement ta trésorerie
            </p>
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Ton solde reste positif selon les projections actuelles
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-white">
          <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          Sortie du Découvert
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-5xl mb-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          >
            {daysUntilOverdraftExit}
          </motion.div>
          <p className="text-base text-gray-700 dark:text-gray-300 mb-1">jours</p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{exitDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          {scenarios.map((scenario, index) => (
            <motion.div
              key={scenario.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-2.5 rounded-lg"
              style={{ backgroundColor: `${scenario.color}10` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{scenario.emoji}</span>
                <span className="text-xs text-gray-900 dark:text-white">{scenario.name}</span>
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">{scenario.days}j</span>
            </motion.div>
          ))}
        </div>

        <div className="pt-3 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            💡 Réduire tes dépenses de 200€/mois te ferait sortir 15j plus tôt
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
