import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Calendar, Edit2, Trash2, Sparkles, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GoalFormDialog } from '@/components/goals/GoalFormDialog'; 

// 🎯 IMPORT ESSENTIEL : Importe Goal du DataContext. 
// Ce type est maintenant la SOURCE DE VÉRITÉ et inclut tous les champs UI.
import { useData, Goal } from '@/contexts/DataContext';

// --- Mock goals (Mise à jour pour le type strict de DataContext) ---
export const getMockGoals = (): Goal[] => {
  // Date YYYY-MM-DD
  const defaultStartDate = new Date().toISOString().split('T')[0]; 
  return [
    { 
      id: '1', 
      name: 'Coussin de sécurité', 
      description: '6 mois de dépenses',
      current: 8500, 
      target: 15000, 
      deadline: '2025-12-31', 
      icon: '💰', 
      color: '#10B981',
      category: 'Épargne',
      startDate: defaultStartDate,
      endDate: '2025-12-31',
      status: 'in-progress', // ✅ CORRIGÉ (Statut strict)
    },
    { 
      id: '2', 
      name: 'Voyage Japon', 
      description: 'Voyage de rêve de 2 semaines',
      current: 2200, 
      target: 5000, 
      deadline: '2027-06-01', 
      icon: '✈️', 
      color: '#F59E0B',
      category: 'Voyage',
      startDate: defaultStartDate,
      endDate: '2027-06-01',
      status: 'in-progress', // ✅ CORRIGÉ (Statut strict)
    },
    { 
      id: '3', 
      name: 'Apport appartement', 
      description: 'Premier achat immobilier',
      current: 12000, 
      target: 40000, 
      deadline: '2028-12-31', 
      icon: '🏠', 
      color: '#8B5CF6',
      category: 'Immobilier',
      startDate: defaultStartDate,
      endDate: '2028-12-31',
      status: 'on-hold', // ✅ CORRIGÉ (Statut strict)
    },
    { 
      id: '4', 
      name: 'Nouvelle voiture', 
      description: 'Voiture électrique',
      current: 5000, 
      target: 25000, 
      deadline: '2026-09-01', 
      icon: '🚗', 
      color: '#3B82F6',
      category: 'Transport',
      startDate: defaultStartDate,
      endDate: '2026-09-01',
      status: 'in-progress', // ✅ CORRIGÉ (Statut strict)
    },
  ];
};


// Stubs pour l'événementiel
const AppEvents = { GOALS_UPDATED: 'goalsUpdated' };
const emitEvent = (event: string) => console.log(`Event emitted: ${event}`);

// ----------------------------------------------------------------------

