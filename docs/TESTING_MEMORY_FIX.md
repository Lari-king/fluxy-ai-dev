# Tests de Validation - Memory Leak Fix

## 🎯 Objectif

Valider que les corrections du problème "out of memory" fonctionnent correctement.

## 🧪 Tests à Effectuer

### Test 1: DataContext Initialization

**Objectif**: Vérifier que DataContext se charge correctement

**Étapes**:
1. Ouvrir l'application
2. Ouvrir la console du navigateur
3. Vérifier les logs suivants :
   ```
   💡 Memory Monitor available: window.__memoryMonitor
   🔄 DataContext: Fetching all data...
   ✅ DataContext: All data fetched successfully
   ```
4. Exécuter dans la console :
   ```javascript
   window.__dataContext.getData()
   ```
5. Vérifier que vous voyez les counts de données

**Résultat attendu**: ✅ Les données sont chargées et disponibles via window.__dataContext

---

### Test 2: Navigation sans Memory Leaks

**Objectif**: Vérifier qu'aucun component ou listener ne s'accumule

**Étapes**:
1. Démarrer le tracking :
   ```javascript
   window.__memoryMonitor.startTracking()
   ```
2. Naviguer dans cet ordre :
   - Dashboard → Transactions → Budgets → Goals → People → Dashboard
   - Répéter 5 fois
3. Vérifier le statut :
   ```javascript
   window.__memoryMonitor.status()
   ```
4. Vérifier les leaks :
   ```javascript
   window.__memoryMonitor.checkLeaks()
   ```

**Résultat attendu**: 
- ✅ Aucun leak détecté
- ✅ Chaque composant a au maximum 1 instance active
- ✅ Les event listeners sont < 10 par événement

**Exemple de sortie correcte**:
```
📊 MEMORY MONITOR STATUS
========================

🏗️ Component Mounts:
  ✅ OK AppContent: 1
  ✅ OK Dashboard: 1
  ❌ UNMOUNTED Transactions: 0
  ❌ UNMOUNTED Budgets: 0
  
🎧 Event Listeners:
  ✅ OK app:transactions:updated: 5
  ✅ OK app:budgets:updated: 5
  
🌐 API Calls:
  Total tracked: 15
  Last 10s: 2
  
✅ No obvious memory leaks detected
```

---

### Test 3: Cache Functionality

**Objectif**: Vérifier que le cache fonctionne correctement

**Étapes**:
1. Aller sur Dashboard
2. Noter dans les logs : `✅ DataContext: All data fetched successfully`
3. Aller sur Transactions
4. Retourner sur Dashboard dans les 30 secondes
5. Vérifier le log : `✅ DataContext: Using cached data (age: Xs)`
6. Attendre 30 secondes
7. Aller sur Budgets
8. Vérifier le log : `🔄 DataContext: Fetching all data...` (cache expiré)

**Résultat attendu**: 
- ✅ Dans les 30s : données viennent du cache
- ✅ Après 30s : nouvelles données fetchées

**Vérifier l'âge du cache**:
```javascript
window.__dataContext.getData()
// Voir le champ "cacheAge" en millisecondes
```

---

### Test 4: GlobalEventLock Cleanup

**Objectif**: Vérifier que GlobalEventLock n'accumule pas de callbacks

**Étapes**:
1. Naviguer plusieurs fois entre les pages
2. Exécuter :
   ```javascript
   window.__debugGlobalEventLock()
   ```
3. Vérifier le nombre de callbacks

**Résultat attendu**: 
- ✅ callbacks: 0 (car nous utilisons maintenant DataContext)
- ✅ Si > 0, vérifier que callbacks <= 10 (MAX_CALLBACKS)

---

### Test 5: Import de Transactions

**Objectif**: Vérifier qu'un import ne cause pas de cascade d'appels

**Étapes**:
1. Activer le tracking :
   ```javascript
   window.__memoryMonitor.startTracking()
   ```
2. Aller sur la page Transactions
3. Importer un fichier CSV avec 10-20 transactions
4. Observer les logs console
5. Vérifier le status :
   ```javascript
   window.__memoryMonitor.status()
   ```

