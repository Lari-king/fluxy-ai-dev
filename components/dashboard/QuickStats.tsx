import { motion } from 'framer-motion';
import { Card, CardContent } from '../ui/card';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

const stats = [
  {
    label: 'Solde actuel',
    value: '2 450 €',
    change: '+12.3%',
    isPositive: true,
    icon: DollarSign,
    color: '#3B82F6',
  },
  {
    label: 'Revenus ce mois',
    value: '3 200 €',
    change: 'Stable',
    isPositive: true,
    icon: TrendingUp,
    color: '#10B981',
  },
  {
    label: 'Dépenses ce mois',
    value: '2 780 €',
    change: '-8.5%',
    isPositive: true,
    icon: TrendingDown,
    color: '#EF4444',
  },
  {
    label: 'Économies ce mois',
    value: '420 €',
    change: '+45.2%',
    isPositive: true,
    icon: Calendar,
    color: '#F59E0B',
  },
];

export function QuickStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    stat.isPositive 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
