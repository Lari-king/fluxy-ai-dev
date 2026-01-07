# Guide de monitoring console

## Vue d'ensemble

Le système corrigé émet des logs clairs dans la console pour vous permettre de vérifier son bon fonctionnement et diagnostiquer d'éventuels problèmes.

## Logs normaux (fonctionnement correct)

### Séquence d'import de transactions

```
⏱️ Global refresh scheduled in 500ms
⏱️ Global refresh scheduled in 500ms
⏱️ Global refresh scheduled in 500ms
🔄 Executing global refresh for all modules...
🔄 Dashboard: Début du chargement des données
🔄 Budgets: Début du chargement des données
🔄 People: Début du chargement des données
✅ Imported 15 transactions with 3 new categories
✅ Dashboard: Données chargées avec succès
✅ Budgets: Données chargées avec succès
✅ People: Données chargées avec succès
✅ Global refresh completed successfully
```

**Interprétation** :
- ✅ 3× "scheduled" = Les 3 modules (Dashboard, Budgets, People) ont demandé un refresh
- ✅ 1× "Executing" = Un seul refresh global a été lancé
- ✅ 3× "Début du chargement" = Les 3 modules chargent en parallèle
- ✅ "completed successfully" = Tout s'est bien passé

### Modifications rapides successives

```
⏱️ Global refresh scheduled in 500ms
⏱️ Global refresh scheduled in 500ms    ← Timer reset
⏱️ Global refresh scheduled in 500ms    ← Timer reset again
🔄 Executing global refresh for all modules...
✅ Global refresh completed successfully
```

**Interprétation** :
- ✅ Timer se réinitialise à chaque nouvelle demande
- ✅ Un seul refresh après 500ms d'inactivité
- ✅ Économise des API calls inutiles

### Modification pendant un rechargement

```
🔄 Executing global refresh for all modules...
⏸️ Global refresh already in progress, will refresh again after
✅ Global refresh completed successfully
🔁 Executing pending refresh...
🔄 Executing global refresh for all modules...
✅ Global refresh completed successfully
```

**Interprétation** :
- ✅ Premier refresh en cours
- ✅ Nouvelle demande mise en attente (⏸️)
- ✅ Premier refresh terminé
- ✅ Refresh en attente exécuté (🔁)
- ✅ Maximum 2 cycles, pas de boucle infinie

## Logs problématiques

### ❌ Boucle infinie (ne devrait PLUS se produire)

```
🔄 Executing global refresh for all modules...
⏸️ Global refresh already in progress, will refresh again after
⏸️ Global refresh already in progress, will refresh again after
⏸️ Global refresh already in progress, will refresh again after
⏸️ Global refresh already in progress, will refresh again after
... (répété à l'infini)
```

**Cause possible** :
- Un module déclenche des événements dans son loadData()
- Boucle de dépendances circulaires

**Action** :
- Vérifier qu'aucun module n'émet d'événements pendant loadData()
- Chercher "emitEvent" dans les fonctions de chargement

### ❌ Rechargements bloqués

```
⏱️ Global refresh scheduled in 500ms
⏱️ Global refresh scheduled in 500ms
(rien ne se passe après)
```

**Cause possible** :
- Erreur JavaScript qui empêche l'exécution
- Timer clearé de manière incorrecte

**Action** :
- Vérifier les erreurs JavaScript dans la console
- Rafraîchir la page

### ❌ Erreurs de chargement

```
🔄 Executing global refresh for all modules...
❌ Dashboard: Erreur de chargement: [error details]
Error in refresh callback: [error details]
✅ Global refresh completed successfully
```

**Cause** :
- Erreur réseau
- Erreur serveur
- Token expiré

**Action** :
- Vérifier la connexion réseau
- Vérifier que le serveur est accessible
- Se reconnecter si nécessaire

## Filtrer les logs

### Voir uniquement les événements globaux

Dans la console Chrome/Firefox, utiliser le filtre :

```
⏱️|🔄|✅|⏸️|🔁|❌
```

### Voir uniquement les erreurs

```
❌
```

### Voir le cycle complet d'un rechargement

```
Global refresh
```

## Compteur d'API calls

Pour compter les API calls, utiliser l'onglet Network :

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet **Network**
3. Filtrer par : `make-server-beba2fa3`
4. Faire une action (import, etc.)
5. Compter les requêtes

**Nombres attendus** :

| Action | API calls attendus |
|--------|-------------------|
| Import transactions | 10-15 |
| Ajout manuel | 10-15 |
| Modification budget | 10-15 |
| Navigation simple | 0 |
| Refresh page | 10-15 |

## Mesure des performances

### Temps de rechargement

```javascript
// Coller dans la console pour mesurer
let startTime;
window.addEventListener('customEvent', (e) => {
  if (e.detail === 'refresh-start') {
    startTime = Date.now();
    console.log('⏱️ Refresh started');
  } else if (e.detail === 'refresh-end') {
    const duration = Date.now() - startTime;
    console.log(`⏱️ Refresh completed in ${duration}ms`);
  }
});
```

