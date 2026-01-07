import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, AlertTriangle, ArrowRight, Edit3, Info, CopyCheck } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Transaction } from '../../../src/utils/csv-parser';
import { DuplicateResult } from '../../../src/utils/deduplication';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface CSVPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactions?: Transaction[]; 
  results?: DuplicateResult[];    
  onConfirmImport: (transactions: Transaction[]) => void;
  rawData: { headers: string[]; rows: string[][] };
  currentDatabaseBalance: number; // Reçu depuis Transactions.tsx
}

export function CSVPreviewDialog({
  isOpen,
  onClose,
  transactions,
  results,
  onConfirmImport,
  rawData,
  currentDatabaseBalance = 0,
}: CSVPreviewDialogProps) {
  const [currentStep, setCurrentStep] = useState<'preview' | 'mapping' | 'balance'>('preview');
  const [currentBalance, setCurrentBalance] = useState<string>('');
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // 1. Normalisation des données pour gérer les deux formats d'entrée
  const displayData: DuplicateResult[] = useMemo(() => {
    if (results && results.length > 0) return results;
    if (transactions && transactions.length > 0) {
      return transactions.map(t => ({
        transaction: t,
        isDuplicate: false,
        confidence: "none" as const, // Correction TypeScript pour le type "high" | "medium" | "none"
        reason: undefined
      }));
    }
    return [];
  }, [results, transactions]);

  // 2. Gestion de la sélection (on décoche les doublons par défaut)
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    displayData.forEach((res, idx) => {
      if (!res.isDuplicate) initial.add(idx);
    });
    return initial;
  });

  if (!isOpen) return null;

  // --- CALCULS DES SOLDES ---
  
  // Transactions réellement cochées par l'utilisateur
  const selectedTransactions = useMemo(() => {
    return displayData
      .filter((_, index) => selectedIndices.has(index))
      .map(r => r.transaction);
  }, [displayData, selectedIndices]);

  // Montant total que le fichier CSV va ajouter
  const totalFileAmount = useMemo(() => {
    return selectedTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [selectedTransactions]);

  // Le solde que l'app devrait avoir après l'import (Ancien + Nouveau)
  const theoreticalFinalBalance = currentDatabaseBalance + totalFileAmount;

  const handleConfirm = () => {
    let finalTransactions = [...selectedTransactions];
    
    // Si l'utilisateur a saisi un solde réel dans l'étape 3
    if (currentBalance !== '') {
      const realBalance = parseFloat(currentBalance);
      // L'ajustement se calcule par rapport au cumul (Base + Import)
      const difference = parseFloat((realBalance - theoreticalFinalBalance).toFixed(2));
      
      if (difference !== 0) {
        const adjustmentTransaction: Transaction = {
          id: `adjustment_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: '🔧 Ajustement de solde (Import cumulé)',
          amount: difference,
          category: 'Ajustement',
          status: 'completed',
        };
        finalTransactions.push(adjustmentTransaction);
      }
    }
    
    onConfirmImport(finalTransactions);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Aperçu de l'import
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedIndices.size} transaction{selectedIndices.size > 1 ? 's' : ''} sélectionnée{selectedIndices.size > 1 ? 's' : ''}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={() => setCurrentStep('preview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${currentStep === 'preview' ? 'bg-white dark:bg-gray-800 shadow-md' : 'hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>1</div>
                <span>Aperçu</span>
              </button>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => setCurrentStep('mapping')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${currentStep === 'mapping' ? 'bg-white dark:bg-gray-800 shadow-md' : 'hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep === 'mapping' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>2</div>
                <span>Mapping (optionnel)</span>
              </button>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => setCurrentStep('balance')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${currentStep === 'balance' ? 'bg-white dark:bg-gray-800 shadow-md' : 'hover:bg-white/50 dark:hover:bg-gray-800/50'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep === 'balance' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>3</div>
                <span>Solde (optionnel)</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 'preview' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">Vérifiez vos données</p>
                    <p>Cochez les transactions à importer. Les doublons sont décochés automatiquement.</p>
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                      <tr>
                        <th className="px-4 py-3 text-center w-10">
                          <input 
                            type="checkbox" 
                            checked={selectedIndices.size === displayData.length}
                            onChange={() => {
                              if (selectedIndices.size === displayData.length) setSelectedIndices(new Set());
                              else setSelectedIndices(new Set(displayData.keys()));
                            }}
                          />
                        </th>
                        <th className="px-4 py-3 text-left">Date</th>
                        <th className="px-4 py-3 text-left">Description</th>
                        <th className="px-4 py-3 text-left">Catégorie</th>
                        <th className="px-4 py-3 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {displayData.map((res, index) => (
                        <tr key={index} className={selectedIndices.has(index) ? "" : "opacity-40 bg-gray-50/50"}>
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedIndices.has(index)}
                              onChange={() => {
                                const next = new Set(selectedIndices);
                                if (next.has(index)) next.delete(index);
                                else next.add(index);
                                setSelectedIndices(next);
                              }}
                            />
                          </td>
                          <td className="px-4 py-3">{new Date(res.transaction.date).toLocaleDateString('fr-FR')}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{res.transaction.description}</span>
                              {res.isDuplicate && (
                                <span className="text-[10px] text-amber-600 font-bold uppercase flex items-center gap-1">
                                  <CopyCheck className="w-3 h-3" /> Doublon : {res.reason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{res.transaction.category ? <Badge variant="secondary">{res.transaction.category}</Badge> : '-'}</td>
                          <td className={`px-4 py-3 text-right font-bold ${res.transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {res.transaction.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-4 border border-green-200">
                    <div className="text-sm text-green-700">Revenus sélectionnés</div>
                    <div className="text-2xl font-bold text-green-600">
                      +{selectedTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4 border border-red-200">
                    <div className="text-sm text-red-700">Dépenses sélectionnées</div>
                    <div className="text-2xl font-bold text-red-600">
                      {selectedTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-200">
                    <div className="text-sm text-blue-700">Solde du fichier</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {totalFileAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </div>
                  </div>
                </div>
              </div>
            ) : currentStep === 'mapping' ? (
              <div className="space-y-4">
                 <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 italic text-sm">
                   <AlertTriangle className="w-5 h-5 text-amber-600" />
                   Colonnes détectées : {rawData.headers.join(', ')}
                 </div>
                 <div className="py-20 text-center text-gray-400">
                    <Edit3 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    Le mapping automatique est activé pour votre format de fichier.
                 </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Solde actuel en base</p>
                    <p className="font-semibold">{currentDatabaseBalance.toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-center">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider mb-1">Total à importer</p>
                    <p className="font-semibold text-blue-700 dark:text-blue-300">
                      {totalFileAmount >= 0 ? '+' : ''}{totalFileAmount.toLocaleString('fr-FR')} €
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-gray-800 to-black dark:from-gray-700 dark:to-gray-900 rounded-3xl text-center text-white shadow-xl border border-white/10">
                  <p className="text-sm opacity-60 mb-1">Solde final théorique attendu</p>
                  <p className="text-3xl font-bold">{theoreticalFinalBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-500" /> Quel est votre solde réel actuel ?
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      value={currentBalance}
                      onChange={(e) => setCurrentBalance(e.target.value)}
                      placeholder="Saisir le montant de votre banque..."
                      className="w-full p-4 text-xl font-bold border-2 border-gray-100 dark:border-gray-800 rounded-2xl focus:border-blue-500 bg-white dark:bg-gray-900 outline-none transition-all shadow-inner"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">€</div>
                  </div>
                  
                  {currentBalance && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[11px] text-amber-600 dark:text-amber-400 italic bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800"
                    >
                      <strong>Note :</strong> Une écriture d'ajustement de 
                      <span className="font-bold underline mx-1">
                        {(parseFloat(currentBalance) - theoreticalFinalBalance).toFixed(2)} €
                      </span> 
                      sera créée pour équilibrer vos comptes.
                    </motion.p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t p-6 bg-gray-50 dark:bg-gray-800/50 flex justify-between">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <div className="flex gap-3">
              {currentStep === 'preview' && (
                <>
                  <Button variant="outline" onClick={() => setCurrentStep('mapping')}>Mapping</Button>
                  <Button onClick={handleConfirm} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <Check className="w-4 h-4 mr-2" /> Importer {selectedIndices.size} lignes
                  </Button>
                </>
              )}
              {currentStep === 'mapping' && (
                <>
                  <Button variant="outline" onClick={() => setCurrentStep('preview')}>Retour</Button>
                  <Button onClick={() => setCurrentStep('balance')} className="bg-blue-600 text-white">Étape suivante</Button>
                </>
              )}
              {currentStep === 'balance' && (
                <>
                  <Button variant="outline" onClick={() => setCurrentStep('mapping')}>Retour</Button>
                  <Button onClick={handleConfirm} className="bg-green-600 text-white font-bold">
                    <Check className="w-4 h-4 mr-2" /> Confirmer l'import final
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}