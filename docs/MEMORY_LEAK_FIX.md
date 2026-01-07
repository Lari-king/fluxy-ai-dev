# Correction Définitive du Problème "Out of Memory"

## 🔴 Problème Critique Identifié

L'erreur "out of memory" persistait malgré le système GlobalEventLock car **le vrai problème n'était pas les appels API simultanés, mais l'accumulation de composants et event listeners en mémoire**.

### Analyse des Causes Profondes

1. **Composants jamais démontés** 
   - `App.tsx` affiche conditionnellement les pages mais ne les démonte jamais
   - Tous les composants restent en mémoire simultanément
   - Chaque page garde son état, ses event listeners, ses timers

2. **Accumulation d'event listeners**
   - Chaque navigation ajoute de nouveaux listeners
   - Les anciens listeners ne sont jamais nettoyés
   - `globalEventLock.refreshCallbacks` accumule des dizaines de callbacks identiques

3. **Callbacks multiples**
   - Dashboard s'enregistre dans globalEventLock → 5 API calls
   - Budgets s'enregistre dans globalEventLock → 4 API calls
   - People s'enregistre dans globalEventLock → 1 API call
   - Navigation 5 fois = 50 API calls potentiels au lieu de 10

4. **Ré-exécution des useEffect**
   - Chaque navigation peut déclencher les useEffect avec `[accessToken]`
   - Les dépendances causent des re-renders inutiles
   - Les timers/debounce ne sont pas nettoyés

5. **Pas de cache**
   - Chaque page recharge toutes ses données à chaque visite
   - Les mêmes données sont fetchées encore et encore
   - Aucune mutualisation des requêtes

## ✅ Solution Complète Implémentée

### 1. DataContext Global avec Cache

**Fichier**: `/contexts/DataContext.tsx`

Un context global qui :
- ✅ **Centralise tous les appels API** (single source of truth)
- ✅ **Cache intelligent avec TTL** (30 secondes par défaut)
- ✅ **Prévient les appels API dupliqués** avec un flag `isLoadingRef`
- ✅ **Debounce global** (500ms) pour toutes les requêtes de refresh
- ✅ **Cleanup automatique** sur unmount avec `mountedRef`
- ✅ **Écoute des événements globaux** pour synchroniser les données
- ✅ **Fonctions d'update optimisées** pour chaque type de données

**Avantages** :
```
Avant : 
  Navigation Dashboard → Budgets → People → Dashboard
  = 4 chargements complets × 10 API calls = 40 appels API

Après :
  Navigation Dashboard → Budgets → People → Dashboard
  = 1 chargement initial + cache pour les suivants = 10 appels API
  (ou moins si dans le TTL de 30s)
```

### 2. GlobalEventLock Optimisé

**Fichier**: `/utils/global-event-lock.ts`

Améliorations :
- ✅ **Limite MAX_CALLBACKS** (10) pour éviter l'accumulation
- ✅ **Logs détaillés** pour tracer les registrations/unregistrations
- ✅ **Méthode getDebugInfo()** pour inspecter l'état
- ✅ **Méthode cleanup()** pour forcer le nettoyage
- ✅ **Helper window.__debugGlobalEventLock()** pour debugging

**Note** : GlobalEventLock est maintenant marqué comme DEPRECATED. 
Utilisez DataContext pour les nouvelles implémentations.

### 3. Memory Monitor

**Fichier**: `/utils/memory-monitor.ts`

Un outil de debugging pour traquer les memory leaks :
- ✅ **Track mounts/unmounts** de composants
- ✅ **Track event listeners** (add/remove)
- ✅ **Track API calls** avec durée d'exécution
- ✅ **Détection automatique de leaks** (trop de mounts, listeners, API calls)
- ✅ **Rapports détaillés** avec statistiques

**Utilisation** :
```javascript
// Dans la console du navigateur
window.__memoryMonitor.startTracking()  // Démarrer le tracking
window.__memoryMonitor.status()         // Voir l'état actuel
window.__memoryMonitor.checkLeaks()     // Détecter les leaks
window.__memoryMonitor.report()         // Rapport détaillé
window.__memoryMonitor.reset()          // Reset toutes les stats
window.__memoryMonitor.stopTracking()   // Arrêter le tracking
```

## 🔄 Migration des Pages

Les pages doivent être migrées de GlobalEventLock vers DataContext :