**Temps attendus** :
- 200-500ms : Excellent
- 500-1000ms : Bon
- 1000-2000ms : Acceptable
- > 2000ms : À investiguer

### Fréquence des rechargements

```javascript
// Compteur de rechargements
let refreshCount = 0;
let lastReset = Date.now();

setInterval(() => {
  if (Date.now() - lastReset > 10000) {
    console.log(`📊 ${refreshCount} refreshes in last 10 seconds`);
    refreshCount = 0;
    lastReset = Date.now();
  }
}, 10000);

// Hook into global lock
const originalRequest = globalEventLock.requestRefresh;
globalEventLock.requestRefresh = function() {
  refreshCount++;
  return originalRequest.apply(this, arguments);
};
```

**Fréquence attendue** :
- 0-2 refreshes / 10s : Normal (utilisation passive)
- 3-5 refreshes / 10s : Normal (utilisation active)
- > 10 refreshes / 10s : Suspect, à investiguer

## Debugging avancé

### Tracer tous les événements

```javascript
// Dans la console
const events = ['TRANSACTIONS_UPDATED', 'BUDGETS_UPDATED', 'PEOPLE_UPDATED', 'CATEGORIES_UPDATED', 'GOALS_UPDATED'];

events.forEach(eventName => {
  window.addEventListener(`app:${eventName.toLowerCase()}`, (e) => {
    console.log(`📢 Event emitted: ${eventName}`, e.detail);
  });
});
```

### Vérifier l'état du GlobalEventLock

```javascript
// Dans la console
console.log('Currently refreshing:', globalEventLock.isCurrentlyRefreshing());

// Monitoring continu
setInterval(() => {
  const status = globalEventLock.isCurrentlyRefreshing() ? '🔴 BUSY' : '🟢 IDLE';
  console.log(`GlobalEventLock status: ${status}`);
}, 2000);
```

### Forcer un refresh manuel

```javascript
// Dans la console
globalEventLock.requestRefresh();
```

### Annuler les refreshes en attente

```javascript
// Dans la console
globalEventLock.cancelPending();
console.log('✅ Pending refreshes cancelled');
```

## Patterns de logs par scénario

### ✅ Import de transactions (CORRECT)

```
Import started
⏱️ Global refresh scheduled in 500ms
⏱️ Global refresh scheduled in 500ms
⏱️ Global refresh scheduled in 500ms
[500ms delay]
🔄 Executing global refresh for all modules...
🔄 Dashboard: Début du chargement des données
🔄 Budgets: Début du chargement des données
🔄 People: Début du chargement des données
[API calls in progress]
✅ Dashboard: Données chargées avec succès
✅ Budgets: Données chargées avec succès
✅ People: Données chargées avec succès
✅ Global refresh completed successfully
[Total time: ~500-800ms]
```

### ✅ Navigation entre pages (CORRECT)

```
[Aucun log si les données sont déjà chargées]
[OU un seul cycle si refresh nécessaire]
🔄 Dashboard: Début du chargement des données
✅ Dashboard: Données chargées avec succès
```

### ✅ Ajout rapide de plusieurs transactions (CORRECT)

```
Transaction added
⏱️ Global refresh scheduled in 500ms
Transaction added
⏱️ Global refresh scheduled in 500ms
Transaction added
⏱️ Global refresh scheduled in 500ms
[500ms delay after last action]
🔄 Executing global refresh for all modules...
✅ Global refresh completed successfully
```

## Alertes automatiques

Vous pouvez configurer des alertes en cas de comportement anormal :

```javascript
// Dans la console
let refreshWarningCount = 0;
const warningThreshold = 5;

const originalLog = console.log;
console.log = function(...args) {
  const message = args.join(' ');
  
  // Détecter trop de refreshes en attente
  if (message.includes('⏸️')) {
    refreshWarningCount++;
    if (refreshWarningCount > warningThreshold) {
      alert('⚠️ WARNING: Too many pending refreshes detected! Possible infinite loop.');
      refreshWarningCount = 0;
    }
  }
  
  // Reset counter si refresh complété
  if (message.includes('✅ Global refresh completed')) {
    refreshWarningCount = 0;
  }
  
  return originalLog.apply(console, args);
};
```

## Checklist de santé du système

Après l'import de transactions, vérifier :

- [ ] Exactement 3× "⏱️ Global refresh scheduled"
- [ ] Exactement 1× "🔄 Executing global refresh"
- [ ] Exactement 3× "🔄 [Module]: Début du chargement"
- [ ] Exactement 3× "✅ [Module]: Données chargées"
- [ ] Exactement 1× "✅ Global refresh completed"
- [ ] Aucun "⏸️" en boucle
- [ ] Aucun "❌" d'erreur
- [ ] Temps total < 1 seconde

## Conclusion

Avec ce système de logging, vous avez une visibilité complète sur le comportement de l'application. En cas de problème, les logs vous permettront de diagnostiquer rapidement la cause et d'appliquer la correction appropriée.

**Log normal = Système sain** ✅
**Patterns répétés = Problème à investiguer** ⚠️
