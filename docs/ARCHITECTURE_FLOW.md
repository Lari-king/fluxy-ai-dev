# Architecture du système d'événements corrigé

## Vue d'ensemble

Le système utilise maintenant un gestionnaire centralisé (`GlobalEventLock`) pour coordonner tous les rechargements de données entre modules.

## Diagramme de flux

### ❌ AVANT (Architecture problématique)

```
┌─────────────────┐
│  USER ACTION    │
│ Import CSV      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Transactions.tsx       │
│  - Save data            │
│  - Emit 2 events:       │
│    • TRANSACTIONS_UPDATED│
│    • CATEGORIES_UPDATED │
└────────┬────────────────┘
         │
         ▼
    ┌────┴────┐
    │ Events  │
    └────┬────┘
         │
    ┌────┴─────────────────────────┐
    │                              │
    ▼                              ▼
┌─────────────┐              ┌──────────────┐
│ Dashboard   │              │ Budgets      │
│ (debounce   │              │ (debounce    │
│  300ms)     │              │  300ms)      │
└─────┬───────┘              └──────┬───────┘
      │                             │
      ▼ (2x)                        ▼ (1x)
  ┌───────────┐                ┌───────────┐
  │ Load 5    │                │ Load 4    │
  │ API calls │                │ API calls │
  └───────────┘                └───────────┘
      │                             │
      └──────────┬──────────────────┘
                 │
                 ▼
         = 15-30 API calls
         ❌ Risk of infinite loop
         ❌ Out of memory
```

### ✅ APRÈS (Architecture corrigée)

```
┌─────────────────┐
│  USER ACTION    │
│ Import CSV      │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  Transactions.tsx        │
│  - Save data             │
│  - Emit 1 event:         │
│    • TRANSACTIONS_UPDATED│
└────────┬─────────────────┘
         │
         ▼
    ┌────┴────┐
    │ Events  │
    └────┬────┘
         │
    ┌────┴────────────────────────────┐
    │                                 │
    ▼                                 ▼
┌──────────────┐              ┌──────────────┐
│ Dashboard    │              │ Budgets      │
│              │              │              │
└──────┬───────┘              └──────┬───────┘
       │                             │
       │   ┌──────────────┐          │
       ├───┤ People       │──────────┤
       │   └──────────────┘          │
       │                             │
       ▼                             ▼
   All call: globalEventLock.requestRefresh()
       │                             │
       └─────────────┬───────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  GlobalEventLock      │
         │  - Debounce 500ms     │
         │  - Merge all requests │
         │  - Lock execution     │
         └──────────┬────────────┘
                    │
                    ▼ (500ms later)
         ┌──────────────────────┐
         │  Execute once:       │
         │  ├─ Dashboard.load() │
         │  ├─ Budgets.load()   │
         │  └─ People.load()    │
         └──────────┬───────────┘
                    │
                    ▼
            = 10 API calls
            ✅ One cycle only
            ✅ No memory issues
```

## Composants du système

### 1. GlobalEventLock (Singleton)

**Fichier** : `/utils/global-event-lock.ts`

**Responsabilités** :
- Recevoir les demandes de refresh de tous les modules
- Fusionner les demandes multiples avec debounce
- Empêcher les exécutions simultanées avec un verrou
- Gérer une file d'attente pour les demandes pendantes
- Logger l'état du système

**État interne** :
```typescript
{
  isRefreshing: boolean,        // Verrou d'exécution
  pendingRefresh: boolean,      // File d'attente
  refreshTimer: Timeout | null, // Timer de debounce
  refreshCallbacks: Set<fn>,    // Callbacks enregistrés
  DEBOUNCE_MS: 500              // Délai de debounce
}
```

### 2. Modules intégrés

#### Dashboard
- **Écoute** : 5 événements (TRANSACTIONS, BUDGETS, PEOPLE, CATEGORIES, GOALS)
- **Action** : Appelle `globalEventLock.requestRefresh()`
- **Enregistrement** : `globalEventLock.registerRefresh(loadData)`
- **Charge** : 5 API calls (transactions, budgets, goals, people, accounts)

