/**
 * Data Context - HYBRID VERSION (LOCAL + CLOUD)
 * 
 * Mode LOCAL (par défaut) :
 * ✅ Toutes les données stockées en localStorage
 * ✅ Pas de backend requis
 * 
 * Mode CLOUD (optionnel) :
 * ✅ Données synchronisées via Supabase
 * ✅ Migration automatique
 * 
 * ✅ Optimisé avec useMemo et useCallback
 * ✅ 🆕 ENRICHISSEMENT AUTOMATIQUE : income/expenses/totalImpact calculés depuis transactions
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Transaction as BaseTransaction } from 'src/utils/csv-parser'; // ✅ Import de base depuis csv-parser
import { Rule } from '../types/rules'; // ✅ Import du vrai type Rule
import { PersonRelation, PersonType } from '../types/people'; // ✅ Import du nouveau système relationnel
import { storageService } from '../src/services/storage'; // ✅ Import du service de stockage

// --- Types d'Entités (Plus spécifiques pour Dexie) ---

// Type de base pour une entité (ID et autres propriétés)
interface Entity {
  id: string;
  [key: string]: any;
}

// 🆕 Définition de Category
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  emoji?: string;
  parentId?: string;
}

// 🆕 Extension de Transaction avec les champs pour la division
export interface Transaction extends Omit<BaseTransaction, 'parentTransactionId' | 'childTransactionIds' | 'isHidden' | 'splitNote'> {
  // Champs existants (hérités de BaseTransaction)
  
  // 🆕 Champs de catégorisation
  subCategory?: string; // Sous-catégorie
  merchant?: string; // Marchand/Commerçant
  
  // 🆕 Gestion des transactions divisées
  parentTransactionId?: string; // ID de la transaction parente (si c'est une sous-transaction)
  childTransactionIds?: string[]; // IDs des sous-transactions (si c'est une transaction divisée)
  isHidden?: boolean; // Masquer la transaction des calculs (pour les transactions divisées)
  splitNote?: string; // Note expliquant la division
}

/**
 * ⚠️ DEPRECATED - Utiliser PersonRelation de types/people.ts
 * Conservé temporairement pour rétrocompatibilité
 */
export interface Person {
  id: string;
  name: string;
  avatar?: string;
  relationship: string;
  color: string;
  circle: string;
  totalImpact: number;
  [key: string]: any;
}

// Définition du type Goal (pour l'erreur 2345 dans Goals.tsx)
export interface Goal extends Entity {
    name: string;
    description: string;
    target: number;
    current: number;
    startDate: string;
    endDate: string;
    status: 'in-progress' | 'completed' | 'on-hold';
}

/**
 * ✅ NOUVEAU TYPE - PersonRelation enrichie
 * 
 * Utilise le nouveau système typologique avec :
 * - Dimensions déclaratives (contribution, objectifs)
 * - Indicateurs calculés (tendances, dépendances)
 * - Signaux d'arbitrage
 */
export type EnrichedPerson = PersonRelation;

// ✅ Réexport de Transaction pour faciliter l'import depuis DataContext
export type { Rule }; // ✅ Réexport de Rule pour faciliter l'import
// Category est déjà exporté via 'export interface Category' ci-dessus

interface DataState {
  transactions: Transaction[];
  budgets: any[];
  goals: Goal[];
  people: EnrichedPerson[];
  accounts: any[];
  categories: Category[];
  rules: Rule[];
  loading: boolean;
}

interface DataContextType extends DataState {
  refreshData: () => void;
  updateTransactions: (transactions: Transaction[]) => void;
  updateBudgets: (budgets: any[]) => void;
  updateGoals: (goals: Goal[]) => void;
  updatePeople: (people: EnrichedPerson[]) => void;
  updateAccounts: (accounts: any[]) => void;
  updateCategories: (categories: Category[]) => void;
  updateRules: (rules: Rule[]) => void;
}

const DataContext = createContext<DataContextType | null>(null);

// Helper pour générer les clés localStorage par utilisateur
function getStorageKey(userId: string, type: string): string {
  return `flux_${userId}_${type}`;
}

// Helper pour charger depuis localStorage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (err) {
    console.error(`Erreur lors du chargement de ${key}:`, err);
    return defaultValue;
  }
}

