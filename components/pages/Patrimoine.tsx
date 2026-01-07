import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingUp, Plus, Home, Wallet, TrendingDown, Bitcoin, Edit2, Trash2, Sparkles, Building2, Briefcase, Landmark } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { AssetFormDialog } from '../patrimoine/AssetFormDialog';

interface Asset {
  id: string;
  name: string;
  category: string;
  value: number;
  icon: string;
  color: string;
  description?: string;
}

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#EF4444', '#14B8A6', '#6366F1'];

export function Patrimoine() {
  const { accessToken } = useAuth();
  
  // ✅ Use centralized data from DataContext
  const { accounts: dataAssets, loading, updateAccounts } = useData();
  const getMockAssets = (): Asset[] => [
    { id: '1', name: 'Résidence principale', category: 'Immobilier', value: 250000, icon: '🏠', color: '#10B981', description: 'Appartement 3 pièces' },
    { id: '2', name: 'Livret A', category: 'Épargne', value: 15000, icon: '💰', color: '#3B82F6', description: 'Épargne de précaution' },
    { id: '3', name: 'PEA', category: 'Investissements', value: 35000, icon: '📈', color: '#8B5CF6', description: 'Actions européennes' },
    { id: '4', name: 'Assurance vie', category: 'Investissements', value: 50000, icon: '🛡️', color: '#F59E0B', description: 'Fonds euros + UC' },
    { id: '5', name: 'Bitcoin', category: 'Crypto', value: 8000, icon: '₿', color: '#EC4899', description: '0.15 BTC' },
    { id: '6', name: 'Véhicule', category: 'Autres', value: 18000, icon: '🚗', color: '#EF4444', description: 'Voiture personnelle' },
  ];
  const assets = dataAssets.length > 0 ? dataAssets : getMockAssets();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

 

  const handleSaveAsset = async (asset: Asset) => {
    try {
      const updatedAssets = editingAsset
        ? assets.map(a => a.id === asset.id ? asset : a)
        : [...assets, asset];
      
      if (accessToken) {
        await updateAccounts(updatedAssets);
      }
      
      toast.success(editingAsset ? 'Actif modifié' : 'Actif ajouté');
      setEditingAsset(null);
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      const filtered = assets.filter(a => a.id !== id);
      
      if (accessToken) {
        await updateAccounts(filtered);
      }
      
      toast.success('Actif supprimé');
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  // ✅ Memoize calculations to prevent memory buildup
  const totalValue = React.useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.value, 0);
  }, [assets]);

  const categoryData = React.useMemo(() => {
    return assets.reduce((acc: any, asset) => {
      const existing = acc.find((item: any) => item.name === asset.category);
      if (existing) {
        existing.value += asset.value;
      } else {
        acc.push({ name: asset.category, value: asset.value });
      }
      return acc;
    }, []);
  }, [assets]);

  const evolutionData = React.useMemo(() => {
    return [
      { month: 'Jan', value: totalValue * 0.85 },
      { month: 'Fév', value: totalValue * 0.87 },
      { month: 'Mar', value: totalValue * 0.90 },
      { month: 'Avr', value: totalValue * 0.92 },
      { month: 'Mai', value: totalValue * 0.95 },
      { month: 'Juin', value: totalValue * 0.97 },
      { month: 'Juil', value: totalValue },
    ];
  }, [totalValue]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-950 dark:via-indigo-950/20 dark:to-purple-950/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 relative mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-spin" 
                 style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
            <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">Chargement de votre patrimoine...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-gray-950 dark:via-indigo-950/20 dark:to-purple-950/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                Patrimoine 360°
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Vue complète de votre patrimoine : immobilier, financier, crypto, etc.
              </p>
            </div>
            
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un actif
            </Button>
          </div>
        </motion.div>

        {/* Valeur totale */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6" />
                <span className="text-lg opacity-90">Valeur totale du patrimoine</span>
              </div>
              <div className="text-6xl mb-4">{totalValue.toLocaleString('fr-FR')} €</div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-5 h-5" />
                <span>+12.5% cette année</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Répartition par catégorie */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-xl p-6">
              <h3 className="text-xl mb-4">Répartition par catégorie</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${value.toLocaleString('fr-FR')} €`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Évolution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-xl p-6">
              <h3 className="text-xl mb-4">Évolution sur 6 mois</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `${value.toLocaleString('fr-FR')} €`} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Liste des actifs par catégorie */}
        <div className="space-y-6">
          {Object.entries(
            assets.reduce((acc: any, asset) => {
              if (!acc[asset.category]) acc[asset.category] = [];
              acc[asset.category].push(asset);
              return acc;
            }, {})
          ).map(([category, categoryAssets]: [string, any], catIndex) => {
            const categoryTotal = categoryAssets.reduce((sum: number, a: Asset) => sum + a.value, 0);
            const categoryPercentage = (categoryTotal / totalValue) * 100;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + catIndex * 0.1 }}
              >
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border-2 border-gray-200 dark:border-gray-800 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[catIndex % COLORS.length] }} />
                      <h3 className="text-2xl">{category}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl">{categoryTotal.toLocaleString('fr-FR')} €</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {categoryPercentage.toFixed(1)}% du total
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryAssets.map((asset: Asset, index: number) => (
                      <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + catIndex * 0.1 + index * 0.05 }}
                        whileHover={{ scale: 1.03, y: -5 }}
                        className="group relative"
                      >
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
                          <div className="flex items-start justify-between mb-3">
                            <div className="text-4xl">{asset.icon}</div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setEditingAsset(asset)}
                                className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 flex items-center justify-center text-blue-600 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm('Êtes-vous sûr de vouloir supprimer cet actif ?')) {
                                    handleDeleteAsset(asset.id);
                                  }
                                }}
                                className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          
                          <h4 className="mb-1">{asset.name}</h4>
                          {asset.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{asset.description}</p>
                          )}
                          <div className="text-xl" style={{ color: asset.color }}>
                            {asset.value.toLocaleString('fr-FR')} €
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {assets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30">
              <Briefcase className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl mb-2">Aucun actif enregistré</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Commencez à suivre votre patrimoine en ajoutant votre premier actif
            </p>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter mon premier actif
            </Button>
          </motion.div>
        )}

        {/* Create/Edit Dialog */}
        <AnimatePresence>
          {(showCreateDialog || editingAsset) && (
            <AssetFormDialog
              asset={editingAsset}
              onClose={() => {
                setShowCreateDialog(false);
                setEditingAsset(null);
              }}
              onSave={handleSaveAsset}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