#### Budgets
- **Écoute** : 1 événement (TRANSACTIONS)
- **Action** : Appelle `globalEventLock.requestRefresh()`
- **Enregistrement** : `globalEventLock.registerRefresh(loadData)`
- **Charge** : 4 API calls (budgets, transactions, categories, people)

#### People
- **Écoute** : 1 événement (TRANSACTIONS)
- **Action** : Appelle `globalEventLock.requestRefresh()`
- **Enregistrement** : `globalEventLock.registerRefresh(loadPeople)`
- **Charge** : 1 API call (people with impact)

### 3. Émetteurs d'événements

#### Transactions
- **Émet** : TRANSACTIONS_UPDATED (réduit de 2 à 1 événement)
- **Quand** : Import CSV, ajout manuel, modification, suppression

#### Budgets
- **Émet** : BUDGETS_UPDATED
- **Quand** : Création, modification, suppression

#### People
- **Émet** : PEOPLE_UPDATED
- **Quand** : Création, modification, suppression

#### Goals
- **Émet** : GOALS_UPDATED
- **Quand** : Création, modification, suppression

## Séquence temporelle détaillée

### Scénario : Import de 100 transactions

```
T+0ms     │ User clicks "Import"
          │
T+10ms    │ Transactions.tsx saves data
          │ └─ emitEvent(TRANSACTIONS_UPDATED)
          │
T+12ms    │ Dashboard receives event
          │ └─ globalEventLock.requestRefresh()
          │    └─ Timer starts: 500ms
          │    └─ Log: "⏱️ scheduled in 500ms"
          │
T+14ms    │ Budgets receives event
          │ └─ globalEventLock.requestRefresh()
          │    └─ Timer resets: 500ms
          │    └─ Log: "⏱️ scheduled in 500ms"
          │
T+16ms    │ People receives event
          │ └─ globalEventLock.requestRefresh()
          │    └─ Timer resets: 500ms
          │    └─ Log: "⏱️ scheduled in 500ms"
          │
T+516ms   │ Timer expires
          │ └─ globalEventLock.executeRefresh()
          │    ├─ isRefreshing = true
          │    ├─ Log: "🔄 Executing global refresh..."
          │    ├─ Dashboard.loadData()  ┐
          │    ├─ Budgets.loadData()    │ Parallel
          │    └─ People.loadPeople()   ┘
          │
T+800ms   │ All API calls complete
          │ └─ isRefreshing = false
          │ └─ Log: "✅ completed successfully"
          │
END       │ Total: 10 API calls, 1 refresh cycle
```

### Scénario : Modifications rapides multiples

```
T+0ms     │ User adds transaction #1
          │ └─ emitEvent(TRANSACTIONS_UPDATED)
          │    └─ Timer starts: 500ms
          │
T+100ms   │ User adds transaction #2 (fast!)
          │ └─ emitEvent(TRANSACTIONS_UPDATED)
          │    └─ Timer resets: 500ms (new deadline)
          │
T+200ms   │ User adds transaction #3 (fast!)
          │ └─ emitEvent(TRANSACTIONS_UPDATED)
          │    └─ Timer resets: 500ms (new deadline)
          │
T+700ms   │ Timer expires (500ms after last action)
          │ └─ ONE refresh for all 3 transactions
          │
END       │ Total: 10 API calls, 1 refresh cycle
          │ (instead of 30 API calls with old system)
```

### Scénario : Modification pendant rechargement