export function Goals() {
  // dataGoals est maintenant directement de type Goal[] du DataContext
  const { goals: dataGoals, loading, updateGoals } = useData();

  // dataGoals est déjà de type Goal[] grâce à l'import de DataContext
  const goals = dataGoals; 

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);

  // handleSaveGoal reste async pour la persistance
  const handleSaveGoal = useCallback(async (goal: Goal) => {
    try {
      const isNew = !goal.id;
      // Date YYYY-MM-DD
      const now = new Date().toISOString().split('T')[0]; 
      
      // Assure que l'objet à sauvegarder est du type strict Goal (qui est maintenant étendu)
      const finalGoal: Goal = { 
          // Utilisation de la décomposition pour s'assurer que tous les champs 
          // (y compris ceux de l'UI : icon, color, category, deadline) sont inclus.
          ...goal,
          id: goal.id || crypto.randomUUID(),
          current: Number(goal.current),
          target: Number(goal.target),
          
          // GARANTIE DE TYPAGE STRICT
          startDate: goal.startDate || now, 
          endDate: goal.endDate || goal.deadline, // Utilise la deadline comme endDate si non spécifié
          // Le statut doit être l'un des types littéraux
          status: goal.status || (isNew ? 'in-progress' : 'in-progress'), 
      };

      const updatedGoals: Goal[] = editingGoal
        ? dataGoals.map(g => g.id === finalGoal.id ? finalGoal : g)
        : [...dataGoals, finalGoal];

      await updateGoals(updatedGoals); 
      
      emitEvent(AppEvents.GOALS_UPDATED);
      toast.success(editingGoal ? 'Objectif modifié' : 'Objectif créé');
      
      // Fermer les modales APRES le succès de la sauvegarde
      setEditingGoal(null);
      setShowCreateDialog(false); 

    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [dataGoals, editingGoal, updateGoals]); // Dépendances pour useCallback

  // Crée une fonction synchrone pour la prop onSave (résout l'erreur async/void)
  const onSaveGoalSync = useCallback((goal: Goal) => {
    // Exécute la fonction async sans attendre, retournant 'void'
    handleSaveGoal(goal);
  }, [handleSaveGoal]);


  const handleDeleteGoal = async (id: string) => {
    try {
      const filtered = goals.filter(g => g.id !== id);

      // Le type Goal est maintenant correct et compatible avec DataContext
      await updateGoals(filtered); 

      emitEvent(AppEvents.GOALS_UPDATED);
      toast.success('Objectif supprimé');
      setShowDeleteConfirmId(null); 
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Tri des objectifs
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) =>
      new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
  }, [goals]);

  // Calcul de la progression globale
  const totalProgress = useMemo(() => {
    const totalAchievedRatio = goals.reduce((sum, g) => sum + (g.target > 0 ? (g.current / g.target) : 0), 0);
    return goals.length > 0
      ? (totalAchievedRatio / goals.length) * 100
      : 0;
  }, [goals]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-blue-50/30 dark:from-gray-950 dark:via-green-950/20 dark:to-blue-950/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 relative mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full animate-spin" 
                 style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de vos objectifs...</p>
        </motion.div>
      </div>
    );
  }

  const goalToDelete = goals.find(g => g.id === showDeleteConfirmId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-blue-50/30 dark:from-gray-950 dark:via-green-950/20 dark:to-blue-950/20 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 font-extrabold">
                Projets & Objectifs
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Définissez et suivez vos objectifs financiers avec une timeline interactive
              </p>
            </div>
            
            <Button
              onClick={() => {
                setEditingGoal(null);
                setShowCreateDialog(true);
              }}
              className="w-full lg:w-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg shadow-green-500/30 text-white font-semibold py-3 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel objectif
            </Button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 border-green-200 dark:border-green-800 shadow-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 flex items-center justify-center ring-4 ring-offset-2 ring-green-200 dark:ring-green-800">
                <Sparkles className="w-7 h-7 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Progression globale</div>
                <div className="text-3xl font-bold">{totalProgress.toFixed(1)}%</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Objectifs actifs</div>
                <div className="text-3xl font-bold text-green-600">{goals.length}</div>
              </div>
            </div>
            <Progress value={totalProgress} className="h-3">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                style={{ width: `${totalProgress}%` }}
              />
            </Progress>
          </div>
        </motion.div>

        {/* Timeline Interactive */}
        <div className="space-y-6">
          {sortedGoals.map((goal, index) => {
            const progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;
            const remaining = goal.target - goal.current;
            
            // Calcul basé sur deadline
            const daysLeft = Math.ceil(
              (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            const isOverdue = daysLeft < 0;
            const isUrgent = daysLeft > 0 && daysLeft < 90;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.01, x: 10 }}
                className="group relative"
              >
                {/* Timeline connector */}
                {index < sortedGoals.length - 1 && (
                  <div className="hidden sm:block absolute left-[27px] top-[80px] w-0.5 h-full bg-gradient-to-b from-gray-300 to-transparent dark:from-gray-700" />
                )}

                <div className="flex gap-4 sm:gap-6">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0 relative z-10 hidden sm:block">
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 180 }}
                      className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-700 transition-all"
                      style={{ 
                        backgroundColor: goal.color,
                      }}
                    >
                      {goal.icon}
                    </motion.div>
                  </div>

                  {/* Card Content */}
                  <div className="flex-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-full"
                        style={{ borderColor: goal.color }}>
                    <div className="h-1.5 bg-gradient-to-r" style={{ 
                      background: `linear-gradient(90deg, ${goal.color}, ${goal.color}cc)` 
                    }} />

                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="sm:hidden text-2xl mr-3">{goal.icon}</span>
                            <h3 className="text-xl sm:text-2xl font-semibold">{goal.name}</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {goal.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                              {goal.category}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isOverdue 
                                ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                                : isUrgent
                                ? 'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border border-orange-300 dark:border-orange-700'
                                : 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                            }`}>
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {isOverdue ? 'Dépassé' : `${daysLeft} jours restants`}
                            </span>
                          </div>
                        </div>

                        {/* Actions buttons */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button 
                            onClick={() => setEditingGoal(goal)}
                            className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setShowDeleteConfirmId(goal.id)}
                            className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm font-medium mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Progression</span>
                          <span style={{ color: goal.color }}>
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                        <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            transition={{ duration: 1, delay: 0.3 + index * 0.05, ease: "easeOut" }}
                            className="h-full rounded-full shadow-lg relative"
                            style={{ 
                              background: `linear-gradient(90deg, ${goal.color} 0%, ${goal.color}dd 100%)`,
                              boxShadow: `0 0 15px ${goal.color}66`
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent" />
                          </motion.div>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border-2 border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actuel</div>
                          <div className="text-lg font-bold" style={{ color: goal.color }}>
                            {goal.current.toLocaleString('fr-FR')} €
                          </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border-2 border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Restant</div>
                          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {remaining.toLocaleString('fr-FR')} €
                          </div>
                        </div>
                        <div className="bg-50 dark:bg-gray-800/50 rounded-xl p-3 border-2 border-gray-200 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Objectif</div>
                          <div className="text-lg font-bold">
                            {goal.target.toLocaleString('fr-FR')} €
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {goals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30">
              <Target className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-semibold mb-2">Aucun objectif défini</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Commencez à planifier votre avenir financier en créant votre premier objectif
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 shadow-lg shadow-green-500/30 text-white font-semibold py-3 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier objectif
            </Button>
          </motion.div>
        )}

        {/* Create/Edit Dialog (GoalFormDialog) */}
        <AnimatePresence>
          {(showCreateDialog || editingGoal) && (
            <GoalFormDialog
              // Le type Goal est maintenant compatible
              goal={editingGoal || undefined} 
              onClose={() => {
                setShowCreateDialog(false);
                setEditingGoal(null);
              }}
              // Utilise la fonction synchrone onSaveGoalSync pour satisfaire la prop onSave: (goal: Goal) => void
              onSave={onSaveGoalSync} 
            />
          )}
        </AnimatePresence>

        {/* Confirmation Modale pour la Suppression */}
        <AnimatePresence>
          {showDeleteConfirmId && goalToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border-t-4 border-red-500"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirmer la suppression</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Êtes-vous sûr de vouloir supprimer l'objectif <span className="font-bold text-red-500">"{goalToDelete.name}"</span> ? Cette action est irréversible.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={() => setShowDeleteConfirmId(null)}
                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4"
                  >
                    <X className="w-4 h-4 mr-2" /> Annuler
                  </Button>
                  <Button
                    onClick={() => handleDeleteGoal(showDeleteConfirmId)}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 shadow-md shadow-red-500/30"
                  >
                    <Check className="w-4 h-4 mr-2" /> Supprimer
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}