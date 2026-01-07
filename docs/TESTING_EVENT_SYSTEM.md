# Guide de test du système d'événements corrigé

## Tests à effectuer

### 1. Test d'import de transactions

**Objectif** : Vérifier qu'un seul cycle de rechargement se produit lors de l'import

**Étapes** :
1. Ouvrir la console du navigateur
2. Aller sur la page Transactions
3. Importer un fichier CSV avec plusieurs transactions
4. Observer les logs dans la console

**Résultat attendu** :
```
⏱️ Global refresh scheduled in 500ms
🔄 Executing global refresh for all modules...
🔄 Dashboard: Début du chargement des données
🔄 Budgets: Début du chargement des données
🔄 People: Début du chargement des données
✅ Dashboard: Données chargées avec succès
✅ Budgets: Données chargées avec succès
✅ People: Données chargées avec succès
✅ Global refresh completed successfully
```

**Résultat à éviter** :
- Rechargements multiples répétés
- Messages "⏸️ already in progress" en boucle infinie
- Freeze de l'interface
- Erreur "out of memory"

### 2. Test de modifications rapides

**Objectif** : Vérifier le debounce global

**Étapes** :
1. Ajouter rapidement plusieurs transactions manuellement (une après l'autre)
2. Observer les logs

**Résultat attendu** :
- Les timers se réinitialisent : "⏱️ Global refresh scheduled in 500ms" multiple fois
- Un seul "🔄 Executing global refresh" après avoir arrêté d'ajouter
- Pas de rechargements multiples pendant la saisie

### 3. Test de navigation entre pages

**Objectif** : S'assurer que les données restent synchronisées

**Étapes** :
1. Créer une transaction sur la page Transactions
2. Naviguer vers le Dashboard
3. Vérifier que la transaction apparaît
4. Naviguer vers Budgets
5. Vérifier que les budgets sont mis à jour

**Résultat attendu** :
- Toutes les pages affichent les données à jour
- Pas de rechargements excessifs lors du changement de page

### 4. Test de charge (stress test)

**Objectif** : Vérifier la stabilité sous charge

**Étapes** :
1. Importer un gros fichier CSV (100+ transactions)
2. Pendant l'import, cliquer rapidement sur plusieurs onglets
3. Observer la mémoire dans le gestionnaire de tâches

**Résultat attendu** :
- L'import se termine sans erreur
- La mémoire reste stable (pas de fuite)
- Pas d'erreur "out of memory"
- Interface reste réactive

### 5. Test de verrou pendant rechargement

**Objectif** : Vérifier que le verrou fonctionne correctement

**Étapes** :
1. Importer des transactions
2. Immédiatement après, créer un budget
3. Observer les logs

**Résultat attendu** :
```
🔄 Executing global refresh for all modules...
⏸️ Global refresh already in progress, will refresh again after
✅ Global refresh completed successfully
🔁 Executing pending refresh...
🔄 Executing global refresh for all modules...
✅ Global refresh completed successfully
```

## Monitoring des performances

### Console logs à surveiller

**Logs normaux** :
- ⏱️ = Refresh programmé (normal)
- 🔄 = Exécution en cours (normal)
- ✅ = Succès (normal)

**Logs d'attention** :
- ⏸️ = Verrou actif, refresh en attente (normal si occasionnel)
- 🔁 = Refresh en attente exécuté (normal si occasionnel)

**Logs problématiques** :
- ❌ = Erreur (à investiguer)
- Répétition rapide de ⏸️ (possible boucle)
- Absence de ✅ après 🔄 (timeout ou crash)

### Outils de développement

**Chrome DevTools - Performance** :
1. Ouvrir l'onglet Performance
2. Enregistrer pendant l'import de transactions
3. Vérifier :
   - Pas de long tasks > 50ms répétés
   - Pas de memory leaks
   - Network waterfall raisonnable (max 10-15 requêtes simultanées)

**Chrome DevTools - Network** :
1. Ouvrir l'onglet Network
2. Importer des transactions
3. Vérifier :
   - Nombre de requêtes à `/make-server-beba2fa3/*`
   - Doit voir maximum 10-15 requêtes groupées
   - Pas de cascade infinie de requêtes

**Chrome DevTools - Memory** :
1. Faire un heap snapshot avant l'import
2. Importer des transactions
3. Faire un nouveau heap snapshot
4. Vérifier :
   - Pas de croissance excessive de la heap
   - Pas d'objets qui ne sont pas garbage collectés

## Scénarios de régression

### Avant la correction (comportement à ne plus voir)

```
Import 10 transactions
→ 2 événements émis
→ Dashboard recharge × 2 = 10 API calls
→ Budgets recharge × 1 = 4 API calls
→ People recharge × 1 = 1 API call
= 15 API calls

Si modification rapide pendant le rechargement :
→ Nouveau cycle
→ 15 API calls supplémentaires
→ 30 API calls total

Si plusieurs modifications rapides :
→ 45, 60, 75... API calls
→ Out of memory
```

### Après la correction (comportement actuel)

```
Import 10 transactions
→ 1 événement émis
→ Global refresh déclenché
→ Timer de 500ms
→ Après 500ms, UN SEUL refresh global :
  - Dashboard : 5 API calls
  - Budgets : 4 API calls
  - People : 1 API call
= 10 API calls maximum

Si modification rapide pendant le timer :
→ Timer réinitialisé
→ Pas de nouveau rechargement
→ Toujours 10 API calls maximum

Si modification pendant le rechargement :
→ Marqué comme "pending"
→ Un SEUL nouveau refresh après la fin du premier
→ Maximum 20 API calls (2 cycles, pas de boucle infinie)
```

## Métriques de succès

✅ **Pas d'erreur "out of memory"**
✅ **Maximum 10-15 API calls par cycle de rechargement**
✅ **Maximum 2-3 cycles consécutifs même avec modifications rapides**
✅ **Interface reste réactive pendant les rechargements**
✅ **Mémoire stable (pas de fuite)**
✅ **Données synchronisées entre toutes les pages**

## En cas de problème

Si vous observez encore des problèmes :

1. **Vérifier les imports** : Tous les modules utilisent bien `globalEventLock`
2. **Vérifier les événements** : Pas d'émission multiple du même événement
3. **Console logs** : Chercher des patterns de répétition infinie
4. **Network tab** : Compter le nombre de requêtes
5. **Augmenter le debounce** : Dans `global-event-lock.ts`, augmenter `DEBOUNCE_MS` à 1000ms

## Contact

En cas de problème persistant, fournir :
- Screenshots des console logs
- Screenshot du Network tab
- Description précise des étapes qui causent le problème
- Version du navigateur
