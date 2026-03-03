import { useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Wallet, TrendingUp, CheckCircle, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Imports Feature
import { 
  useBudgets, 
  BudgetCard, 
  BudgetFormDialog, 
  BudgetTransactionsDialog,
  EnrichedBudget // On importe le type pour garantir la cohérence
} from '@/features/budgets';

// Import du type global et context
import { Budget, useData } from '@/contexts/DataContext';

import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';

export function BudgetsPage() {
  const { 
    budgets, 
    totalAllocated, 
    totalSpent, 
    saveBudget, 
    removeBudget, 
    categories, 
    people 
  } = useBudgets();

  const { transactions } = useData();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<EnrichedBudget | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // ✅ CORRECTION : On s'assure que filteredBudgets contient bien toutes les propriétés de EnrichedBudget
  const filteredBudgets = useMemo(() => {
    return budgets
      .filter(b => !b.month || b.month === selectedMonth)
      .map(b => {
        // On calcule les propriétés manquantes "à la volée" si elles n'existent pas
        // Cela garantit que BudgetCard reçoit un objet complet
        const spent = b.spent || 0;
        const allocated = b.allocated || 0;
        return {
          ...b,
          progress: allocated > 0 ? (spent / allocated) * 100 : 0,
          remaining: allocated - spent,
          isOverspent: spent > allocated,
          transactionsCount: 0 // Optionnel, selon ton besoin d'affichage
        } as EnrichedBudget;
      });
  }, [budgets, selectedMonth]);

  const totalRemaining = totalAllocated - totalSpent;

  const handleConfirmDelete = (budget: Budget) => {
    toast.custom((t) => (
      <Card className="bg-white dark:bg-gray-900 border border-red-400 p-4 shadow-2xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Trash2 className="w-5 h-5 text-red-600 mt-1" />
            <div>
              <CardTitle className="text-lg">Supprimer {budget.name} ?</CardTitle>
              <p className="text-sm text-gray-500">Cette action est irréversible.</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.dismiss(t)}>Annuler</Button>
            <Button variant="destructive" size="sm" onClick={() => {
              removeBudget(budget.id);
              toast.dismiss(t);
              toast.success("Budget supprimé");
            }}>Confirmer</Button>
          </div>
        </div>
      </Card>
    ), { duration: Infinity });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/20 dark:from-gray-950 p-6">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-pink-600">
              Mes Enveloppes
            </h1>
            <p className="text-gray-500">Gérez vos dépenses par compartiments</p>
          </div>
          
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-900 px-4 py-2 rounded-xl border">
                <Calendar className="w-4 h-4 text-orange-500" />
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent outline-none text-sm font-bold dark:text-white"
                />
            </div>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg">
              <Plus className="w-4 h-4 mr-2" /> Créer une enveloppe
            </Button>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Budget Total" value={totalAllocated} icon={<Wallet />} color="blue" />
          <StatCard title="Dépensé" value={totalSpent} icon={<TrendingUp />} color="red" subtitle={`${Math.round((totalSpent/totalAllocated)*100 || 0)}% utilisé`} />
          <StatCard title="Disponible" value={totalRemaining} icon={<CheckCircle />} color="green" />
        </div>

        {/* Grille de Budgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBudgets.map((budget, idx) => (
            <BudgetCard
              key={budget.id}
              budget={budget} // Ici, le budget est maintenant de type EnrichedBudget
              index={idx}
              onEdit={(b) => setEditingBudget(b as Budget)}
              onDelete={() => handleConfirmDelete(budget as Budget)}
              onClick={() => setSelectedBudget(budget)}
            />
          ))}
        </div>

        {/* Modales */}
        <AnimatePresence>
          {(showCreateDialog || editingBudget) && (
            <BudgetFormDialog
              budget={editingBudget}
              onClose={() => { setShowCreateDialog(false); setEditingBudget(null); }}
              onSave={async (b) => { await saveBudget(b); setShowCreateDialog(false); setEditingBudget(null); }}
              categories={categories}
              people={people}
            />
          )}
          {selectedBudget && (
            <BudgetTransactionsDialog
              budget={selectedBudget}
              transactions={transactions}
              people={people}
              onClose={() => setSelectedBudget(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, subtitle }: any) {
  const colors: any = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/20",
    red: "from-red-500 to-pink-600 shadow-red-500/20",
    green: "from-emerald-500 to-teal-600 shadow-emerald-500/20"
  };
  return (
    <div className={`bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors[color]} opacity-10 rounded-bl-[100px] group-hover:scale-110 transition-transform`} />
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl bg-gradient-to-br ${colors[color]} text-white`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-black">{formatCurrency(value)}</p>
          {subtitle && <p className="text-[10px] font-bold uppercase text-gray-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}