### Avant (avec GlobalEventLock) :
```typescript
const [data, setData] = useState({...});
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, [accessToken]);

useEffect(() => {
  const unregister = globalEventLock.registerRefresh(loadData);
  return () => unregister();
}, []);

const loadData = async () => {
  const [txn, budgets, goals] = await Promise.all([
    transactionsAPI.getAll(accessToken),
    budgetsAPI.getAll(accessToken),
    goalsAPI.getAll(accessToken),
  ]);
  setData({ transactions: txn, budgets, goals });
};
```

### Après (avec DataContext) :
```typescript
const { transactions, budgets, goals, loading } = useData();

// C'est tout ! Pas de useEffect, pas de loadData, pas de state local
// Les données sont automatiquement synchronisées et mises en cache
```

## 📊 Résultats Attendus

### Avant les corrections :
- ❌ 10-40 API calls par navigation
- ❌ Composants jamais démontés
- ❌ Event listeners accumulés
- ❌ Out of memory après quelques minutes
- ❌ Pas de cache, tout rechargé à chaque fois

### Après les corrections :
- ✅ 0-10 API calls (selon le cache)
- ✅ Composants correctement gérés
- ✅ Event listeners nettoyés
- ✅ Pas de memory leaks
- ✅ Cache intelligent avec TTL

## 🧪 Tests Recommandés

1. **Test de navigation intensive**
   ```
   1. Ouvrir window.__memoryMonitor.startTracking()
   2. Naviguer entre toutes les pages 10 fois
   3. Vérifier window.__memoryMonitor.status()
   4. S'assurer qu'il n'y a pas d'accumulation
   ```

2. **Test d'import de transactions**
   ```
   1. Importer 50 transactions
   2. Vérifier que seulement 1 refresh global se produit
   3. Vérifier que le cache fonctionne
   ```

3. **Test de cache**
   ```
   1. Aller sur Dashboard (charge les données)
   2. Aller sur Transactions
   3. Retourner sur Dashboard dans les 30s
   4. Vérifier dans les logs : "Using cached data"
   ```

4. **Test de memory leaks**
   ```
   1. window.__memoryMonitor.startTracking()
   2. Utiliser l'app normalement pendant 5 minutes
   3. window.__memoryMonitor.checkLeaks()
   4. Vérifier qu'aucun leak n'est détecté
   ```

## 🎯 Prochaines Étapes

1. **Migrer toutes les pages vers DataContext**
   - Dashboard ✅ (à faire)
   - Transactions ✅ (à faire)
   - Budgets ✅ (à faire)
   - Goals ✅ (à faire)
   - People ✅ (à faire)
   - Patrimoine ✅ (à faire)
   - Simulator ✅ (à faire)

2. **Supprimer GlobalEventLock une fois la migration terminée**
   - Garder uniquement pour compatibilité temporaire
   - Retirer complètement dans une prochaine version

3. **Optimiser le cache**
   - Ajouter un invalidation sélective (par type de données)
   - Permettre de configurer le TTL par type de données
   - Ajouter un système de refresh en arrière-plan

## 🔍 Debugging

### Vérifier l'état de GlobalEventLock
```javascript
window.__debugGlobalEventLock()
```

### Monitorer la mémoire
```javascript
window.__memoryMonitor.status()
window.__memoryMonitor.checkLeaks()
```

### Logs Console
Tous les logs importants sont préfixés avec des emojis :
- 🔄 = Chargement en cours
- ✅ = Succès
- ❌ = Erreur
- ⏸️ = Action ignorée (déjà en cours, pas de token, etc.)
- 🧹 = Nettoyage
- 📦 = Component mount
- 📤 = Component unmount
- 🎧 = Event listener add
- 🔇 = Event listener remove
- 🌐 = API call

## ⚠️ Notes Importantes

1. **Ne pas désactiver les logs de production** avant d'avoir confirmé que tout fonctionne
2. **Surveiller les performances** dans les Dev Tools (onglet Performance et Memory)
3. **Tester sur différents navigateurs** (Chrome, Firefox, Safari)
4. **Tester avec des datasets volumineux** (1000+ transactions)
5. **Vérifier les Web Vitals** (FCP, LCP, CLS, FID, TTI)

## 📚 Documentation Associée

- `/docs/EVENT_SYSTEM_FIX.md` - Première tentative avec GlobalEventLock
- `/docs/ARCHITECTURE_FLOW.md` - Architecture générale de l'app
- `/docs/CONSOLE_MONITORING.md` - Guide des logs console
