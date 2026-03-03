import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Calendar, Edit2, Trash2, Sparkles, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GoalFormDialog } from '@/features/goals/components/GoalFormDialog'; 
import { useData, Goal } from '@/contexts/DataContext';

// Stubs pour l'événementiel
const AppEvents = { GOALS_UPDATED: 'goalsUpdated' };
const emitEvent = (event: string) => console.log(`Event emitted: ${event}`);

export function Goals() {
  const { goals: dataGoals, loading, updateGoals } = useData();
  const goals = dataGoals || []; // Sécurité si dataGoals est null

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);

  // Helper pour formater les devises sans crasher
  const formatAmount = (amount: number | undefined | null) => {
    return (amount || 0).toLocaleString('fr-FR');
  };

  const handleSaveGoal = useCallback(async (goal: Goal) => {
    try {
      const isNew = !goal.id;
      const now = new Date().toISOString().split('T')[0]; 
      
      const finalGoal: Goal = { 
          ...goal,
          id: goal.id || crypto.randomUUID(),
          current: Number(goal.current) || 0,
          target: Number(goal.target) || 0,
          startDate: goal.startDate || now, 
          endDate: goal.endDate || goal.deadline || now,
          status: goal.status || 'in-progress', 
      };

      const updatedGoals: Goal[] = editingGoal
        ? goals.map(g => g.id === finalGoal.id ? finalGoal : g)
        : [...goals, finalGoal];

      await updateGoals(updatedGoals); 
      
      emitEvent(AppEvents.GOALS_UPDATED);
      toast.success(editingGoal ? 'Objectif modifié' : 'Objectif créé');
      
      setEditingGoal(null);
      setShowCreateDialog(false); 
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [goals, editingGoal, updateGoals]);

  const onSaveGoalSync = useCallback((goal: Goal) => {
    handleSaveGoal(goal);
  }, [handleSaveGoal]);

  const handleDeleteGoal = async (id: string) => {
    try {
      const filtered = goals.filter(g => g.id !== id);
      await updateGoals(filtered); 
      emitEvent(AppEvents.GOALS_UPDATED);
      toast.success('Objectif supprimé');
      setShowDeleteConfirmId(null); 
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) =>
      new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime()
    );
  }, [goals]);

  const totalProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalAchievedRatio = goals.reduce((sum, g) => sum + (g.target > 0 ? (g.current / g.target) : 0), 0);
    return (totalAchievedRatio / goals.length) * 100;
  }, [goals]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="animate-pulse">Chargement de vos objectifs...</p>
      </div>
    );
  }

  const goalToDelete = goals.find(g => g.id === showDeleteConfirmId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-blue-50/30 dark:from-gray-950 dark:via-green-950/20 dark:to-blue-950/20 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 font-extrabold">
                Projets & Objectifs
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Suivez votre progression financière</p>
            </div>
            <Button
              onClick={() => { setEditingGoal(null); setShowCreateDialog(true); }}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Nouvel objectif
            </Button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <div className="mb-8">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 border-green-200 dark:border-green-800 p-6 shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                        <div className="text-sm text-gray-500">Progression globale</div>
                        <div className="text-3xl font-bold">{totalProgress.toFixed(1)}%</div>
                    </div>
                </div>
                <Progress value={totalProgress} className="h-3" />
            </div>
        </div>

        {/* Timeline Interactive */}
        <div className="space-y-6">
          {sortedGoals.map((goal, index) => {
            const current = goal.current || 0;
            const target = goal.target || 0;
            const progress = target > 0 ? (current / target) * 100 : 0;
            const remaining = target - current;
            
            const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

            return (
              <motion.div key={goal.id} className="group relative">
                <div className="flex gap-4 sm:gap-6">
                  <div className="flex-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 shadow-xl overflow-hidden" style={{ borderColor: goal.color }}>
                    <div className="p-4 sm:p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <span>{goal.icon}</span> {goal.name}
                          </h3>
                          <p className="text-sm text-gray-500">{goal.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingGoal(goal)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setShowDeleteConfirmId(goal.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>

                      {/* Barre de progression */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2 font-bold">
                           <span>Progression</span>
                           <span style={{ color: goal.color }}>{progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={progress} className="h-3" />
                      </div>

                      {/* ✅ FIX : Utilisation de formatAmount pour éviter le crash toLocaleString */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <div className="text-xs text-gray-500">Actuel</div>
                          <div className="text-lg font-bold" style={{ color: goal.color }}>{formatAmount(current)} €</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <div className="text-xs text-gray-500">Restant</div>
                          <div className="text-lg font-bold text-orange-600">{formatAmount(remaining)} €</div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <div className="text-xs text-gray-500">Objectif</div>
                          <div className="text-lg font-bold">{formatAmount(target)} €</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dialogs */}
        <AnimatePresence>
          {(showCreateDialog || editingGoal) && (
            <GoalFormDialog
              goal={editingGoal || undefined} 
              onClose={() => { setShowCreateDialog(false); setEditingGoal(null); }}
              onSave={onSaveGoalSync} 
            />
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {showDeleteConfirmId && goalToDelete && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
               <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-sm w-full">
                  <h3 className="text-xl font-bold mb-4">Supprimer l'objectif ?</h3>
                  <p className="mb-6 text-gray-500">Voulez-vous vraiment supprimer "{goalToDelete.name}" ?</p>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowDeleteConfirmId(null)}>Annuler</Button>
                    <Button variant="destructive" onClick={() => handleDeleteGoal(showDeleteConfirmId)}>Supprimer</Button>
                  </div>
               </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}