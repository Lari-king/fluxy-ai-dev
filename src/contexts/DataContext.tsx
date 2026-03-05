/**
 * 🎯 DATA CONTEXT - VERSION INTÉGRALE RESTAURÉE
 * Support complet des sous-catégories, persistance robuste et liaison People Engine.
 */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction as BaseTransaction } from '@/utils/csv-parser';
import { Rule } from '@/features/intelligence/types';
import { PersonRelation, PeopleScores } from '@/features/people/types/base';
import { enrichPeopleData } from '@/features/people/engine/enrichment'; // Logiciel Engine
import { encryptData, decryptData } from '@/utils/security';
import { toast } from 'sonner';
import { DEFAULT_CATEGORIES } from '@/constants/default-categories';
import { extractCategoriesFromTransactions } from '@/utils/categories'; 

export type { PersonRelation };

// --- INTERFACES ---

export interface Category { 
  id: string; 
  name: string; 
  color: string; 
  icon: string; 
  emoji?: string; 
  parentId?: string; 
}

export interface Goal { 
  id: string; 
  name: string; 
  description: string; 
  current: number; 
  target: number; 
  deadline: string; 
  icon: string; 
  color: string; 
  category: string; 
  startDate: string; 
  endDate: string; 
  status: 'in-progress' | 'completed' | 'on-hold'; 
}

export interface Budget { 
  id: string; 
  name: string; 
  category: string; 
  allocated: number; 
  spent: number; 
  icon: string; 
  color: string; 
  rules?: any[]; 
  period?: 'monthly' | 'yearly' | 'weekly'; 
  month?: string; 
}

export interface Transaction extends Omit<BaseTransaction, 'splitNote' | 'personId'> { 
  personId?: string | null;
  isPending?: boolean; 
  metadata?: Record<string, any>; 
  tags?: string[]; 
  lastModified?: string; 
  updatedAt?: string; 
  isHidden?: boolean; 
  parentTransactionId?: string; 
  childTransactionIds?: string[];
  splitNote?: string;
  description: string;
  category: string;
  subCategory?: string;
  amount: number;
  date: string;
}

export interface Entity { id: string; [key: string]: any; }

interface DataContextType {
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  people: PersonRelation[]; // Version enrichie
  scores: PeopleScores | null; // Scores calculés par l'engine
  accounts: Entity[];
  categories: Category[];
  rules: Rule[];
  loading: boolean;
  refreshData: () => void;
  handleImport: (txs: Transaction[]) => Promise<void>;
  addTransaction: (tx: Transaction) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransactions: (txs: Transaction[]) => void;
  updateBudgets: (b: Budget[]) => void;
  updateGoals: (g: Goal[]) => void;
  updatePeople: (p: PersonRelation[]) => void;
  updateAccounts: (a: Entity[]) => void;
  updateCategories: (c: Category[]) => void;
  updateRules: (r: Rule[]) => void;
}

