// src/features/wealth-strategist/components/StrategistDashboard.tsx
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Zap, Wallet, ArrowUpRight, Target, MoreHorizontal } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useWealthAnalysis } from '../hooks/useWealthAnalysis';
import { WealthProjectionChart } from './WealthProjectionChart';
import { InvestmentCapacityCard } from './InvestmentCapacityCard';
import { OptimizationChecklist } from './OptimizationChecklist';
import { AssetFormDialog } from './AssetFormDialog';
import { formatCurrency } from '@/utils/format';
import { Button } from '@/components/ui/button';

export function StrategistDashboard() {
  const { accounts, updateAccounts } = useData();
  const { currentNetWorth, investmentCapacity, netSavings, savingsRate } = useWealthAnalysis();
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  const handleSaveAsset = (asset: any) => {
    const newAccounts = accounts.find(a => a.id === asset.id)
      ? accounts.map(a => a.id === asset.id ? asset : a)
      : [...accounts, asset];
    updateAccounts(newAccounts);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0B0E14] p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                Wealth Strategist v2
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Votre Empire <span className="text-indigo-600">Financier</span>
            </h1>
          </div>
          <div className="flex gap-3">
             <Button 
                onClick={() => setIsAssetModalOpen(true)}
                className="rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 shadow-sm transition-all gap-2"
              >
                <Plus className="w-4 h-4" /> Actif
              </Button>
              <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                Éditer la Stratégie
              </Button>
          </div>
        </header>

        {/* GRILLE PRINCIPALE */}
        <div className="grid grid-cols-12 gap-8">
          
          {/* COLONNE GAUCHE */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* PROJECTION */}
            <section className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-tight mb-1">Patrimoine Projeté</p>
                  <h2 className="text-4xl font-black">{formatCurrency(currentNetWorth)} €</h2>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl text-right">
                  <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1">Croissance</p>
                  <p className="text-lg font-black text-green-700 dark:text-green-300">+ {formatCurrency(investmentCapacity * 12)}€ <span className="text-sm font-medium">/an</span></p>
                </div>
              </div>
              
              <div className="h-[350px] w-full">
                <WealthProjectionChart />
              </div>
            </section>

            {/* LISTE DES ACTIFS */}
            <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-500" /> Vos Possessions
                </h3>
                <button className="text-sm font-bold text-indigo-600 hover:underline text-button">Voir tout</button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {accounts.map((asset) => (
                  <motion.div 
                    key={asset.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => { setEditingAsset(asset); setIsAssetModalOpen(true); }}
                    className="p-5 bg-white dark:bg-gray-900 rounded-[1.8rem] border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                        {asset.icon || '💰'}
                      </div>
                      <div className="p-1 text-gray-400">
                        <MoreHorizontal className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{asset.category}</p>
                      <p className="font-bold text-gray-900 dark:text-white truncate mb-1">{asset.name}</p>
                      <p className="text-xl font-black text-indigo-600">{formatCurrency(asset.value)} €</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* COLONNE DROITE */}
          <aside className="col-span-12 lg:col-span-4 space-y-8">
            <InvestmentCapacityCard 
              capacity={investmentCapacity}
              savings={netSavings}
              rate={savingsRate}
            />

            <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none overflow-hidden relative">
               <div className="absolute -right-10 -top-10 opacity-10">
                  <Target className="w-40 h-40" />
               </div>
               <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-white">
                  <Zap className="w-5 h-5 fill-yellow-400 text-yellow-400" /> Boosters d'IA
               </h3>
               <OptimizationChecklist />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600">
                     <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Indépendance Financière</p>
                     <p className="text-lg font-black italic text-gray-900 dark:text-white text-display">Mars 2038</p>
                  </div>
               </div>
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {(isAssetModalOpen || editingAsset) && (
          <AssetFormDialog 
            asset={editingAsset}
            onClose={() => { setIsAssetModalOpen(false); setEditingAsset(null); }}
            onSave={handleSaveAsset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}