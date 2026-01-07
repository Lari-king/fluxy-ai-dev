# 🚀 Quick Start - Debugging Memory Issues

## 🎯 Pour Commencer

Ouvrez la console du navigateur (F12) et vous verrez :

```
🎨 Flux - Application Financière
🔧 Debugging Tools Available:
  • window.__dataContext        - Inspect and control app data
  • window.__memoryMonitor      - Track memory leaks
  • window.__debugGlobalEventLock - [DEPRECATED] Event lock state
📚 Documentation: /docs/
```

## ⚡ Commandes Rapides

### 1. Vérifier l'État de l'Application

```javascript
// Voir les stats des données
window.__dataContext.getData()

// Résultat attendu:
{
  transactions: 42,      // Nombre de transactions
  budgets: 5,           // Nombre de budgets
  goals: 3,             // Nombre d'objectifs
  people: 8,            // Nombre de personnes
  accounts: 2,          // Nombre de comptes
  categories: 15,       // Nombre de catégories
  rules: 10,            // Nombre de règles
  loading: false,       // État de chargement
  cacheAge: 5432        // Âge du cache en ms (ou "never")
}
```

### 2. Détecter les Memory Leaks

```javascript
// Démarrer le tracking
window.__memoryMonitor.startTracking()

// Utiliser l'app normalement pendant 1-2 minutes...

// Vérifier les leaks
window.__memoryMonitor.checkLeaks()

// Résultat attendu:
{ hasLeaks: false, issues: [] }

// Si des leaks sont détectés:
{ 
  hasLeaks: true, 
  issues: [
    'Component "Dashboard" has 5 instances - possible leak',
    'Event "app:transactions:updated" has 12 listeners - possible leak'
  ]
}
```

### 3. Voir les Statistiques Détaillées

```javascript
window.__memoryMonitor.status()

// Affiche:
📊 MEMORY MONITOR STATUS
========================

🏗️ Component Mounts:
  ✅ OK AppContent: 1
  ✅ OK Dashboard: 1
  
🎧 Event Listeners:
  ✅ OK app:transactions:updated: 5
  
🌐 API Calls:
  Total tracked: 25
  Last 10s: 2
```

### 4. Forcer un Refresh des Données

```javascript
// Refresh avec cache (si < 30s)
window.__dataContext.refreshData()

// Refresh sans cache (force le rechargement)
window.__dataContext.refreshData(true)
```

### 5. Voir Toutes les Données

```javascript
// ⚠️ Attention: peut afficher beaucoup de données
const data = window.__dataContext.getFullData()
console.log(data.transactions)  // Toutes les transactions
console.log(data.budgets)       // Tous les budgets
// etc.
```

## 🔍 Scénarios de Debugging

### Scénario 1: L'app est lente après quelques minutes

```javascript
// 1. Vérifier les memory leaks
window.__memoryMonitor.checkLeaks()

// 2. Si des leaks sont détectés, voir les détails
window.__memoryMonitor.status()

// 3. Regarder quel composant ou event a trop d'instances
// 4. Vérifier le cleanup dans le useEffect de ce composant
```

### Scénario 2: Trop d'appels API

```javascript
// 1. Démarrer le tracking
window.__memoryMonitor.startTracking()

// 2. Utiliser l'app...

// 3. Vérifier les stats
window.__memoryMonitor.status()
// Regarder "🌐 API Calls" et "📈 Most Called Endpoints"

// 4. Vérifier que le cache fonctionne
window.__dataContext.getData()
// Si cacheAge est toujours "never", le cache ne fonctionne pas
```

### Scénario 3: Les données ne se synchronisent pas

```javascript
// 1. Vérifier l'état du cache
window.__dataContext.getData()

// 2. Forcer un refresh
window.__dataContext.refreshData(true)

// 3. Vérifier les logs console pour voir les événements émis
// Chercher: 📢 DataContext: Received data update event

// 4. Si toujours pas synchronisé, vérifier que les composants
//    utilisent useData() et pas leur propre state local
```

### Scénario 4: Composants qui ne se démontent pas

```javascript
// 1. Démarrer le tracking
window.__memoryMonitor.startTracking()

// 2. Naviguer: Dashboard → Transactions → Dashboard

// 3. Vérifier les mounts
window.__memoryMonitor.status()

// Résultat attendu:
🏗️ Component Mounts:
  ✅ OK Dashboard: 1        // Un seul Dashboard actif
  ❌ UNMOUNTED Transactions: 0  // Transactions démonté

// Si Transactions: 1, le composant n'a pas été démonté (leak!)
```

### Scénario 5: Event listeners qui s'accumulent

```javascript
// 1. Démarrer le tracking
window.__memoryMonitor.startTracking()

// 2. Naviguer plusieurs fois entre les pages

// 3. Vérifier les listeners
window.__memoryMonitor.status()

// Résultat attendu:
🎧 Event Listeners:
  ✅ OK app:transactions:updated: 5  // < 10 = OK
  
// Si > 10, il y a un problème de cleanup
```

## 🧪 Tests Rapides (5 minutes)

### Test 1: Tout Fonctionne ?

```javascript
// 1. Données chargées ?
window.__dataContext.getData()
// ✅ loading: false, tous les counts > 0

// 2. Memory leaks ?
window.__memoryMonitor.startTracking()
// Naviguer 5× entre toutes les pages
window.__memoryMonitor.checkLeaks()
// ✅ hasLeaks: false

// 3. Cache fonctionne ?
// Aller sur Dashboard, puis Transactions, puis Dashboard
window.__dataContext.getData()
// ✅ cacheAge < 30000 (si retour < 30s)
```

### Test 2: Performance Normale ?

