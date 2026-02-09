/**
 * 🗄️ DATA MANAGEMENT TAB - VERSION 2026
 * 
 * Design harmonisé :
 * - Statistiques visuelles
 * - Export/suppression optimisés
 * - Performance avec useMemo/useCallback
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Trash2, 
  AlertTriangle, 
  Shield, 
  Download,
  X,
  CheckCircle2
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

export function DataManagementTab() {
  const { 
    transactions, 
    budgets, 
    goals, 
    people, 
    accounts, 
    categories,
    rules,
    updateTransactions,
    updateBudgets,
    updateGoals,
    updatePeople,
    updateAccounts,
    updateCategories,
    updateRules
  } = useData();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Statistiques
  const stats = useMemo(() => ({
    transactions: transactions.length,
    budgets: budgets.length,
    goals: goals.length,
    people: people.length,
    accounts: accounts.length,
    categories: categories.length,
    rules: rules.length
  }), [transactions, budgets, goals, people, accounts, categories, rules]);

  const totalItems = useMemo(() => 
    Object.values(stats).reduce((sum, count) => sum + count, 0),
    [stats]
  );

  const handleExportData = useCallback(() => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {
          transactions,
          budgets,
          goals,
          people,
          accounts,
          categories,
          rules
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `flux-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Données exportées avec succès');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erreur lors de l\'export');
    }
  }, [transactions, budgets, goals, people, accounts, categories, rules]);

  const handleDeleteAllData = useCallback(async () => {
    if (confirmationText !== 'SUPPRIMER TOUT') {
      toast.error('Veuillez saisir exactement "SUPPRIMER TOUT"');
      return;
    }

    setIsDeleting(true);
    
    try {
      await Promise.all([
        updateTransactions([]),
        updateBudgets([]),
        updateGoals([]),
        updatePeople([]),
        updateAccounts([]),
        updateCategories([]),
        updateRules([])
      ]);

      toast.success('Toutes les données ont été supprimées', {
        description: 'Votre compte est maintenant vide'
      });

      setShowDeleteDialog(false);
      setConfirmationText('');
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  }, [confirmationText, updateTransactions, updateBudgets, updateGoals, updatePeople, updateAccounts, updateCategories, updateRules]);

  const statCards = useMemo(() => [
    { label: 'Transactions', count: stats.transactions, gradient: 'from-cyan-500/20 to-cyan-500/5', border: 'border-cyan-500/30' },
    { label: 'Budgets', count: stats.budgets, gradient: 'from-green-500/20 to-green-500/5', border: 'border-green-500/30' },
    { label: 'Objectifs', count: stats.goals, gradient: 'from-purple-500/20 to-purple-500/5', border: 'border-purple-500/30' },
    { label: 'Personnes', count: stats.people, gradient: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/30' },
    { label: 'Comptes', count: stats.accounts, gradient: 'from-blue-500/20 to-blue-500/5', border: 'border-blue-500/30' },
    { label: 'Catégories', count: stats.categories, gradient: 'from-pink-500/20 to-pink-500/5', border: 'border-pink-500/30' },
    { label: 'Règles', count: stats.rules, gradient: 'from-indigo-500/20 to-indigo-500/5', border: 'border-indigo-500/30' },
    { label: 'Total', count: totalItems, gradient: 'from-white/10 to-white/5', border: 'border-white/20' },
  ], [stats, totalItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Database className="w-5 h-5 text-cyan-400" />
        <div>
          <h2 className="text-lg font-medium text-white/90">Gestion des données</h2>
          <p className="text-xs text-white/40">Exportez ou supprimez vos données</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-white/90">Vue d'ensemble</h3>
          <p className="text-xs text-white/40">Volume de données stockées</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg bg-gradient-to-br ${stat.gradient} border ${stat.border}`}
            >
              <div className="text-2xl font-medium text-white/90">
                {stat.count}
              </div>
              <div className="text-xs text-white/60 mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-medium text-white/90">Exporter vos données</h3>
            <p className="text-xs text-white/40">Téléchargez une sauvegarde complète</p>
          </div>
        </div>

        <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg mb-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div className="text-xs text-cyan-300">
              <div className="font-medium mb-1">Sauvegarde sécurisée</div>
              <div className="text-cyan-400/70">
                Vos données sont exportées au format JSON et peuvent être réimportées ultérieurement.
                Conservez ce fichier en lieu sûr.
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleExportData}
          className="w-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 text-white/90 rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all"
        >
          <Download className="w-4 h-4" />
          Télécharger la sauvegarde
        </button>
      </div>

      {/* Zone de danger */}
      <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-sm font-medium text-red-400">Zone de danger</h3>
            <p className="text-xs text-red-400/70">Actions irréversibles</p>
          </div>
        </div>

        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="text-xs text-red-300">
              <div className="font-medium mb-1">Attention</div>
              <div className="text-red-400/70">
                La suppression de toutes vos données est <strong>définitive et irréversible</strong>.
                Assurez-vous d'avoir exporté vos données avant de continuer.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-white/60">Cette action supprimera :</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
            <div>• {stats.transactions} transactions</div>
            <div>• {stats.budgets} budgets</div>
            <div>• {stats.goals} objectifs</div>
            <div>• {stats.people} personnes</div>
            <div>• {stats.accounts} comptes</div>
            <div>• {stats.categories} catégories</div>
            <div>• {stats.rules} règles</div>
          </div>
          
          <button 
            onClick={() => setShowDeleteDialog(true)}
            disabled={totalItems === 0}
            className={`w-full rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
              totalItems === 0
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Supprimer toutes les données
          </button>
        </div>
      </div>

      {/* Dialog de confirmation */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteDialog(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-black border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-red-500/30 bg-red-500/10">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <h3 className="text-lg font-medium text-red-400">Confirmer la suppression</h3>
                  <p className="text-xs text-red-400/70">Action irréversible</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white/90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div className="text-xs text-red-300">
                    <div className="font-medium mb-1">Dernière vérification</div>
                    <div className="text-red-400/70">
                      Vous êtes sur le point de supprimer <strong>{totalItems} éléments</strong>.
                      Cette action ne peut pas être annulée.
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-white/60">
                  Pour confirmer, tapez <strong className="text-white/90">SUPPRIMER TOUT</strong>
                </label>
                <input
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="SUPPRIMER TOUT"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 font-mono focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-red-500/30 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setConfirmationText('');
                }}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={confirmationText !== 'SUPPRIMER TOUT' || isDeleting}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  confirmationText === 'SUPPRIMER TOUT' && !isDeleting
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
