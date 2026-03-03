/**
 * 🔧 HOOK DE FILTRAGE TRANSACTIONS - VERSION ULTIME & COMPLÈTE
 * * Ce hook centralise toute la logique de filtrage du module.
 * * CORRECTIONS MAJEURES :
 * 1. Mapping ID -> Nom pour les catégories et sous-catégories (Fix CSV).
 * 2. Filtrage par montant intelligent (Gestion du signe et valeur absolue).
 * 3. Support complet des filtres : Pays, Type, Récurrence, Personne.
 * 4. Gestion des transactions enfants issues de splits.
 * 5. FIX : Ajout du support transactionIds pour le filtrage par récurrence/anomalie.
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Transaction, FilterState } from '../types';
import { format, startOfYear, isValid } from 'date-fns';
import * as FilterService from '../services/filterService';

/**
 * 🏁 ÉTAT INITIAL DES FILTRES
 */
const INITIAL_FILTERS: FilterState = {
  searchTerm: '',
  category: 'all',
  subCategory: 'all',
  type: 'all',
  country: 'all',
  person: 'all',
  amountMin: '',
  amountMax: '',
  dateFrom: format(startOfYear(new Date()), 'yyyy-MM-dd'), 
  dateTo: '2026-12-31', 
  recurring: 'all',
  splitStatus: 'all',
  // @ts-ignore - Ajout dynamique pour supporter le filtrage par clic
  transactionIds: []
};

/**
 * @param transactions - La liste brute des transactions
 * @param categories - La liste des catégories (nécessaire pour le mapping ID/Nom)
 */
export function useTransactionFilters(transactions: Transaction[], categories: any[] = []) {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  /**
   * 📅 AUTO-AJUSTEMENT DES DATES
   * Se synchronise sur les données réelles dès qu'elles sont chargées.
   */
  useEffect(() => {
    if (transactions.length > 0) {
      const dates = transactions.map(t => {
        const d = new Date(t.date);
        return isValid(d) ? d.getTime() : null;
      }).filter((d): d is number => d !== null);

      if (dates.length > 0) {
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));
        
        setFilters(prev => ({
          ...prev,
          dateFrom: format(minDate, 'yyyy-MM-dd'),
          dateTo: format(maxDate, 'yyyy-MM-dd')
        }));
      }
    }
  }, [transactions.length]);

  /**
   * 🧠 LOGIQUE DE FILTRAGE PRINCIPALE
   * Pipeline de filtrage haute performance avec useMemo.
   */
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      
      // 0️⃣ 🔥 FILTRE PRIORITAIRE : IDs SPÉCIFIQUES (Récurrences / Anomalies)
      // @ts-ignore
      if (filters.transactionIds && filters.transactionIds.length > 0) {
        // @ts-ignore
        return filters.transactionIds.includes(t.id);
      }

      // 1️⃣ RECHERCHE TEXTUELLE (Multi-critères)
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchesText = 
          (t.description?.toLowerCase().includes(search)) ||
          (t.category?.toLowerCase().includes(search)) ||
          (t.subCategory?.toLowerCase().includes(search)) ||
          (t.notes?.toLowerCase().includes(search)) ||
          (t.city?.toLowerCase().includes(search));
        
        if (!matchesText) return false;
      }

      // 2️⃣ FILTRE CATÉGORIE (Mapping ID/Nom)
      if (filters.category !== 'all') {
        const selection = filters.category.toLowerCase();
        const tCatName = t.category?.toLowerCase();
        const tCatId = (t as any).categoryId?.toLowerCase();
        
        const mappedCat = categories.find(c => c.id === filters.category);
        const mappedName = mappedCat?.name?.toLowerCase();

        const matches = tCatName === selection || tCatId === selection || (mappedName && tCatName === mappedName);
        if (!matches) return false;
      }

      // 3️⃣ FILTRE SOUS-CATÉGORIE
      if (filters.subCategory && filters.subCategory !== 'all') {
        const selection = filters.subCategory.toLowerCase();
        const tSubCatName = t.subCategory?.toLowerCase();
        const tSubCatId = (t as any).subCategoryId?.toLowerCase();
        
        const subCatObj = categories.find(c => c.id === filters.subCategory);
        const subCatRealName = subCatObj?.name?.toLowerCase();

        const matches = 
          tSubCatName === selection || 
          tSubCatId === selection || 
          (subCatRealName && tSubCatName === subCatRealName);
        
        if (!matches) return false;
      }

      // 4️⃣ FILTRE TEMPOREL
      const tDate = new Date(t.date).getTime();
      const from = new Date(filters.dateFrom).getTime();
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999); 
      
      if (tDate < from || tDate > to.getTime()) return false;

      // 5️⃣ FILTRE MONTANTS
      const amount = t.amount;
      const absAmount = Math.abs(amount);
      const filterMin = filters.amountMin === '' ? -Infinity : parseFloat(filters.amountMin);
      const filterMax = filters.amountMax === '' ? Infinity : parseFloat(filters.amountMax);

      if (filterMin >= 0 && filterMax >= 0) {
        if (absAmount < filterMin || absAmount > filterMax) return false;
      } else {
        if (amount < filterMin || amount > filterMax) return false;
      }

      // 6️⃣ FILTRE RELATION / PERSONNE
      if (filters.person !== 'all') {
        const pSel = filters.person.toLowerCase();
        const tPersonId = t.personId?.toLowerCase();
        const tPersonName = (t as any).person?.toLowerCase();
        if (tPersonId !== pSel && tPersonName !== pSel) return false;
      }

      // 7️⃣ FILTRE TYPE (DÉBIT/CRÉDIT)
      if (filters.type !== 'all') {
        if (filters.type === 'debit' && amount > 0) return false;
        if (filters.type === 'credit' && amount < 0) return false;
      }

      // 8️⃣ FILTRES SECONDAIRES (PAYS / RÉCURRENCE / SPLIT)
      if (filters.country !== 'all' && t.country !== filters.country) return false;
      
      if (filters.recurring !== 'all') {
        // ✅ CORRECTION TS : Utilisation de isRecurring au lieu de recurringId
        const isRec = !!(t as any).isRecurring; 
        if (filters.recurring === 'yes' && !isRec) return false;
        if (filters.recurring === 'no' && isRec) return false;
      }

      // 9️⃣ TRANSACTIONS CACHÉES
      if (t.isHidden && !t.parentTransactionId) return false;

      return true;
    });
  }, [transactions, filters, categories]);

  /**
   * 📊 CALCUL DES TOTALS
   */
  const totals = useMemo(() => {
    return FilterService.calculateTotals(filteredTransactions);
  }, [filteredTransactions]);

  /**
   * 🔄 RÉINITIALISATION
   */
  const resetFilters = useCallback(() => {
    if (transactions.length > 0) {
      const dates = transactions.map(t => new Date(t.date).getTime()).filter(d => !isNaN(d));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      setFilters({
        ...INITIAL_FILTERS,
        dateFrom: format(minDate, 'yyyy-MM-dd'),
        dateTo: format(maxDate, 'yyyy-MM-dd')
      });
    } else {
      setFilters(INITIAL_FILTERS);
    }
  }, [transactions]);

  return {
    filters,
    setFilters,
    resetFilters,
    filteredTransactions,
    totals
  };
}