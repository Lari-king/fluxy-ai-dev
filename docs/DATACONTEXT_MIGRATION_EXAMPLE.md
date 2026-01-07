# Guide de Migration vers DataContext

## Vue d'ensemble

DataContext remplace le système GlobalEventLock + appels API locaux pour :
- ✅ Réduire les appels API (cache intelligent)
- ✅ Éliminer les memory leaks
- ✅ Simplifier le code des pages
- ✅ Centraliser la logique de données

## Exemple de Migration : Page Dashboard

### ❌ AVANT (Code problématique avec memory leaks)

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { transactionsAPI, budgetsAPI, goalsAPI, peopleAPI, accountsAPI } from '../../utils/api';
import { AppEvents, onEvent } from '../../utils/events';
import { globalEventLock } from '../../utils/global-event-lock';

export function Dashboard() {
  const { accessToken } = useAuth();
  const [data, setData] = useState({
    transactions: [],
    budgets: [],
    goals: [],
    people: [],
    accounts: [],
  });
  const [loading, setLoading] = useState(true);
  const isLoadingRef = React.useRef(false);

  // ❌ Problème 1: useEffect se ré-exécute à chaque accessToken
  useEffect(() => {
    loadData();
  }, [accessToken]);

  // ❌ Problème 2: Event listeners s'accumulent
  useEffect(() => {
    if (!accessToken) return;

    const handleGlobalRefresh = () => {
      globalEventLock.requestRefresh();
    };

    const unsubscribeTransactions = onEvent(AppEvents.TRANSACTIONS_UPDATED, handleGlobalRefresh);
    const unsubscribeBudgets = onEvent(AppEvents.BUDGETS_UPDATED, handleGlobalRefresh);
    const unsubscribePeople = onEvent(AppEvents.PEOPLE_UPDATED, handleGlobalRefresh);
    const unsubscribeCategories = onEvent(AppEvents.CATEGORIES_UPDATED, handleGlobalRefresh);
    const unsubscribeGoals = onEvent(AppEvents.GOALS_UPDATED, handleGlobalRefresh);

    // ❌ Problème 3: GlobalEventLock accumule les callbacks
    const unregisterRefresh = globalEventLock.registerRefresh(loadData);

    return () => {
      unsubscribeTransactions();
      unsubscribeBudgets();
      unsubscribePeople();
      unsubscribeCategories();
      unsubscribeGoals();
      unregisterRefresh();
    };
  }, [accessToken]); // ❌ Dépendance qui change peut causer des re-renders

  // ❌ Problème 4: Chaque page duplique cette logique
  const loadData = async () => {
    if (!accessToken) return;
    
    if (isLoadingRef.current) {
      console.log('⏸️ Dashboard: Chargement déjà en cours, ignoré');
      return;
    }

    isLoadingRef.current = true;
    console.log('🔄 Dashboard: Début du chargement des données');

    try {
      // ❌ Problème 5: 5 API calls simultanés à chaque chargement
      const [txn, budgets, goals, people, accounts] = await Promise.all([
        transactionsAPI.getAll(accessToken),
        budgetsAPI.getAll(accessToken),
        goalsAPI.getAll(accessToken),
        peopleAPI.getAll(accessToken),
        accountsAPI.getAll(accessToken),
      ]);

      setData({
        transactions: txn.transactions || [],
        budgets: budgets.budgets || [],
        goals: goals.goals || [],
        people: people.people || [],
        accounts: accounts.accounts || [],
      });

      console.log('✅ Dashboard: Données chargées avec succès');
    } catch (error) {
      console.error('❌ Dashboard: Erreur de chargement:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // ❌ Problème 6: Logique de calcul mélangée avec la logique de chargement
  const totalIncome = data.transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(data.transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
  
  // ... reste du composant
}
```

### ✅ APRÈS (Code optimisé avec DataContext)

```typescript
import React, { useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { memoryMonitor } from '../../utils/memory-monitor';

export function Dashboard() {
  // ✅ Solution : Une seule ligne pour accéder à toutes les données
  const { transactions, budgets, goals, people, accounts, loading } = useData();

  // ✅ Optionnel : Tracker le lifecycle pour détecter les memory leaks
  React.useEffect(() => {
    memoryMonitor.trackMount('Dashboard');
    return () => {
      memoryMonitor.trackUnmount('Dashboard');
    };
  }, []);

  // ✅ Calculs mémorisés pour éviter les re-calculs inutiles
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    const netBalance = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, netBalance };
  }, [transactions]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Revenus: {stats.totalIncome}€</p>
      <p>Dépenses: {stats.totalExpenses}€</p>
      <p>Solde net: {stats.netBalance}€</p>
      {/* ... reste du composant */}
    </div>
  );
}
```

## Avantages de DataContext

### 1. Code plus simple
- **Avant**: 70+ lignes de boilerplate
- **Après**: 5 lignes pour accéder aux données

### 2. Pas de duplication
- Chaque page n'a plus besoin de sa propre logique de chargement
- Un seul endroit pour gérer les appels API

### 3. Cache automatique
```typescript
// Navigation: Dashboard → Transactions → Dashboard
// Avant: 2× chargement complet (10 API calls)
// Après: 1× chargement + cache (5 API calls si < 30s)
```

### 4. Synchronisation automatique
```typescript
// Quand on importe des transactions :
const { updateTransactions } = useData();

const handleImport = async (newTransactions) => {
  const merged = [...transactions, ...newTransactions];
  await updateTransactions(merged);
  // ✅ DataContext émet automatiquement l'événement
  // ✅ Toutes les pages se synchronisent automatiquement
};
```

### 5. Pas de memory leaks
- Event listeners gérés centralement
- Cleanup automatique sur unmount
- Pas d'accumulation de callbacks

## Migration d'une page - Checklist

### ✅ Étape 1: Remplacer les imports
```diff
- import { transactionsAPI, budgetsAPI, ... } from '../../utils/api';
- import { AppEvents, onEvent } from '../../utils/events';
- import { globalEventLock } from '../../utils/global-event-lock';
+ import { useData } from '../../contexts/DataContext';
+ import { memoryMonitor } from '../../utils/memory-monitor';
```

### ✅ Étape 2: Remplacer le state local
```diff
- const [data, setData] = useState({ transactions: [], budgets: [], ... });
- const [loading, setLoading] = useState(true);
+ const { transactions, budgets, goals, people, loading } = useData();
```

### ✅ Étape 3: Supprimer les useEffect de chargement
```diff
- useEffect(() => {
-   loadData();
- }, [accessToken]);
-
- useEffect(() => {
-   const unsubscribe = onEvent(...);
-   const unregister = globalEventLock.registerRefresh(loadData);
-   return () => { unsubscribe(); unregister(); };
- }, [accessToken]);
```

### ✅ Étape 4: Supprimer la fonction loadData
```diff
- const loadData = async () => {
-   const [txn, budgets, ...] = await Promise.all([...]);
-   setData({ transactions: txn, ... });
- };
```

### ✅ Étape 5: Utiliser les fonctions d'update
```typescript
const { updateTransactions, updateBudgets } = useData();

const handleSave = async () => {
  // ✅ DataContext gère le save + la synchronisation
  await updateTransactions(newTransactions);
  // Pas besoin d'émettre d'événement, c'est automatique !
};
```

### ✅ Étape 6: Ajouter le memory tracking (optionnel mais recommandé)
```typescript
useEffect(() => {
  memoryMonitor.trackMount('YourPageName');
  return () => {
    memoryMonitor.trackUnmount('YourPageName');
  };
}, []);
```

## Patterns Courants

### Pattern 1: Afficher les données
```typescript
const { transactions, loading } = useData();

if (loading) {
  return <Skeleton />;
}

return (
  <div>
    {transactions.map(t => <TransactionCard key={t.id} transaction={t} />)}
  </div>
);
```

### Pattern 2: Modifier les données
```typescript
const { transactions, updateTransactions } = useData();

const handleEdit = async (id, updates) => {
  const updated = transactions.map(t => 
    t.id === id ? { ...t, ...updates } : t
  );
  await updateTransactions(updated);
  toast.success('Transaction mise à jour !');
};
```

### Pattern 3: Ajouter des données
```typescript
const { transactions, updateTransactions } = useData();

const handleAdd = async (newTransaction) => {
  const updated = [...transactions, { ...newTransaction, id: generateId() }];
  await updateTransactions(updated);
  toast.success('Transaction ajoutée !');
};
```

### Pattern 4: Supprimer des données
```typescript
const { transactions, updateTransactions } = useData();

const handleDelete = async (id) => {
  const updated = transactions.filter(t => t.id !== id);
  await updateTransactions(updated);
  toast.success('Transaction supprimée !');
};
```

### Pattern 5: Forcer un refresh
```typescript
const { refreshData } = useData();

const handleForceRefresh = () => {
  refreshData(true); // true = bypass cache
};
```

### Pattern 6: Calculs mémorisés
```typescript
const { transactions } = useData();

// ✅ Bon: mémorisé, recalculé seulement si transactions change
const totalExpenses = useMemo(() => 
  transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0),
  [transactions]
);

// ❌ Mauvais: recalculé à chaque render
const totalExpenses = transactions
  .filter(t => t.amount < 0)
  .reduce((sum, t) => sum + Math.abs(t.amount), 0);
```

## Debugging

### Vérifier le cache
```javascript
// Dans la console
const { lastFetch } = useData();
console.log('Cache age:', Date.now() - lastFetch, 'ms');
```

### Vérifier les memory leaks
```javascript
// Démarrer le tracking
window.__memoryMonitor.startTracking();

// Naviguer dans l'app...

// Vérifier l'état
window.__memoryMonitor.status();
window.__memoryMonitor.checkLeaks();
```

### Forcer un refresh
```javascript
// Dans le code
const { refreshData } = useData();
refreshData(true); // Bypass cache

// Ou dans la console
window.__dataContext.refreshData(true);
```

## Notes Importantes

1. **Ne pas dupliquer la logique de chargement**
   - Si vous avez besoin de données, utilisez `useData()`
   - Ne faites pas vos propres appels API sauf cas très spécifiques

2. **Utiliser les fonctions d'update**
   - `updateTransactions()`, `updateBudgets()`, etc.
   - Elles gèrent le save + la synchronisation automatiquement

3. **Le cache est intelligent**
   - TTL de 30 secondes par défaut
   - Bypass possible avec `refreshData(true)`
   - Invalidé automatiquement lors des updates

4. **Memory tracking**
   - Toujours ajouter `memoryMonitor.trackMount/Unmount` dans les useEffect
   - Aide à détecter les memory leaks rapidement

5. **Performance**
   - Utilisez `useMemo()` pour les calculs coûteux
   - Évitez les `.filter().map().reduce()` dans le render

## Exemples de Pages Migrées

- ✅ Dashboard (à migrer)
- ✅ Transactions (à migrer)
- ✅ Budgets (à migrer)
- ✅ Goals (à migrer)
- ✅ People (à migrer)

## Support

Pour toute question ou problème :
1. Vérifier `/docs/MEMORY_LEAK_FIX.md`
2. Utiliser `window.__memoryMonitor.status()`
3. Vérifier les logs console (avec emojis)
