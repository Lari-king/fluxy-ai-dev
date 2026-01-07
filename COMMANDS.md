# 📋 Guide des Commandes - Flux

## 🚀 Installation & Démarrage

### Première installation
```bash
# Installer les dépendances
npm install

# Lancer l'application
npm run dev
```

### Migration depuis ancienne structure
```bash
# Option 1 : Script Node.js (multiplateforme)
node migrate.js

# Option 2 : Script Bash (Mac/Linux)
chmod +x migrate-to-src.sh
./migrate-to-src.sh

# Option 3 : Script PowerShell (Windows)
.\migrate.ps1

# Puis installer et lancer
npm install
npm run dev
```

---

## 📦 Gestion des dépendances

### Installer toutes les dépendances
```bash
npm install
```

### Ajouter une nouvelle dépendance
```bash
# Dépendance de production
npm install nom-du-package

# Dépendance de développement
npm install --save-dev nom-du-package
```

### Mettre à jour les dépendances
```bash
# Vérifier les packages obsolètes
npm outdated

# Mettre à jour un package spécifique
npm update nom-du-package

# Mettre à jour tous les packages
npm update
```

### Nettoyer et réinstaller
```bash
# Supprimer node_modules et package-lock.json
rm -rf node_modules package-lock.json

# Réinstaller
npm install
```

---

## 🛠️ Développement

### Lancer le serveur de développement
```bash
npm run dev
```
➡️ Ouvre l'application sur http://localhost:3000

### Lancer avec nettoyage du cache
```bash
npm run dev -- --force
```

### Build pour production
```bash
npm run build
```
➡️ Crée le dossier `/dist` avec les fichiers optimisés

### Prévisualiser le build de production
```bash
npm run preview
```

---

## 🔍 Débogage

### Vérifier la configuration Vite
```bash
npx vite --version
```

### Nettoyer le cache Vite
```bash
rm -rf .vite
npm run dev
```

### Analyser le bundle (taille des fichiers)
```bash
npm run build
```

---

## 🧹 Nettoyage

### Nettoyer tous les fichiers générés
```bash
# Supprimer node_modules, cache, et builds
rm -rf node_modules package-lock.json .vite dist

# Puis réinstaller
npm install
```

### Nettoyer seulement le cache
```bash
rm -rf .vite
```

---

## 📁 Navigation dans le projet

### Ouvrir VS Code
```bash
# Ouvrir le projet dans VS Code
code .
```

### Lister les fichiers sources
```bash
# Voir tous les composants
ls src/components/

# Voir les pages
ls src/components/pages/

# Voir les contexts
ls src/contexts/
```

---

## 🔄 Git (Contrôle de version)

### Initialiser un repo
```bash
git init
```

### Commit initial
```bash
git add .
git commit -m "Initial commit - Flux app v1.0"
```

### Créer une branche
```bash
git checkout -b nouvelle-fonctionnalite
```

### Voir les modifications
```bash
git status
git diff
```

---

## 📊 Vérifications & Tests

### Vérifier les imports manquants
```bash
npm run dev
# Vérifier la console pour les erreurs d'imports
```

### Vérifier la structure
```bash
# Lister la structure /src
tree src -L 2

# Ou avec ls
ls -R src/
```

### Tester le build de production
```bash
npm run build
npm run preview
```

---

## 🐛 Résolution de problèmes courants

### Erreur : "Cannot find module"
```bash
# Vérifier que le fichier existe
ls src/components/...

# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Erreur : "Port 3000 already in use"
```bash
# Option 1 : Tuer le processus sur le port 3000
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID [PID] /F

# Option 2 : Changer le port dans vite.config.js
```

### Page blanche / Erreur React
```bash
# Nettoyer complètement
rm -rf node_modules package-lock.json .vite dist
npm install
npm run dev -- --force
```

### Erreur localStorage
```bash
# Ouvrir la console du navigateur (F12)
# Aller dans Application > Local Storage
# Supprimer toutes les entrées "flux_*"
```

---

## 💡 Commandes utiles

### Créer un nouveau composant
```bash
# Créer le fichier
touch src/components/MonComposant.jsx

# Ou créer avec contenu de base
cat > src/components/MonComposant.jsx << 'EOF'
import React from 'react';

export function MonComposant() {
  return (
    <div>Mon Composant</div>
  );
}
EOF
```

### Créer une nouvelle page
```bash
touch src/components/pages/NouvellePage.jsx
```

### Rechercher dans le code
```bash
# Chercher un terme dans tous les fichiers
grep -r "terme" src/

# Chercher uniquement dans les fichiers .jsx
grep -r "terme" src/ --include="*.jsx"
```

---

## 📚 Commandes de documentation

### Générer la liste des dépendances
```bash
npm list --depth=0
```

### Voir les scripts disponibles
```bash
npm run
```

### Afficher les infos du projet
```bash
npm info
```

---

## 🎯 Workflow recommandé

### Développement quotidien
```bash
# 1. Ouvrir VS Code
code .

# 2. Lancer le serveur
npm run dev

# 3. Développer (les changements sont automatiques)

# 4. Tester régulièrement dans le navigateur
```

### Avant de déployer
```bash
# 1. Tester le build
npm run build

# 2. Prévisualiser
npm run preview

# 3. Vérifier que tout fonctionne

# 4. Commit
git add .
git commit -m "Description des changements"
```

---

## ⚡ Raccourcis Terminal

### Mac/Linux
- `Ctrl + C` - Arrêter le serveur
- `Ctrl + L` - Nettoyer le terminal
- `↑` / `↓` - Naviguer dans l'historique des commandes
- `Tab` - Auto-complétion

### Windows (PowerShell)
- `Ctrl + C` - Arrêter le serveur
- `cls` - Nettoyer le terminal
- `↑` / `↓` - Naviguer dans l'historique des commandes
- `Tab` - Auto-complétion

---

## 📖 Voir aussi

- **README.md** - Documentation complète
- **QUICKSTART.md** - Démarrage rapide
- **MIGRATION_GUIDE.md** - Guide de migration détaillé
- **INSTALLATION_GUIDE.md** - Installation pas à pas

---

**Version 1.0.0** - Décembre 2024