```
T+0ms     │ Import transactions
          │ └─ Timer starts: 500ms
          │
T+500ms   │ Timer expires
          │ └─ isRefreshing = true
          │ └─ Loading data...
          │
T+600ms   │ User adds new transaction (during load!)
          │ └─ globalEventLock.requestRefresh()
          │    └─ isRefreshing = true
          │    └─ pendingRefresh = true
          │    └─ Log: "⏸️ already in progress, will refresh again"
          │
T+800ms   │ First refresh completes
          │ └─ isRefreshing = false
          │ └─ pendingRefresh = true → trigger new refresh
          │ └─ Log: "🔁 Executing pending refresh..."
          │
T+1100ms  │ Second refresh completes
          │ └─ isRefreshing = false
          │ └─ pendingRefresh = false
          │
END       │ Total: 20 API calls, 2 refresh cycles
          │ (limited, no infinite loop)
```

## Avantages de l'architecture

### 1. Performance
- ✅ Réduction de 50-67% des API calls
- ✅ Fusion automatique des événements proches
- ✅ Pas de cascades infinies

### 2. Stabilité
- ✅ Verrou empêche les exécutions simultanées
- ✅ File d'attente limite à maximum 2 cycles
- ✅ Plus d'erreur "out of memory"

### 3. Maintenabilité
- ✅ Code centralisé dans un seul module
- ✅ Logging clair pour debugging
- ✅ Facile d'ajouter de nouveaux modules

### 4. Évolutivité
- ✅ Débounce configurable (DEBOUNCE_MS)
- ✅ Méthodes publiques pour contrôle manuel
- ✅ Architecture extensible

## Configuration

### Ajuster le debounce

Dans `/utils/global-event-lock.ts` :

```typescript
private readonly DEBOUNCE_MS = 500; // Modifier cette valeur
```

**Recommandations** :
- `300ms` : Réactivité maximale, OK si réseau rapide
- `500ms` : Équilibre optimal (défaut)
- `1000ms` : Meilleure stabilité si modifications très rapides
- `2000ms` : Pour connexions lentes ou gros volumes de données

### Monitoring avancé

Activer les logs détaillés en ajoutant dans la console :

```javascript
// Voir tous les événements
window.addEventListener('app:*', (e) => console.log('Event:', e.type));

// Monitorer le GlobalEventLock
setInterval(() => {
  console.log('Currently refreshing:', globalEventLock.isCurrentlyRefreshing());
}, 1000);
```

## Dépannage

### Symptôme : Rechargements trop fréquents
**Solution** : Augmenter `DEBOUNCE_MS` à 1000ms

### Symptôme : Données pas à jour
**Solution** : Vérifier que tous les modules enregistrent leur callback
```typescript
globalEventLock.registerRefresh(loadData)
```

### Symptôme : Logs "⏸️" répétés
**Solution** : Normal si modifications très rapides. Si constant → vérifier qu'un module ne déclenche pas d'événements dans son loadData()

### Symptôme : Pas de rechargement
**Solution** : Vérifier que les modules appellent bien
```typescript
globalEventLock.requestRefresh()
```

## Exemple d'ajout d'un nouveau module

Si vous créez un nouveau module qui doit réagir aux événements :

```typescript
import { globalEventLock } from '../../utils/global-event-lock';
import { AppEvents, onEvent } from '../../utils/events';

export function MyNewModule() {
  useEffect(() => {
    if (!accessToken) return;

    // 1. Handler qui appelle le global lock
    const handleGlobalRefresh = () => {
      globalEventLock.requestRefresh();
    };

    // 2. Écouter les événements pertinents
    const unsubscribe = onEvent(AppEvents.TRANSACTIONS_UPDATED, handleGlobalRefresh);
    
    // 3. Enregistrer le callback de chargement
    const unregister = globalEventLock.registerRefresh(loadMyData);

    // 4. Cleanup
    return () => {
      unsubscribe();
      unregister();
    };
  }, [accessToken]);

  const loadMyData = async () => {
    // Votre logique de chargement
  };
}
```

## Conclusion

Ce système assure que même avec de nombreux modules interconnectés et de multiples événements, l'application reste performante et stable, sans risque de cascades infinies ou d'erreurs mémoire.
