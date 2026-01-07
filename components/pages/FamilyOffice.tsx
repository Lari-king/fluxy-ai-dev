import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { 
  Briefcase, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Edit2,
  Trash2,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { formatCurrency, formatPercentage } from '../../src/utils/format';

interface Investment {
  id: string;
  name: string;
  type: 'private-equity' | 'real-estate' | 'venture-capital' | 'crypto' | 'other';
  initialAmount: number;
  currentValue: number;
  date: string;
  status: 'active' | 'exited' | 'pending';
  notes?: string;
  linkedTransactionIds?: string[];
}

export function FamilyOffice() {
  const { accessToken } = useAuth();
  const { transactions, loading } = useData();
  
  const [investments, setInvestments] = useState<Investment[]>([
    {
      id: '1',
      name: 'Startup Tech AI',
      type: 'private-equity',
      initialAmount: 50000,
      currentValue: 75000,
      date: '2024-01-15',
      status: 'active',
      notes: 'Investissement dans une startup IA prometteuse'
    },
    {
      id: '2',
      name: 'Fonds Immobilier Paris',
      type: 'real-estate',
      initialAmount: 100000,
      currentValue: 120000,
      date: '2023-06-20',
      status: 'active',
      notes: 'SCPI rendement 5%'
    }
  ]);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Calculs
  const totalInvested = investments.reduce((sum, inv) => sum + inv.initialAmount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalReturn = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

  // Répartition par type
  const investmentsByType = investments.reduce((acc, inv) => {
    const type = inv.type;
    if (!acc[type]) {
      acc[type] = { count: 0, value: 0 };
    }
    acc[type].count++;
    acc[type].value += inv.currentValue;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'private-equity': 'Private Equity',
      'real-estate': 'Immobilier',
      'venture-capital': 'Venture Capital',
      'crypto': 'Crypto',
      'other': 'Autre'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'private-equity': 'from-blue-500 to-indigo-600',
      'real-estate': 'from-green-500 to-emerald-600',
      'venture-capital': 'from-purple-500 to-pink-600',
      'crypto': 'from-orange-500 to-yellow-600',
      'other': 'from-gray-500 to-gray-600'
    };
    return colors[type] || colors.other;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/30 dark:from-gray-950 dark:via-indigo-950/20 dark:to-blue-950/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 relative mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 rounded-full animate-spin" 
                 style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de votre Family Office...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/30 dark:from-gray-950 dark:via-indigo-950/20 dark:to-blue-950/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600">
                Family Office
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez vos investissements en Private Equity et autres actifs
              </p>
            </div>
            
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg shadow-indigo-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel investissement
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Investissements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-blue-600">{investments.length}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Capital investi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-purple-600">
                  {formatCurrency(totalInvested)} €
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Valeur actuelle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-green-600">
                  {formatCurrency(totalCurrentValue)} €
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <Card className={`border-2 ${totalGainLoss >= 0 ? 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30' : 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {totalGainLoss >= 0 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                  Gain / Perte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalGainLoss >= 0 ? '+' : ''}{formatCurrency(totalGainLoss)} €
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {formatPercentage(totalReturn)}%
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Investments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {investments.map((investment, index) => {
            const gainLoss = investment.currentValue - investment.initialAmount;
            const returnPercentage = (gainLoss / investment.initialAmount) * 100;
            
            return (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className="border-2 hover:shadow-2xl transition-all duration-300">
                  <div className={`h-1.5 bg-gradient-to-r ${getTypeColor(investment.type)}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{investment.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={`bg-gradient-to-r ${getTypeColor(investment.type)} text-white border-0`}>
                            {getTypeLabel(investment.type)}
                          </Badge>
                          <Badge variant="outline" className={investment.status === 'active' ? 'border-green-500 text-green-700 dark:text-green-400' : 'border-gray-500'}>
                            {investment.status === 'active' ? 'Actif' : investment.status === 'exited' ? 'Sorti' : 'En attente'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center text-blue-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Capital investi</div>
                          <div className="text-lg">{formatCurrency(investment.initialAmount)} €</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valeur actuelle</div>
                          <div className="text-lg">{formatCurrency(investment.currentValue)} €</div>
                        </div>
                      </div>
                      
                      <div className={`${gainLoss >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'} rounded-xl p-3`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Performance</div>
                            <div className={`text-xl ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)} €
                            </div>
                          </div>
                          <div className={`text-2xl ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(returnPercentage)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Investi le {new Date(investment.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>

                      {investment.notes && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                          {investment.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Répartition par type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Répartition des investissements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(investmentsByType).map(([type, data]) => {
                  const percentage = (data.value / totalCurrentValue) * 100;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">{getTypeLabel(type)}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatCurrency(data.value)} € ({formatPercentage(percentage)}%)
                        </span>
                      </div>
                      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 1 }}
                          className={`h-full rounded-full bg-gradient-to-r ${getTypeColor(type)}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
