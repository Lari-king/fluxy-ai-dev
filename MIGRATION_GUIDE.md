# 🔄 Guide de Migration vers /src

Ce guide vous accompagne étape par étape pour migrer votre projet Flux vers la nouvelle structure avec `/src`.

## 📋 Vue d'ensemble

**Ancienne structure** : Fichiers à la racine (`/App.tsx`, `/components`, etc.)  
**Nouvelle structure** : Tout dans `/src` (structure Vite standard)

## ✅ Étape 1 : Vérifier les fichiers créés

Les fichiers suivants ont été créés automatiquement :

```
✓ /src/main.jsx          - Point d'entrée
✓ /src/App.jsx           - Composant racine avec React Router
✓ /src/router.jsx        - Configuration des routes
✓ /src/constants.js      - Variables globales
✓ /vite.config.js        - Config Vite avec alias
✓ /index.html            - Mis à jour pour pointer vers /src
✓ /package.json          - Mis à jour avec react-router-dom
```

## 🚀 Étape 2 : Migrer automatiquement

### Option A : Script automatique (RECOMMANDÉ)

```bash
# Rendre le script exécutable
chmod +x migrate-to-src.sh

# Lancer la migration
./migrate-to-src.sh
```

### Option B : Migration manuelle

Si le script ne fonctionne pas, copiez manuellement :

```bash
# Créer les dossiers
mkdir -p src/components src/contexts src/utils src/hooks src/types src/styles src/assets

# Copier les fichiers
cp -r components/* src/components/
cp -r contexts/* src/contexts/
cp -r utils/* src/utils/
cp -r hooks/* src/hooks/
cp -r types/* src/types/
cp -r styles/* src/styles/
```

## 🔧 Étape 3 : Mettre à jour les imports

Après la migration, les imports doivent utiliser les nouveaux chemins.

### Anciens imports (à remplacer)
```javascript
import { Button } from './components/ui/button';
import { useAuth } from './contexts/AuthContext';
import { formatCurrency } from './utils/format';
```

### Nouveaux imports (avec alias Vite)
```javascript
import { Button } from '@components/ui/button';
import { useAuth } from '@contexts/AuthContext';
import { formatCurrency } from '@utils/format';
```

**ℹ️ Les alias disponibles** (définis dans `vite.config.js`) :
- `@` → `/src`
- `@components` → `/src/components`
- `@contexts` → `/src/contexts`
- `@utils` → `/src/utils`
- `@hooks` → `/src/hooks`
- `@types` → `/src/types`
- `@styles` → `/src/styles`
- `@assets` → `/src/assets`

## 📦 Étape 4 : Installer les dépendances

```bash
# Nettoyer l'ancien install
rm -rf node_modules package-lock.json .vite

# Installer les nouvelles dépendances (dont react-router-dom)
npm install
```

## 🎯 Étape 5 : Lancer l'application

```bash
npm run dev
```

L'application devrait s'ouvrir sur **http://localhost:3000**

## 🔍 Étape 6 : Vérifier la navigation

Avec React Router, vous avez maintenant de vraies URLs :

- `/` ou `/dashboard` - Dashboard
- `/transactions` - Transactions
- `/budgets` - Budgets
- `/goals` - Objectifs
- `/people` - Personnes
- `/familyoffice` - Family Office
- `/patrimoine` - Patrimoine
- `/simulator` - Simulateur
- `/settings` - Paramètres

## ⚠️ Problèmes courants

### Erreur : "Cannot find module '@components/...'"

**Cause** : Les composants n'ont pas été migrés vers `/src`

**Solution** :
```bash
# Vérifier que les fichiers sont dans /src
ls src/components/ui/
ls src/contexts/

# Si vide, relancer la migration
./migrate-to-src.sh
```

### Erreur : "React Router is not defined"

**Cause** : `react-router-dom` n'est pas installé

**Solution** :
```bash
npm install react-router-dom
```

### Page blanche avec erreur console

**Cause** : Imports incorrects dans les fichiers

**Solution** : Vérifier que tous les imports utilisent les nouveaux chemins avec `@`

### Erreur : "Vite - Optimized dependencies changed"

**Solution** :
```bash
# Nettoyer le cache Vite
rm -rf .vite
npm run dev -- --force
```

## 🧹 Étape 7 : Nettoyer les anciens fichiers (optionnel)

Une fois que tout fonctionne, vous pouvez supprimer les anciens fichiers :

```bash
# ⚠️ ATTENTION : Faites une sauvegarde avant !

# Supprimer les anciens dossiers (maintenant dans /src)
rm -rf components contexts utils hooks types

# Supprimer les anciens fichiers
rm App.tsx main.tsx vite.config.ts
```

**ℹ️ Gardez** :
- `/docs` - Documentation
- `/supabase` - Si vous voulez réactiver Supabase plus tard
- Tous les fichiers dans `/src`

## ✅ Checklist finale

- [ ] Tous les fichiers sont dans `/src`
- [ ] `npm install` terminé sans erreur
- [ ] `npm run dev` lance l'application
- [ ] L'application s'affiche sur localhost:3000
- [ ] La navigation fonctionne (changer de page)
- [ ] Les données persistent (localStorage)
- [ ] Pas d'erreur dans la console

## 🎉 Migration terminée !

Votre projet Flux est maintenant structuré comme un vrai projet Vite + React professionnel :

```
✅ Structure /src standardisée
✅ React Router pour la navigation
✅ Alias Vite pour imports propres
✅ Scripts npm (dev, build, preview)
✅ Configuration optimisée
✅ Code maintenable et scalable
```

## 📚 Prochaines étapes

1. **Développer** : `npm run dev`
2. **Tester** : Vérifier toutes les fonctionnalités
3. **Builder** : `npm run build` (pour production)
4. **Déployer** : Héberger sur Vercel, Netlify, etc.

---

**Besoin d'aide ?** Consultez le [README.md](./README.md) ou l'[INSTALLATION_GUIDE.md](./INSTALLATION_GUIDE.md)
