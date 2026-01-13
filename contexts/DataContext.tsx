/**
 * Data Context - LOCAL STORAGE VERSION
 * ✅ Toutes les données stockées en localStorage
 * ✅ Pas de backend requis
 * ✅ Optimisé avec useMemo et useCallback
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Transaction as BaseTransaction } from 'src/utils/csv-parser'; // ✅ Import de base depuis csv-parser
import { Rule } from '../types/rules'; // ✅ Import du vrai type Rule

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

export interface Person {
  id: string;
  name: string;
  avatar: string;
  relationship: string;
  color: string;
  // HARMONISATION DES TYPES: ajout de 'circle' et 'totalImpact' pour People.tsx
  circle: 'large' | 'direct' | 'extended'; 
  totalImpact: number; // Ceci est un champ calculé ou agrégé
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

// Les données enrichies des personnes (version utilisée dans le context)
export interface EnrichedPerson extends Person {
  totalAmount: number;
  income: number;
  expenses: number;
  transactionCount: number;
  averageTransaction: number;
  lastTransactionDate?: string;
  lastTransactionAmount?: number;
}

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
  const [people, setPeople] = useState<EnrichedPerson[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  // Protection contre les rechargements multiples
  const loadedTokenRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

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
        setPeople(loadFromStorage(getStorageKey(userId, 'people'), []));
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
      ...txn, // ✅ On garde TOUT (y compris subCategory, merchant, etc.)
      
      // On s'assure juste que les champs vitaux ne sont pas vides
      description: (txn.description || "Nouvelle opération").trim(),
      amount: typeof txn.amount === 'string' ? parseFloat(txn.amount) : (txn.amount || 0),
      date: (txn.date || today).split('T')[0],
      category: txn.category || "Non catégorisé",
      // ✅ On force la préservation explicite si besoin, mais le ...txn le fait déjà
      subCategory: txn.subCategory, 
      updatedAt: new Date().toISOString(),
      
      childTransactionIds: Array.isArray(txn.childTransactionIds) ? txn.childTransactionIds : txn.childTransactionIds
    }));
  
    setTransactions(sanitizedTransactions);
    
    if (accessToken) {
      saveToStorage(getStorageKey(accessToken, 'transactions'), sanitizedTransactions);
    }
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
    setPeople(p);
    if (accessToken) {
      saveToStorage(getStorageKey(accessToken, 'people'), p);
    }
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
  const value = useMemo(() => ({
    transactions,
    budgets,
    goals,
    people,
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
    people,
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