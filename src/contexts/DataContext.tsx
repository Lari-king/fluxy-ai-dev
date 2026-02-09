/**
 * 🎯 DATA CONTEXT - VERSION R.A.S.P SÉCURISÉE (AES)
 * * Centralise les données de l'application avec chiffrement local
 * pour protéger les informations financières sensibles.
 */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Transaction as BaseTransaction } from '@/utils/csv-parser';
import { Rule } from '@/types/rules';
import { PersonRelation } from '@/types/people';
import { encryptData, decryptData } from '@/utils/security'; // Import des nouvelles fonctions
import { toast } from 'sonner';

// --- TYPES ---
export type { PersonRelation }; 

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  emoji?: string;
  parentId?: string;
}

export interface Transaction extends Omit<BaseTransaction, 'splitNote'> {
  personId?: string;
  isPending?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  lastModified?: string;
  isHidden?: boolean;
  parentTransactionId?: string;
  childTransactionIds?: string[];
}

export interface Entity { id: string; [key: string]: any; }

interface DataContextType {
  transactions: Transaction[];
  budgets: Entity[];
  goals: Entity[];
  people: PersonRelation[];
  accounts: Entity[];
  categories: Category[];
  rules: Rule[];
  loading: boolean;
  refreshData: () => void;
  updateTransactions: (txs: Transaction[]) => void;
  updateBudgets: (b: Entity[]) => void;
  updateGoals: (g: Entity[]) => void;
  updatePeople: (p: PersonRelation[]) => void;
  updateAccounts: (a: Entity[]) => void;
  updateCategories: (c: Category[]) => void;
  updateRules: (r: Rule[]) => void;
}

const DataContext = createContext<DataContextType | null>(null);

// Aide pour générer les clés de stockage
const getStorageKey = (token: string, key: string) => `flux_data_${token}_${key}`;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const activeToken = useMemo(() => accessToken || 'user_176', [accessToken]);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rawPeople, setRawPeople] = useState<PersonRelation[]>([]);
  const [budgets, setBudgets] = useState<Entity[]>([]);
  const [goals, setGoals] = useState<Entity[]>([]);
  const [accounts, setAccounts] = useState<Entity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);

  const loadedTokenRef = useRef<string | null>(null);

  /**
   * ✅ Sauvegarde sécurisée (Chiffrée)
   */
  const saveToStorage = useCallback((key: string, data: any) => {
    try {
      const storageKey = getStorageKey(activeToken, key);
      const encrypted = encryptData(data, activeToken);
      localStorage.setItem(storageKey, encrypted);
    } catch (err) {
      console.error(`❌ Erreur sauvegarde ${key}:`, err);
    }
  }, [activeToken]);

  /**
   * ✅ Chargement sécurisé (Déchiffrement)
   */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const keys = ['transactions', 'people', 'budgets', 'goals', 'accounts', 'categories', 'rules'];
      const dataHandlers: Record<string, (val: any) => void> = {
        transactions: setTransactions,
        people: setRawPeople,
        budgets: setBudgets,
        goals: setGoals,
        accounts: setAccounts,
        categories: setCategories,
        rules: setRules
      };

      keys.forEach(key => {
        const fullKey = getStorageKey(activeToken, key);
        const stored = localStorage.getItem(fullKey);
        
        if (stored) {
          // Si les données commencent par "{" ou "[", elles ne sont pas encore chiffrées (migration)
          const isLegacy = stored.startsWith('{') || stored.startsWith('[');
          const decrypted = isLegacy ? JSON.parse(stored) : decryptData(stored, activeToken);
          
          if (decrypted) {
            dataHandlers[key](decrypted);
            // On re-sauvegarde en format chiffré si c'était du vieux format
            if (isLegacy) saveToStorage(key, decrypted);
          }
        }
      });
      
      loadedTokenRef.current = activeToken;
    } catch (err) {
      console.error("❌ RASP Load Error:", err);
      toast.error("Erreur lors du chargement des données sécurisées");
    } finally {
      setLoading(false);
    }
  }, [activeToken, saveToStorage]);

  useEffect(() => {
    if (loadedTokenRef.current !== activeToken) {
      loadData();
    }
  }, [activeToken, loadData]);

  // Handlers de mise à jour simplifiés
  const updateTransactions = useCallback((txs: Transaction[]) => {
    setTransactions(txs);
    saveToStorage('transactions', txs);
  }, [saveToStorage]);

  const updatePeople = useCallback((p: PersonRelation[]) => {
    setRawPeople(p);
    saveToStorage('people', p);
  }, [saveToStorage]);

  const updateRules = useCallback((r: Rule[]) => {
    setRules(r);
    saveToStorage('rules', r);
  }, [saveToStorage]);

  const updateBudgets = useCallback((b: Entity[]) => { 
    setBudgets(b); 
    saveToStorage('budgets', b);
  }, [saveToStorage]);

  const updateGoals = useCallback((g: Entity[]) => { 
    setGoals(g); 
    saveToStorage('goals', g);
  }, [saveToStorage]);

  const updateAccounts = useCallback((a: Entity[]) => { 
    setAccounts(a); 
    saveToStorage('accounts', a);
  }, [saveToStorage]);

  const updateCategories = useCallback((c: Category[]) => { 
    setCategories(c); 
    saveToStorage('categories', c);
  }, [saveToStorage]);

  const people = useMemo(() => rawPeople.map(p => ({ ...p })), [rawPeople]);

  const value = useMemo(() => ({
    transactions, budgets, goals, people, accounts, categories, rules, loading,
    refreshData: loadData, 
    updateTransactions, updateBudgets, updateGoals, updatePeople, updateAccounts, updateCategories, updateRules,
  }), [transactions, budgets, goals, people, accounts, categories, rules, loading, loadData, updateTransactions, updateBudgets, updateGoals, updatePeople, updateAccounts, updateCategories, updateRules]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};