**Résultat attendu**:
- ✅ Un seul événement TRANSACTIONS_UPDATED émis
- ✅ Un seul refresh global déclenché
- ✅ < 15 API calls au total (import + refresh)
- ✅ Pas de cascade infinie d'appels

**Logs attendus**:
```
✅ Imported 10 transactions with 3 new categories
📢 DataContext: Received data update event
⏱️ DataContext: Refresh scheduled in 500ms
🔄 DataContext: Fetching all data...
✅ DataContext: All data fetched successfully
```

---

### Test 6: Modification Rapide de Données

**Objectif**: Vérifier que le debounce fonctionne correctement

**Étapes**:
1. Aller sur la page Budgets
2. Créer 5 budgets rapidement (< 5 secondes entre chaque)
3. Observer les logs
4. Vérifier :
   ```javascript
   window.__dataContext.getData()
   ```

**Résultat attendu**:
- ✅ Les 5 budgets sont créés
- ✅ Seulement 1-2 refresh globaux (grâce au debounce)
- ✅ Pas de 5 refresh séparés

**Logs attendus**:
```
✅ Budget created
📢 DataContext: Received data update event
⏱️ DataContext: Refresh scheduled in 500ms
✅ Budget created
⏱️ DataContext: Refresh scheduled in 500ms (debounce reset)
✅ Budget created
⏱️ DataContext: Refresh scheduled in 500ms (debounce reset)
...
🔄 DataContext: Fetching all data... (un seul refresh final)
✅ DataContext: All data fetched successfully
```

---

### Test 7: Memory Usage dans Chrome DevTools

**Objectif**: Vérifier qu'il n'y a pas de fuites mémoire

**Étapes**:
1. Ouvrir Chrome DevTools (F12)
2. Aller dans l'onglet "Memory"
3. Prendre un snapshot initial (Heap snapshot)
4. Naviguer intensivement dans l'app pendant 2 minutes
5. Forcer le garbage collection (icône poubelle)
6. Prendre un nouveau snapshot
7. Comparer les snapshots

**Résultat attendu**:
- ✅ La mémoire augmente légèrement (données chargées)
- ✅ Pas d'augmentation continue après le GC
- ✅ Pas de "Detached DOM tree" accumulés
- ✅ Pas de event listeners multiples

**Comment lire les résultats**:
- Memory avant: ~20 MB
- Memory après GC: ~25 MB (acceptable)
- ⚠️ Memory après GC: > 50 MB (problème potentiel)

---

### Test 8: Performance - API Calls Count

**Objectif**: Mesurer le nombre d'appels API sur un scénario d'usage réel

**Scénario**:
1. Login
2. Dashboard (premier chargement)
3. Transactions
4. Import CSV (10 transactions)
5. Budgets
6. Créer 2 budgets
7. Goals
8. People
9. Retour Dashboard
10. Settings

**Avant les corrections** (estimé):
- Login: 1 call
- Dashboard: 5 calls
- Transactions: 4 calls
- Import CSV: 9 calls (save + refresh cascade)
- Budgets: 4 calls
- Create budgets: 6 calls (2 × save + refresh)
- Goals: 3 calls
- People: 2 calls
- Dashboard: 5 calls
- Settings: 1 call
**Total**: ~40 API calls

**Après les corrections** (attendu):
- Login: 1 call
- Dashboard: 7 calls (initial fetch)
- Transactions: 0 calls (cache)
- Import CSV: 9 calls (save + single refresh)
- Budgets: 0 calls (cache ou 7 si > 30s)
- Create budgets: 2 calls (2 × save, refresh batched)
- Goals: 0 calls (cache)
- People: 0 calls (cache)
- Dashboard: 0 calls (cache)
- Settings: 0 calls
**Total**: ~12-19 API calls (50-70% de réduction)

**Comment mesurer**:
```javascript
window.__memoryMonitor.startTracking();
// ... effectuer le scénario
window.__memoryMonitor.status();
// Regarder "API Calls: Total tracked"
```

