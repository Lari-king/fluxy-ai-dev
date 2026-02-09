/**
 * 📝 TRANSACTION FORM DIALOG - VERSION 2026
 * 
 * Design system cohérent avec LeftPanel :
 * - Hiérarchie visuelle optimisée
 * - Groupements logiques
 * - Micro-interactions raffinées
 * - Performance optimisée
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, FileText, Tag, User, 
  MapPin, CheckCircle, TrendingUp, TrendingDown, 
  ChevronDown, Globe, Building2, CreditCard,
  Sparkles
} from 'lucide-react';
import { Transaction } from '@/utils/csv-parser';
import { PersonSelector } from '@/components/transactions/components/PersonSelector';

interface TransactionFormDialogProps {
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: (id: string, transaction: Partial<Transaction>) => void;
  categories: Array<{ name: string; color?: string; emoji?: string }>;
  people: Array<{ id: string; name: string; avatar?: string; color?: string }>;
  allTransactions?: Transaction[];
}

export function TransactionFormDialog({ 
  transaction, 
  onClose, 
  onSave, 
  categories, 
  people,
  allTransactions = []
}: TransactionFormDialogProps) {
  
  const isEditMode = !!transaction;
  const [showAdvanced, setShowAdvanced] = useState(false);

  // État du formulaire
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    description: '',
    category: '',
    type: 'physical',
    personId: undefined,
    country: 'FR',
    status: 'completed',
    ...transaction
  });

  const [isIncome, setIsIncome] = useState(false);

  useEffect(() => {
    if (transaction) {
      setFormData(transaction);
      setIsIncome(transaction.amount >= 0);
    }
  }, [transaction]);

  // Handlers optimisés
  const handleChange = useCallback((field: keyof Transaction, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    handleChange('amount', isNaN(val) ? 0 : val);
  }, [handleChange]);

  const toggleType = useCallback((income: boolean) => {
    setIsIncome(income);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validation stricte et conversion forcée en nombre
    const rawAmount = typeof formData.amount === 'string' ? parseFloat(formData.amount) : (formData.amount || 0);
    if (!formData.description || rawAmount === 0) return;
  
    const finalAmount = Math.abs(rawAmount) * (isIncome ? 1 : -1);
    const transactionId = isEditMode ? (formData.id as string) : crypto.randomUUID();
  
    // 2. Préparation de l'objet avec des valeurs par défaut garanties
    const transactionToSave: Transaction = {
      ...formData as Transaction,
      id: transactionId,
      description: (formData.description || "Nouvelle opération").trim(),
      amount: finalAmount,
      // 🛡️ FIX DATE : On s'assure d'envoyer uniquement YYYY-MM-DD au parent
      date: formData.date ? formData.date.split('T')[0] : new Date().toISOString().split('T')[0],
      category: formData.category || "Non catégorisé",
      status: formData.status || 'completed',
      updatedAt: new Date().toISOString()
    };
  
    // On passe les données propres au parent
    onSave(transactionId, transactionToSave);
    onClose();
  }, [formData, isIncome, isEditMode, onSave, onClose]);

  // Validation
  const isValid = useMemo(() => {
    return formData.description && formData.amount !== 0;
  }, [formData.description, formData.amount]);

  // Preview
  const previewAmount = useMemo(() => {
    const amount = Math.abs(formData.amount || 0) * (isIncome ? 1 : -1);
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }, [formData.amount, isIncome]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="relative w-full max-w-2xl bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header avec gradient subtil */}
        <div className="relative overflow-hidden border-b border-white/10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
          
          <div className="relative flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white/90">
                  {isEditMode ? 'Modifier la transaction' : 'Nouvelle transaction'}
                </h2>
                <p className="text-xs text-white/40">
                  {isEditMode ? 'Mettez à jour les informations' : 'Créez une nouvelle entrée'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white/90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <form id="transaction-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* 1. MONTANT & TYPE - Hero Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Montant
              </label>
              
              <div className="flex gap-3">
                {/* Input Montant */}
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={Math.abs(formData.amount || 0) || ''}
                    onChange={handleAmountChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-3xl font-mono font-bold text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
                    placeholder="0,00"
                    autoFocus={!isEditMode}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-white/30 font-medium">
                    €
                  </div>
                </div>

                {/* Toggle Type */}
                <div className="flex gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => toggleType(false)}
                    className={`px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                      !isIncome 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10' 
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Dépense</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleType(true)}
                    className={`px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                      isIncome 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10' 
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span className="hidden sm:inline">Revenu</span>
                  </button>
                </div>
              </div>

              {/* Preview Badge */}
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold ${
                  isIncome ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {previewAmount}
                </div>
                <div className="text-xs text-white/40">
                  {isIncome ? 'Crédit' : 'Débit'}
                </div>
              </div>
            </div>

            {/* Séparateur */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* 2. INFORMATIONS PRINCIPALES */}
            <div className="space-y-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                Informations principales
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white/60">
                  <FileText className="w-4 h-4" /> Description
                </label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                  placeholder="Ex: Courses Carrefour, Abonnement Netflix..."
                />
              </div>

              {/* Date & Catégorie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white/60">
                    <Calendar className="w-4 h-4" /> Date
                  </label>
                  <input
                    type="date"
                    value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all [color-scheme:dark]"
                  />
                </div>

                {/* Catégorie */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-white/60">
                    <Tag className="w-4 h-4" /> Catégorie
                  </label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-black">Sélectionner...</option>
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat.name} className="bg-black">
                        {cat.emoji ? `${cat.emoji} ` : ''}{cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Personne */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-white/60">
                  <User className="w-4 h-4" /> Personne
                </label>
                <PersonSelector
                  people={people as any}
                  value={formData.personId}
                  onChange={(id) => handleChange('personId', id)}
                />
              </div>
            </div>

            {/* 3. DÉTAILS AVANCÉS (Expandable) */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors group"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                <span>Détails avancés</span>
                {!showAdvanced && (
                  <span className="text-xs text-white/20">(optionnel)</span>
                )}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-4"
                  >
                    <div className="pt-3 border-t border-white/5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Type */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs text-white/60">
                            <Globe className="w-3 h-3" /> Type de paiement
                          </label>
                          <select
                            value={formData.type || 'physical'}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                          >
                            <option value="physical" className="bg-black">🏪 Magasin physique</option>
                            <option value="online" className="bg-black">🌐 Paiement en ligne</option>
                            <option value="withdrawal" className="bg-black">💵 Retrait</option>
                            <option value="transfer" className="bg-black">🔄 Virement</option>
                          </select>
                        </div>

                        {/* Pays */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs text-white/60">
                            <MapPin className="w-3 h-3" /> Pays
                          </label>
                          <input
                            type="text"
                            value={formData.country || ''}
                            onChange={(e) => handleChange('country', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/30"
                            placeholder="FR"
                          />
                        </div>

                        {/* Marque */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs text-white/60">
                            <Building2 className="w-3 h-3" /> Marque / Enseigne
                          </label>
                          <input
                            type="text"
                            value={formData.brand || ''}
                            onChange={(e) => handleChange('brand', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/30"
                            placeholder="Ex: Carrefour, Netflix..."
                          />
                        </div>

                        {/* Statut */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs text-white/60">
                            <CheckCircle className="w-3 h-3" /> Statut
                          </label>
                          <select
                            value={formData.status || 'completed'}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                          >
                            <option value="completed" className="bg-black">✅ Réalisé</option>
                            <option value="pending" className="bg-black">⏳ En attente</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </form>
        </div>

        {/* Footer avec Preview */}
        <div className="border-t border-white/10 bg-white/5 backdrop-blur-xl">
          {/* Preview Bar */}
          {isValid && (
            <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between text-xs">
              <span className="text-white/40">Aperçu :</span>
              <div className="flex items-center gap-2">
                <span className="text-white/60">{formData.description || 'Sans description'}</span>
                <span className="text-white/30">•</span>
                <span className={`font-mono font-bold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
                  {previewAmount}
                </span>
                <span className="text-white/30">•</span>
                <span className="text-white/60">{formData.category || 'Non classé'}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                isValid
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {isEditMode ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
