/**
 * Data Context - LOCAL STORAGE VERSION
 * ✅ Toutes les données stockées en localStorage
 * ✅ Pas de backend requis
 * ✅ Optimisé avec useMemo et useCallback
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
// ❌ SUPPRIMÉ : import { db } from '../src/db'; - Fichier inexistant
import { enrichPeopleWithStats } from '../src/utils/people-calculator';
import { Transaction } from 'src/utils/csv-parser'; // ✅ Import unique depuis csv-parser
import { Rule } from '../types/rules'; // ✅ Import du vrai type Rule
import { initializeCategoriesIfEmpty, type Category } from '../src/constants/default-categories'; // 🆕 Import des catégories par défaut

// --- Types d'Entités (Plus spécifiques pour Dexie) ---

// Type de base pour une entité (ID et autres propriétés)
interface Entity {
  id: string;
  [key: string]: any;
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
export type { Transaction };
export type { Rule }; // ✅ Réexport de Rule pour faciliter l'import
export type { Category }; // ✅ Réexport de Category pour faciliter l'import

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
        
        // 🆕 Charger les catégories avec initialisation par défaut si vide
        const loadedCategories = loadFromStorage<Category[]>(getStorageKey(userId, 'categories'), []);
        const initializedCategories = initializeCategoriesIfEmpty(loadedCategories);
        setCategories(initializedCategories);
        
        // Si des catégories par défaut ont été ajoutées, les sauvegarder
        if (initializedCategories.length > 0 && loadedCategories.length === 0) {
          saveToStorage(getStorageKey(userId, 'categories'), initializedCategories);
        }
        
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
    // 🛡️ Nettoyage et sécurisation des données
    const sanitizedTransactions = t.map(txn => {
      // Préparation d'une date stable au format YYYY-MM-DD si aucune date n'est fournie
      const today = new Date().toISOString().split('T')[0];
      
      return {
        ...txn,
        // 1. Évite l'écran blanc : force une chaîne de caractères pour la description
        description: (txn.description || "Nouvelle opération").trim(),
        
        // 2. Assure un format numérique pour le montant
        amount: typeof txn.amount === 'string' ? parseFloat(txn.amount) : (txn.amount || 0),
        
        // 3. Fix Date : Garde le format YYYY-MM-DD pour éviter les bugs de fuseaux horaires
        // Si txn.date contient déjà un ISO complet, on extrait la partie date
        date: (txn.date || today).split('T')[0],
        
        // 4. Catégorie par défaut
        category: txn.category || "Non catégorisé",
        
        // 5. Métadonnées de suivi
        updatedAt: new Date().toISOString()
      };
    });
  
    // Mise à jour de l'état local
    setTransactions(sanitizedTransactions);
    
    // Sauvegarde persistante
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