---

### Test 9: Stress Test

**Objectif**: Vérifier que l'app ne crash pas sous charge

**Étapes**:
1. Importer 500+ transactions
2. Créer 20 budgets
3. Créer 10 goals
4. Créer 15 personnes
5. Naviguer rapidement entre toutes les pages (10× chaque)
6. Vérifier :
   ```javascript
   window.__memoryMonitor.checkLeaks()
   window.__dataContext.getData()
   ```

**Résultat attendu**:
- ✅ Aucun crash
- ✅ L'app reste responsive
- ✅ Pas de memory leak détecté
- ✅ Les données sont correctes

---

### Test 10: Error Handling

**Objectif**: Vérifier que les erreurs sont bien gérées

**Étapes**:
1. Simuler une erreur réseau (DevTools → Network → Offline)
2. Essayer de rafraîchir les données
3. Observer les logs
4. Remettre en ligne
5. Vérifier que l'app se récupère

**Résultat attendu**:
- ✅ Log d'erreur clair dans la console
- ✅ `isLoadingRef` est reset (pas bloqué)
- ✅ L'app se récupère quand le réseau revient
- ✅ Pas de crash ou d'état incohérent

---

## ✅ Checklist de Validation Globale

Avant de considérer le fix comme complet, vérifier que :

- [ ] Tous les 10 tests passent
- [ ] Aucun warning de memory leak dans window.__memoryMonitor
- [ ] window.__dataContext.getData() montre les bonnes données
- [ ] Les logs console sont clairs et informatifs
- [ ] Pas d'erreurs dans la console
- [ ] L'app est fluide et responsive
- [ ] Le cache fonctionne (vérifié dans les logs)
- [ ] Les event listeners sont bien nettoyés
- [ ] GlobalEventLock n'accumule pas de callbacks
- [ ] Chrome DevTools Memory ne montre pas de leak

## 🐛 En cas de problème

### Problème: Memory leak détecté
```javascript
window.__memoryMonitor.status()
window.__memoryMonitor.checkLeaks()
```
Regarder quel composant ou event a trop d'instances

### Problème: Trop d'API calls
```javascript
window.__memoryMonitor.status()
```
Regarder "Most Called Endpoints" et "Last 10s"

### Problème: Cache ne fonctionne pas
```javascript
window.__dataContext.getData()
```
Vérifier le "cacheAge" - devrait être < 30000ms pour utiliser le cache

### Problème: GlobalEventLock accumule des callbacks
```javascript
window.__debugGlobalEventLock()
```
Si callbacks > 10, il y a un problème de cleanup

## 📊 Rapports

Après chaque test, noter les résultats dans un tableau :

| Test | Status | API Calls | Memory Leaks | Notes |
|------|--------|-----------|--------------|-------|
| 1. DataContext Init | ✅ | 7 | None | OK |
| 2. Navigation | ✅ | 10 | None | OK |
| 3. Cache | ✅ | 7 | None | OK |
| ... | ... | ... | ... | ... |

## 🎓 Apprentissages

Ce qui cause des memory leaks dans React :
1. ❌ Event listeners non nettoyés
2. ❌ Timers (setTimeout/setInterval) non clear
3. ❌ Callbacks accumulés dans des Singletons
4. ❌ Composants jamais démontés
5. ❌ Refs qui pointent vers des objets volumineux
6. ❌ State qui grandit indéfiniment

Ce qui prévient les memory leaks :
1. ✅ Cleanup dans useEffect return
2. ✅ clearTimeout/clearInterval
3. ✅ Unregister des callbacks
4. ✅ Composants correctement démontés
5. ✅ Cache avec TTL et size limits
6. ✅ Monitoring avec des outils comme Memory Monitor

## 📚 Ressources

- [React Memory Leaks](https://felixgerschau.com/react-memory-leaks-useeffect-hooks/)
- [Chrome DevTools Memory Profiler](https://developer.chrome.com/docs/devtools/memory-problems/)
- [Web Performance](https://web.dev/vitals/)
