import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Plus, TrendingUp, TrendingDown, Zap, Edit2, Trash2, Calculator, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ScenarioFormDialog } from '@/components/simulator/ScenarioFormDialog';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

interface Scenario {
  id: string;
  name: string;
  description: string;
  type: 'income' | 'expense' | 'saving' | 'investment';
  impact: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
  startMonth: number;
  icon: string;
  color: string;
}

export function Simulator() {
  const { accessToken } = useAuth();
  
  // Note: Simulator data is not in DataContext yet, keep local state for now
  // This is a complex module that can be migrated later
  const getMockScenarios = (): Scenario[] => [
    { 
      id: '1', 
      name: 'Augmentation de salaire', 
      description: '+20% de revenus',
      type: 'income',
      impact: 500,
      frequency: 'monthly',
      startMonth: 0,
      icon: '💰',
      color: '#10B981'
    },
    { 
      id: '2', 
      name: 'Achat immobilier', 
      description: 'Crédit sur 20 ans',
      type: 'expense',
      impact: -1200,
      frequency: 'monthly',
      startMonth: 6,
      icon: '🏠',
      color: '#EF4444'
    },
    { 
      id: '3', 
      name: 'Investissement PEA', 
      description: 'Rendement 7% par an',
      type: 'investment',
      impact: 200,
      frequency: 'monthly',
      startMonth: 0,
      icon: '📈',
      color: '#8B5CF6'
    },
    { 
      id: '4', 
      name: 'Prime annuelle', 
      description: 'Bonus de fin d\'année',
      type: 'income',
      impact: 3000,
      frequency: 'yearly',
      startMonth: 11,
      icon: '🎁',
      color: '#F59E0B'
    },
  ];
  const [scenarios, setScenarios] = useState<Scenario[]>(getMockScenarios());
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingScenario, setEditingScenario] = useState<Scenario | null>(null);
  const [activeScenarios, setActiveScenarios] = useState<string[]>(getMockScenarios().map(s => s.id));

  const baselineValue = 25000; // Patrimoine de départ

  

  const handleSaveScenario = async (scenario: Scenario) => {
    try {
      const updatedScenarios = editingScenario
        ? scenarios.map(s => s.id === scenario.id ? scenario : s)
        : [...scenarios, scenario];
      
      setScenarios(updatedScenarios);
      if (!activeScenarios.includes(scenario.id)) {
        setActiveScenarios([...activeScenarios, scenario.id]);
      }
      
      // Note: Simulator API calls kept for now, will migrate later
      // if (accessToken) {
      //   await simulatorAPI.save(accessToken, updatedScenarios);
      // }
      
      toast.success(editingScenario ? 'Scénario modifié' : 'Scénario créé');
      setEditingScenario(null);
    } catch (error) {
      console.error('Error saving scenario:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteScenario = async (id: string) => {
    try {
      const filtered = scenarios.filter(s => s.id !== id);
      setScenarios(filtered);
      setActiveScenarios(activeScenarios.filter(sid => sid !== id));
      
      // Note: Simulator API calls kept for now, will migrate later
      // if (accessToken) {
      //   await simulatorAPI.save(accessToken, filtered);
      // }
      
      toast.success('Scénario supprimé');
    } catch (error) {
      console.error('Error deleting scenario:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleScenario = (id: string) => {
    setActiveScenarios(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Générer les données de projection
  const generateProjectionData = () => {
    const months = 24; // 2 ans
    const data = [];
    
    for (let month = 0; month < months; month++) {
      let baseline = baselineValue;
      let withScenarios = baselineValue;
      
      // Calculer le baseline (croissance naturelle de 2% par an)
      baseline += (month * baselineValue * 0.02) / 12;
      withScenarios = baseline;
      
      // Appliquer les scénarios actifs
      scenarios.forEach(scenario => {
        if (!activeScenarios.includes(scenario.id)) return;
        if (month < scenario.startMonth) return;
        
        const monthsSinceStart = month - scenario.startMonth;
        
        if (scenario.frequency === 'monthly') {
          withScenarios += scenario.impact * (monthsSinceStart + 1);
        } else if (scenario.frequency === 'yearly') {
          const yearsPassed = Math.floor(monthsSinceStart / 12);
          withScenarios += scenario.impact * (yearsPassed + 1);
        } else if (scenario.frequency === 'one-time') {
          if (monthsSinceStart === 0) {
            withScenarios += scenario.impact;
          }
        }
      });
      
      data.push({
        month: `M${month + 1}`,
        baseline: Math.round(baseline),
        withScenarios: Math.round(withScenarios),
      });
    }
    
    return data;
  };

  const projectionData = generateProjectionData();
  const finalBaseline = projectionData[projectionData.length - 1].baseline;
  const finalWithScenarios = projectionData[projectionData.length - 1].withScenarios;
  const difference = finalWithScenarios - finalBaseline;
  const differencePercent = ((difference / finalBaseline) * 100).toFixed(1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-yellow-50/30 to-orange-50/30 dark:from-gray-950 dark:via-yellow-950/20 dark:to-orange-950/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 relative mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full animate-spin" 
                 style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du simulateur...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-yellow-50/30 to-orange-50/30 dark:from-gray-950 dark:via-yellow-950/20 dark:to-orange-950/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600">
                Simulateur "What If"
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Explorez différents scénarios financiers et leur impact sur votre avenir
              </p>
            </div>
            
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 shadow-lg shadow-yellow-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau scénario
            </Button>
          </div>
        </motion.div>

        {/* Impact Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 border-yellow-200 dark:border-yellow-800 shadow-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 flex items-center justify-center ring-4 ring-offset-2 ring-yellow-200 dark:ring-yellow-800">
                <Calculator className="w-7 h-7 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Impact sur 2 ans</div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Sans scénarios</div>
                    <div className="text-2xl">{finalBaseline.toLocaleString('fr-FR')} €</div>
                  </div>
                  <div className="text-2xl text-gray-400">→</div>
                  <div>
                    <div className="text-sm text-gray-500">Avec scénarios actifs</div>
                    <div className="text-2xl text-yellow-600">{finalWithScenarios.toLocaleString('fr-FR')} €</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {difference >= 0 ? '+' : ''}{difference.toLocaleString('fr-FR')} €
                </div>
                <div className={`text-sm ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {difference >= 0 ? '+' : ''}{differencePercent}%
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Graphique de projection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 border-orange-200 dark:border-orange-800 shadow-xl p-6">
            <h3 className="text-xl mb-4">Projection sur 24 mois</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => `${value.toLocaleString('fr-FR')} €`}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="baseline" 
                  stroke="#9CA3AF" 
                  strokeWidth={2}
                  name="Scénario de base"
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="withScenarios" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  name="Avec scénarios actifs"
                  dot={{ fill: '#F59E0B', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Liste des scénarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {scenarios.map((scenario, index) => {
            const isActive = activeScenarios.includes(scenario.id);

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className={`group relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 shadow-xl transition-all duration-300 ${
                  isActive 
                    ? 'border-yellow-300 dark:border-yellow-700' 
                    : 'border-gray-200 dark:border-gray-800 opacity-60'
                }`}>
                  <div className="h-1.5 bg-gradient-to-r" style={{ 
                    background: `linear-gradient(to right, ${scenario.color}, ${scenario.color}cc)`,
                    opacity: isActive ? 1 : 0.3
                  }} />

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          onClick={() => toggleScenario(scenario.id)}
                          className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg ring-4 ring-offset-2 transition-all ${
                            isActive ? 'scale-100' : 'scale-90 grayscale'
                          }`}
                          style={{ 
                            backgroundColor: scenario.color,
                            '--tw-ring-color': `${scenario.color}40`,
                            opacity: isActive ? 1 : 0.5
                          }as React.CSSProperties}
                        >
                          {scenario.icon}
                        </button>
                        
                        <div className="flex-1">
                          <h3 className="text-xl mb-1">{scenario.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {scenario.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              scenario.impact >= 0
                                ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700'
                                : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                            }`}>
                              {scenario.impact >= 0 ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                              {scenario.impact >= 0 ? '+' : ''}{scenario.impact.toLocaleString('fr-FR')} €
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                              {scenario.frequency === 'monthly' ? 'Mensuel' : scenario.frequency === 'yearly' ? 'Annuel' : 'Ponctuel'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingScenario(scenario)}
                          className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center text-blue-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Êtes-vous sûr de vouloir supprimer ce scénario ?')) {
                              handleDeleteScenario(scenario.id);
                            }
                          }}
                          className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Début : Mois {scenario.startMonth + 1}
                      </span>
                      <Button
                        size="sm"
                        variant={isActive ? "default" : "outline"}
                        onClick={() => toggleScenario(scenario.id)}
                        className={isActive ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                      >
                        {isActive ? 'Actif' : 'Désactivé'}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {scenarios.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-yellow-500/30">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl mb-2">Aucun scénario créé</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Commencez à explorer votre avenir financier en créant votre premier scénario
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 shadow-lg shadow-yellow-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer mon premier scénario
            </Button>
          </motion.div>
        )}

        {/* Create/Edit Dialog */}
        <AnimatePresence>
          {(showCreateDialog || editingScenario) && (
            <ScenarioFormDialog
              scenario={editingScenario}
              onClose={() => {
                setShowCreateDialog(false);
                setEditingScenario(null);
              }}
              onSave={handleSaveScenario}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
