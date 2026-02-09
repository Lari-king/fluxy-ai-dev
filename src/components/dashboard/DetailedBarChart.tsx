import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // Importation UI standard
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/format';
import { useData } from '@/contexts/DataContext';

interface Transaction {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  [key: string]: any;
}

interface MonthlyData {
  month: string; // Ex: 'Jan 24'
  income: number;
  expenses: number;
}

/**
 * Affiche un graphique à barres empilées/groupées des revenus et dépenses mensuels.
 * Utilise les 12 derniers mois.
 */
export const CashFlowBarChart: React.FC = () => {
  const { transactions, loading } = useData();

  const monthlyData = useMemo(() => {
    if (loading || !transactions) return [];

    const txs = transactions as Transaction[];
    const monthlyMap = new Map<string, { income: number, expenses: number }>();
    const today = new Date();
    
    // Déterminer le mois de début (12 mois en arrière)
    const twelveMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 11, 1);

    // Initialiser les 12 derniers mois dans la map pour garantir l'ordre et l'exhaustivité
    for (let i = 0; i < 12; i++) {
        const date = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
        const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        monthlyMap.set(monthKey, { income: 0, expenses: 0 });
    }

    // Processer les transactions
    for (const tx of txs) {
      const date = new Date(tx.date);
      if (date < twelveMonthsAgo) continue; // Filtrer les transactions trop anciennes
      
      const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

      // S'assurer que la clé existe (devrait être le cas avec l'initialisation, mais au cas où)
      if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { income: 0, expenses: 0 });
      }

      const current = monthlyMap.get(monthKey)!;

      if (tx.amount > 0) {
        current.income += tx.amount;
      } else {
        current.expenses += Math.abs(tx.amount); // Stocker les dépenses en valeur absolue (positive)
      }
      monthlyMap.set(monthKey, current);
    }
    
    // Convertir la Map en tableau formaté
    const data: MonthlyData[] = Array.from(monthlyMap.entries())
        .map(([month, values]) => ({
            month,
            income: parseFloat(values.income.toFixed(0)),
            expenses: parseFloat(values.expenses.toFixed(0)),
        }))
        // Re-trier par date réelle car toLocaleDateString peut ne pas être lexicographiquement triable
        .sort((a, b) => {
            // Logique de tri simple par la position des mois dans le cycle de 12 mois
            const monthNames = Array.from(monthlyMap.keys());
            return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
        });

    return data;
  }, [transactions, loading]);


  if (loading || monthlyData.length === 0) {
    return (
      <Card className="h-[400px] flex items-center justify-center">
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }

  // Custom Tooltip pour Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expenses = payload.find((p: any) => p.dataKey === 'expenses')?.value || 0;
      const cashFlow = income - expenses;
      
      return (
        <div className="p-2 text-xs bg-white border rounded shadow dark:bg-gray-800 dark:border-gray-700">
          <p className="font-bold text-gray-900 dark:text-white">{label}</p>
          <p className="text-emerald-500">Revenu: {formatCurrency(income, 0)}</p>
          <p className="text-red-500">Dépense: {formatCurrency(expenses, 0)}</p>
          <p className={`font-semibold ${cashFlow >= 0 ? 'text-blue-500' : 'text-red-700'}`}>
            Flux Net: {formatCurrency(cashFlow, 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-[400px] w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Flux de Trésorerie Mensuel (12 Derniers Mois)</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyData}
            margin={{ top: 5, right: 0, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" className="dark:stroke-gray-700" />
            <XAxis dataKey="month" stroke="#9ca3af" className="text-xs" />
            <YAxis 
                tickFormatter={(value) => formatCurrency(value, 0, false)} // Affiche sans symbole pour la lisibilité de l'axe
                stroke="#9ca3af" 
                className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="income" name="Revenus" fill="#10b981" /> {/* Emerald-500 */}
            <Bar dataKey="expenses" name="Dépenses" fill="#ef4444" /> {/* Red-500 */}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};