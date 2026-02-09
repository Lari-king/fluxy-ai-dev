# ⚡ Quick Start - Flux

## 🎯 Pour démarrer immédiatement

### Vous avez déjà un projet existant ?

Votre projet a été **réorganisé** avec une structure professionnelle `/src`. Suivez ces 3 étapes :

```bash
# 1️⃣ Migrer automatiquement vers /src
node migrate.js

# 2️⃣ Installer les dépendances
npm install

# 3️⃣ Lancer l'application
npm run dev
```

➡️ **L'app s'ouvrira sur http://localhost:3000** 🎉

---

### Vous partez de zéro ?

```bash
# 1️⃣ Installer les dépendances
npm install

# 2️⃣ Lancer l'application
npm run dev
```

C'est tout ! L'application est prête à l'emploi.

---

## 📁 Nouvelle structure

Votre projet est maintenant organisé comme un vrai projet Vite + React :

```
flux-app/
├── src/
│   ├── main.jsx          # ← Point d'entrée
│   ├── App.jsx           # ← Composant racine + React Router
│   ├── router.jsx        # ← Routes
│   ├── constants.js      # ← Variables globales
│   ├── components/       # ← Tous vos composants
│   ├── contexts/         # ← React Contexts
│   ├── utils/            # ← Fonctions utilitaires
│   └── styles/           # ← CSS
│
├── index.html            # ← Template HTML
├── vite.config.js        # ← Config Vite
└── package.json          # ← Dépendances
```

---

## 🔄 Qu'est-ce qui a changé ?

### ✅ Améliorations

1. **React Router** - Navigation avec vraies URLs
   ```
   /dashboard
   /transactions
   /budgets
   /goals
   ...
   ```

2. **Structure /src** - Standard Vite + React
   - Tous les fichiers dans `/src`
   - Organisation claire et maintenable

3. **Alias Vite** - Imports propres
   ```javascript
   // Avant
   import { Button } from '../../../components/ui/button';
   
   // Maintenant
   import { Button } from '@components/ui/button';
   ```

4. **Scripts npm** - Commandes standardisées
   ```bash
   npm run dev      # Développement
   npm run build    # Production
   npm run preview  # Prévisualiser build
   ```

### 🔧 Ce qui reste identique

- ✓ Toutes vos fonctionnalités
- ✓ Tous vos composants
- ✓ Stockage localStorage
- ✓ Design et UI
- ✓ Authentification locale

---

## 🚨 Problèmes courants

### ❌ `npm run dev` ne fonctionne pas

```bash
# Solution : Nettoyer et réinstaller
rm -rf node_modules package-lock.json .vite
npm install
npm run dev
```

### ❌ Page blanche / Erreurs dans la console

```bash
# Solution : Vérifier que la migration est complète
node migrate.js
npm run dev
```

### ❌ "Cannot find module '@components/...'"

```bash
# Solution : Les fichiers ne sont pas dans /src
node migrate.js
```

---

## 📚 Documentation complète

- **README.md** - Vue d'ensemble et documentation
- **MIGRATION_GUIDE.md** - Guide détaillé de migration
- **INSTALLATION_GUIDE.md** - Installation pas à pas

---

## 💡 Astuces

### Créer un nouveau composant

```bash
# Créer dans /src/components
touch src/components/MonComposant.jsx
```

### Ajouter une nouvelle route

Éditez `/src/App.jsx` :

```javascript
<Route path="/nouvelle-page" element={<NouvellePage />} />
```

### Utiliser les constantes

```javascript
import { COLORS, APP_NAME, STORAGE_KEYS } from '@/constants';
```

---

## 🎉 C'est tout !

Votre application Flux est maintenant structurée comme un vrai projet pro.

**Besoin d'aide ?** Consultez les guides dans `/docs` ou `MIGRATION_GUIDE.md`

---

**Version 1.0.0** - Décembre 2024