const DataContext = createContext<DataContextType | null>(null);
const getStorageKey = (token: string, key: string) => `flux_data_${token}_${key}`;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const activeToken = useMemo(() => accessToken || 'user_176', [accessToken]);
  
  // États de base (Données brutes)
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rawPeople, setRawPeople] = useState<PersonRelation[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Entity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ ENRICHISSEMENT VIA ENGINE (Liaison Transactions/People)
  const { people, scores } = useMemo(() => {
    if (!rawPeople.length) return { people: [], scores: null };
    const result = enrichPeopleData(rawPeople, transactions);
    return { 
      people: result.enrichedPeople, 
      scores: result.scores 
    };
  }, [rawPeople, transactions]);

  // Expose catégories pour debug
  useEffect(() => {
    (window as any).categories = categories;
  }, [categories]);

  const saveToStorage = useCallback((key: string, data: any) => {
    try {
      const storageKey = getStorageKey(activeToken, key);
      const encrypted = encryptData(data, activeToken);
      localStorage.setItem(storageKey, encrypted);
    } catch (err) {
      console.error(`❌ Erreur sauvegarde ${key}:`, err);
    }
  }, [activeToken]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const keys = ['transactions', 'people', 'budgets', 'goals', 'accounts', 'categories', 'rules'];
      keys.forEach(key => {
        const stored = localStorage.getItem(getStorageKey(activeToken, key));
        if (stored) {
          const decrypted = decryptData(stored, activeToken);
          if (decrypted) {
            if (key === 'transactions') setTransactions(decrypted);
            if (key === 'people') setRawPeople(decrypted);
            if (key === 'budgets') setBudgets(decrypted);
            if (key === 'goals') setGoals(decrypted);
            if (key === 'accounts') setAccounts(decrypted);
            if (key === 'categories') setCategories(decrypted);
            if (key === 'rules') setRules(decrypted);
          }
        } else if (key === 'categories') {
          setCategories(DEFAULT_CATEGORIES);
        }
      });
    } finally { setLoading(false); }
  }, [activeToken]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- ACTIONS ---

  const handleImport = useCallback(async (newTxs: Transaction[]) => {
    const normalizedTxs = newTxs.map(tx => ({
      ...tx,
      id: tx.id || crypto.randomUUID(),
      description: tx.description || (tx as any).label || "Sans description",
      category: tx.category || "Inconnue",
      subCategory: tx.subCategory || "",
      amount: typeof tx.amount === 'string' ? parseFloat(tx.amount) : tx.amount,
      date: tx.date || new Date().toISOString()
    }));

    setCategories(prevCats => {
      const updatedCats = extractCategoriesFromTransactions(normalizedTxs, prevCats);
      saveToStorage('categories', updatedCats);
      return updatedCats;
    });

    setTransactions(prev => {
      const combined = [...normalizedTxs, ...prev];
      const uniqueMap = new Map();
      combined.forEach(t => uniqueMap.set(t.id, t));
      const next = Array.from(uniqueMap.values());
      saveToStorage('transactions', next);
      return next;
    });
    
    toast.success(`${newTxs.length} transactions importées`);
  }, [saveToStorage]);

  const addTransaction = useCallback(async (tx: Transaction) => {
    setTransactions(prev => {
      const next = [tx, ...prev];
      saveToStorage('transactions', next);
      return next;
    });
  }, [saveToStorage]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    const timestamp = new Date().toISOString();
    setTransactions(prev => {
      const next = prev.map(t => t.id === id 
        ? { ...t, ...updates, updatedAt: timestamp, lastModified: timestamp } 
        : t
      );
      saveToStorage('transactions', next);
      return next;
    });
  }, [saveToStorage]);

  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions(prev => {
      const next = prev.filter(t => t.id !== id);
      saveToStorage('transactions', next);
      return next;
    });
  }, [saveToStorage]);

  // --- VALUE EXPOSÉE ---

  const value = useMemo(() => ({
    transactions, 
    budgets, 
    goals, 
    people, // ✅ Expose la version calculée (enrichie)
    scores, // ✅ Expose les scores IA de l'engine
    accounts, 
    categories, 
    rules, 
    loading,
    refreshData: loadData,
    handleImport,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateTransactions: (txs: Transaction[]) => { setTransactions(txs); saveToStorage('transactions', txs); },
    updateBudgets: (b: Budget[]) => { setBudgets(b); saveToStorage('budgets', b); },
    updateGoals: (g: Goal[]) => { setGoals(g); saveToStorage('goals', g); },
    updatePeople: (p: PersonRelation[]) => { 
      setRawPeople(p); 
      saveToStorage('people', p); 
    },
    updateAccounts: (a: Entity[]) => { setAccounts(a); saveToStorage('accounts', a); },
    updateCategories: (c: Category[]) => { setCategories(c); saveToStorage('categories', c); },
    updateRules: (r: Rule[]) => { setRules(r); saveToStorage('rules', r); },
  }), [
    transactions, budgets, goals, people, scores, accounts, categories, rules, loading,
    loadData, handleImport, addTransaction, updateTransaction, deleteTransaction, saveToStorage
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};