// Helper pour sauvegarder dans localStorage
function saveToStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Erreur lors de la sauvegarde de ${key}:`, err);
  }
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  
  // 🔑 CHANGEMENT CRITIQUE : rawPeople stocke les données brutes (sans stats calculées)
  const [rawPeople, setRawPeople] = useState<EnrichedPerson[]>([]);
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  // Protection contre les rechargements multiples
  const loadedTokenRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  // 🔑 ENRICHISSEMENT AUTOMATIQUE : Calcul dynamique de income/expenses/totalImpact
  // Chaque fois que transactions ou rawPeople changent, on recalcule les stats
  const people = useMemo(() => {
    return rawPeople.map(person => {
      // 1️⃣ Filtrer les transactions de cette relation
      const personTransactions = transactions.filter(t => t.personId === person.id);
      
      // 2️⃣ Calculer les revenus (montants positifs)
      const income = personTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
      
      // 3️⃣ Calculer les dépenses (montants négatifs en valeur absolue)
      const expenses = personTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // 4️⃣ Calculer l'impact total (revenus - dépenses)
      const totalImpact = income - expenses;
      
      // 5️⃣ Retourner la relation enrichie avec les stats à jour
      return {
        ...person,
        income,      // ✅ Toujours synchronisé avec les transactions
        expenses,    // ✅ Toujours synchronisé avec les transactions
        totalImpact  // ✅ Toujours synchronisé avec les transactions
      };
    });
  }, [rawPeople, transactions]); // ⚡ Recalcule seulement si rawPeople ou transactions changent

  // Charger les données depuis localStorage quand l'utilisateur se connecte
  useEffect(() => {
    if (!accessToken || accessToken === loadedTokenRef.current) {
      return;
    }

    if (isLoadingRef.current) {
      return;
    }

    console.log('📁 Chargement des données depuis localStorage...');
    loadedTokenRef.current = accessToken;
    isLoadingRef.current = true;
    
    // Simuler un petit délai pour l'UX
    setTimeout(() => {
      try {
        const userId = accessToken;
        
        setTransactions(loadFromStorage(getStorageKey(userId, 'transactions'), []));
        setBudgets(loadFromStorage(getStorageKey(userId, 'budgets'), []));
        setGoals(loadFromStorage(getStorageKey(userId, 'goals'), []));
        
        // 🔑 Charger dans rawPeople au lieu de people
        setRawPeople(loadFromStorage(getStorageKey(userId, 'people'), []));
        
        setAccounts(loadFromStorage(getStorageKey(userId, 'accounts'), []));
        
        // Charger les catégories
        const loadedCategories = loadFromStorage<Category[]>(getStorageKey(userId, 'categories'), []);
        setCategories(loadedCategories);
        
        setRules(loadFromStorage(getStorageKey(userId, 'rules'), []));
        
        console.log('✅ Données chargées depuis localStorage');
        setLoading(false);
      } catch (err) {
        console.error('❌ Erreur lors du chargement:', err);
        setLoading(false);
      } finally {
        isLoadingRef.current = false;
      }
    }, 300);
  }, [accessToken]);

  // ✅ Fonctions de mise à jour mémoïsées avec useCallback
  const updateTransactions = useCallback((t: Transaction[]) => {
    const today = new Date().toISOString().split('T')[0];
    
    const sanitizedTransactions = t.map(txn => ({
      // 1. On garde TOUT par défaut (préserve childTransactionIds, parentTransactionId, isHidden, splitNote, etc.)
      ...txn,
      
      // 2. On nettoie uniquement les champs critiques pour éviter les erreurs
      description: (txn.description || "Nouvelle opération").trim(),
      amount: typeof txn.amount === 'string' ? parseFloat(txn.amount) : (txn.amount || 0),
      date: (txn.date || today).split('T')[0],
      category: txn.category || "Non catégorisé",
      updatedAt: new Date().toISOString(),
      
      // 3. On garantit l'intégrité des tableaux de split (évite les undefined)
      childTransactionIds: Array.isArray(txn.childTransactionIds) ? txn.childTransactionIds : undefined
    }));
  
    // Mise à jour de l'état local
    setTransactions(sanitizedTransactions);
    
    // Sauvegarde persistante
    if (accessToken) {
      saveToStorage(getStorageKey(accessToken, 'transactions'), sanitizedTransactions);
    }
    
    // 🎯 Les stats de people seront automatiquement recalculées via useMemo
  }, [accessToken]);

  const updateBudgets = useCallback((b: any[]) => {
    setBudgets(b);
    if (accessToken) {
      saveToStorage(getStorageKey(accessToken, 'budgets'), b);
    }
  }, [accessToken]);

  const updateGoals = useCallback((g: Goal[]) => {
    setGoals(g);
    if (accessToken) {
      saveToStorage(getStorageKey(accessToken, 'goals'), g);
    }
  }, [accessToken]);

  const updatePeople = useCallback((p: EnrichedPerson[]) => {
    // 🔑 CHANGEMENT CRITIQUE : Sauvegarder dans rawPeople
    setRawPeople(p);
    if (accessToken) {
      saveToStorage(getStorageKey(accessToken, 'people'), p);
    }
    // 🎯 Les stats (income/expenses/totalImpact) seront automatiquement recalculées via useMemo
  }, [accessToken]);

  const updateAccounts = useCallback((a: any[]) => {
    setAccounts(a);
    if (accessToken) {
      saveToStorage(getStorageKey(accessToken, 'accounts'), a);
    }
  }, [accessToken]);

  const updateCategories = useCallback((c: Category[]) => {
    setCategories(c);
    if (accessToken) {
      saveToStorage(getStorageKey(accessToken, 'categories'), c);
    }
  }, [accessToken]);

  const updateRules = useCallback((r: Rule[]) => {
    setRules(r);
    // ✅ Sauvegarde dans localStorage comme les autres données
    if (accessToken) {
      saveToStorage(getStorageKey(accessToken, 'rules'), r);
    }
  }, [accessToken]);

  const refreshData = useCallback(() => {
    loadedTokenRef.current = null;
    setLoading(true);
  }, []);

  // ✅ Context value mémoïsé
  // 🔑 On expose 'people' (enrichi) au lieu de 'rawPeople' (brut)
  const value = useMemo(() => ({
    transactions,
    budgets,
    goals,
    people, // ✅ Version enrichie avec income/expenses/totalImpact calculés
    accounts,
    categories,
    rules,
    loading,
    refreshData,
    updateTransactions,
    updateBudgets,
    updateGoals,
    updatePeople,
    updateAccounts,
    updateCategories,
    updateRules,
  }), [
    transactions,
    budgets,
    goals,
    people, // ✅ Dépendance sur 'people' (enrichi) au lieu de 'rawPeople'
    accounts,
    categories,
    rules,
    loading,
    refreshData,
    updateTransactions,
    updateBudgets,
    updateGoals,
    updatePeople,
    updateAccounts,
    updateCategories,
    updateRules,
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be within DataProvider');
  return ctx;
}