```javascript
// 1. Tracking
window.__memoryMonitor.startTracking()

// 2. Utiliser l'app pendant 2 minutes

// 3. Vérifier
window.__memoryMonitor.status()

// Résultats attendus:
// • API Calls Last 10s: < 10
// • Component Mounts: tous à 0 ou 1
// • Event Listeners: tous < 10
```

## 📊 Interprétation des Résultats

### Component Mounts

```
✅ OK ComponentName: 1      // Normal: 1 instance active
❌ UNMOUNTED ComponentName: 0  // Normal: composant démonté
⚠️ MULTIPLE ComponentName: 3   // PROBLÈME: 3 instances (leak!)
```

### Event Listeners

```
✅ OK event-name: 5         // Normal: < 10 listeners
⚠️ HIGH event-name: 15      // ATTENTION: beaucoup de listeners
```

### API Calls

```
Total tracked: 25           // Total d'appels depuis le tracking
Last 10s: 2                 // Normal: < 10
Last 10s: 25                // PROBLÈME: trop d'appels!
```

### Cache Age

```
cacheAge: 5000              // 5 secondes, cache valide
cacheAge: 35000             // 35 secondes, cache expiré
cacheAge: "never"           // Jamais chargé ou problème
```

## 🚨 Signaux d'Alerte

### 🔴 CRITIQUE - Agir Immédiatement

```javascript
// 1. Memory leak détecté
window.__memoryMonitor.checkLeaks()
// { hasLeaks: true, issues: [...] }

// 2. Trop d'API calls
window.__memoryMonitor.status()
// Last 10s: 50+

// 3. Composants multiples
// Component "Dashboard": 5 instances
```

### 🟡 ATTENTION - Surveiller

```javascript
// 1. Cache jamais utilisé
window.__dataContext.getData()
// cacheAge: "never" (après plusieurs navigations)

// 2. Beaucoup d'event listeners
// Event Listeners: 8-10 par événement

// 3. API calls fréquents
// Last 10s: 10-15
```

### 🟢 OK - Tout va bien

```javascript
// 1. Pas de leaks
window.__memoryMonitor.checkLeaks()
// { hasLeaks: false, issues: [] }

// 2. Cache fonctionne
// cacheAge: 5000-25000

// 3. API calls raisonnables
// Last 10s: < 5
```

## 🛠️ Actions Correctives

### Si Memory Leak Détecté

```javascript
// 1. Identifier le problème
window.__memoryMonitor.status()

// 2. Si c'est un composant:
// → Vérifier le useEffect cleanup dans ce composant
// → S'assurer qu'il appelle memoryMonitor.trackUnmount()

// 3. Si c'est un event listener:
// → Vérifier que le listener est bien removed dans le cleanup
// → Chercher addEventListener sans removeEventListener
```

### Si Trop d'API Calls

```javascript
// 1. Vérifier le cache
window.__dataContext.getData()

// 2. Vérifier les événements émis
// Dans le code, chercher emitEvent() et s'assurer 
// qu'il n'y a pas de boucles infinies

// 3. Vérifier GlobalEventLock
window.__debugGlobalEventLock()
// Si callbacks > 5, il y a un problème
```

### Si Cache Ne Fonctionne Pas

```javascript
// 1. Vérifier que les pages utilisent useData()
// Et pas transactionsAPI.getAll() directement

// 2. Vérifier les logs console
// Chercher: "Using cached data"

// 3. Si jamais affiché, il y a un problème dans DataContext
```

## 💡 Tips & Tricks

### Tip 1: Logs Console Colorés

Les logs utilisent des emojis pour faciliter le debugging :
- 🔄 = Chargement en cours
- ✅ = Succès
- ❌ = Erreur
- ⏸️ = Action ignorée
- 🧹 = Nettoyage
- 📢 = Événement reçu
- 🌐 = Appel API

### Tip 2: Filtrer les Logs

Dans la console Chrome :
- Filtre par emoji : `🔄` pour voir tous les chargements
- Filtre par module : `DataContext` pour voir tous les logs DataContext

### Tip 3: Performance Tab

Utilisez Chrome DevTools → Performance :
1. Cliquer sur Record
2. Utiliser l'app
3. Stop
4. Analyser le flamegraph pour voir où le temps est passé

### Tip 4: Memory Tab

Utilisez Chrome DevTools → Memory :
1. Heap snapshot avant
2. Utiliser l'app
3. Heap snapshot après
4. Comparer pour voir ce qui a augmenté

### Tip 5: Reset Everything

Pour repartir à zéro :
```javascript
window.__memoryMonitor.reset()
window.location.reload()
```

## 📚 Documentation Complète

Pour plus de détails, voir :
- `/docs/MEMORY_FIX_SUMMARY.md` - Vue d'ensemble
- `/docs/TESTING_MEMORY_FIX.md` - Tests complets
- `/docs/DATACONTEXT_MIGRATION_EXAMPLE.md` - Guide de migration

## ❓ Questions Fréquentes

**Q: Quand utiliser window.__memoryMonitor ?**
R: Dès que vous soupçonnez un memory leak ou des performances dégradées

**Q: C'est normal d'avoir plusieurs instances d'un composant ?**
R: Non, sauf si vous affichez vraiment plusieurs instances (ex: liste de cartes). 
   Sinon c'est un leak.

**Q: Le cache empêche de voir les nouvelles données ?**
R: Non, les update functions (`updateTransactions`, etc.) invalidant le cache automatiquement

**Q: Combien d'API calls est normal ?**
R: < 10 par minute en utilisation normale. < 20 après un import ou une grosse modification.

**Q: Comment savoir si GlobalEventLock pose problème ?**
R: `window.__debugGlobalEventLock()` - si callbacks > 5, il y a un souci

---

**Dernière mise à jour**: 2025-11-28  
**Version**: 1.0
