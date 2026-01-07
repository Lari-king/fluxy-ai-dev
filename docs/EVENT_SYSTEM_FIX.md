# Correction du système d'événements - Out of Memory Fix

## Problème identifié

L'application rencontrait une erreur "out of memory" causée par une cascade d'appels API simultanés due à une mauvaise gestion des événements globaux.

### Causes du problème

1. **Multiples événements simultanés** : Lors de l'import de transactions, 2 événements étaient émis simultanément (TRANSACTIONS_UPDATED + CATEGORIES_UPDATED)

2. **Écoute d'événements par plusieurs modules** :
   - Dashboard écoute 5 événements différents
   - Budgets écoute TRANSACTIONS_UPDATED
   - People écoute TRANSACTIONS_UPDATED
   
3. **Rechargements en cascade** :
   - Chaque module recharge TOUTES ses données à chaque événement
   - Dashboard fait 5 appels API en parallèle (transactions, budgets, goals, people, accounts)
   - Budgets fait 4 appels API en parallèle (budgets, transactions, categories, people)
   - People fait 1 appel API
   
4. **Scénario catastrophique** :
   ```
   Import transactions
   → Émet 2 événements
   → Dashboard recharge (5 API calls)
   → Budgets recharge (4 API calls)
   → People recharge (1 API call)
   = 10 API calls simultanés
   
   Si certains modules sauvegardent et émettent d'autres événements :
   → Nouveau cycle de rechargements
   → 10+ API calls supplémentaires
   → Boucle infinie → Out of memory
   ```

## Solution implémentée

### 1. Système de verrou global (`global-event-lock.ts`)

Un gestionnaire centralisé qui :
- **Debounce global** : 500ms au lieu de 300ms par module
- **Verrou d'exécution** : Empêche les rechargements simultanés
- **File d'attente** : Si un rechargement est demandé pendant qu'un autre est en cours, il est mis en attente
- **Exécution groupée** : Tous les modules se rechargent ensemble en une seule fois

### 2. Modifications par module

#### Dashboard (`/components/pages/Dashboard.tsx`)
- ✅ Utilise `globalEventLock.requestRefresh()` au lieu d'un debounce local
- ✅ Enregistre sa fonction `loadData()` auprès du verrou global
- ✅ Tous les événements déclenchent le même mécanisme de rechargement

#### Budgets (`/components/pages/Budgets.tsx`)
- ✅ Même approche avec `globalEventLock`
- ✅ Suppression du debounce local
- ✅ Un seul timer global pour tous les modules

#### People (`/components/pages/People.tsx`)
- ✅ Intégration avec `globalEventLock`
- ✅ Suppression du debounce local

#### Transactions (`/components/pages/Transactions.tsx`)
- ✅ N'émet plus qu'UN SEUL événement lors de l'import au lieu de deux
- ✅ TRANSACTIONS_UPDATED couvre maintenant les changements de catégories aussi

### 3. Avantages de la solution

1. **Un seul rechargement global** au lieu de rechargements par module
2. **Debounce efficace** : Les événements multiples sont fusionnés
3. **Prévention des boucles** : Le verrou empêche les cascades infinies
4. **Logs clairs** : Console affiche l'état du système pour debugging
5. **Performance optimale** : Les API calls sont toujours groupés

## Flux de fonctionnement après correction

```
Import transactions
→ Émet 1 événement (TRANSACTIONS_UPDATED)
→ globalEventLock.requestRefresh() appelé 3 fois (Dashboard, Budgets, People)
→ Timer de 500ms démarre
→ Pendant ces 500ms, tous les autres événements sont ignorés
→ Après 500ms, exécution UNIQUE :
  ├─ Dashboard.loadData()
  ├─ Budgets.loadData()
  └─ People.loadPeople()
→ Maximum 10 API calls en parallèle, UNE SEULE FOIS
→ Verrou empêche tout nouveau rechargement pendant l'exécution
```

## Console logs pour monitoring

Le système affiche maintenant :
- `⏱️ Global refresh scheduled in 500ms` : Refresh programmé
- `🔄 Executing global refresh for all modules...` : Exécution en cours
- `⏸️ Global refresh already in progress, will refresh again after` : Verrou actif
- `✅ Global refresh completed successfully` : Terminé avec succès
- `🔁 Executing pending refresh...` : Exécution d'un refresh en attente

## Tests recommandés

1. **Import de transactions** : Vérifier qu'un seul rechargement se produit
2. **Modifications multiples rapides** : Vérifier le debounce
3. **Navigation entre pages** : S'assurer que les données restent synchronisées
4. **Monitoring mémoire** : Vérifier qu'il n'y a plus de fuites

## Notes techniques

- Le verrou utilise un pattern Singleton pour garantir une instance unique
- Les callbacks sont stockés dans un Set pour éviter les doublons
- Le système gère automatiquement les unsubscribe lors du démontage des composants
- Compatible avec le système d'événements existant (pas de breaking changes)
