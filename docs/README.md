# 🚀 Flux - Cockpit Financier Personnel

Application financière personnelle ultra-avancée avec dashboard futuriste, gestion des transactions, budgets par enveloppes, objectifs, patrimoine 360°, et simulateur "what if".

## ✨ Fonctionnalités

- 📊 **Dashboard futuriste** avec projections et analytics en temps réel
- 💳 **Gestion des transactions** avec import CSV et catégorisation automatique
- 💰 **Budgets par enveloppes** avec règles automatiques
- 🎯 **Objectifs financiers** avec tracking de progression
- 👥 **Module personnes & impact** pour analyser l'impact financier de votre cercle
- 🏠 **Patrimoine 360°** avec visualisation complète de vos actifs
- 🔮 **Simulateur "what if"** pour projeter vos finances
- 🎨 **Design moderne** avec animations fluides et mode sombre
- 💾 **Stockage local** - toutes vos données restent sur votre appareil

## 🛠️ Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- [npm](https://www.npmjs.com/) (inclus avec Node.js)
- Un éditeur de code comme [Visual Studio Code](https://code.visualstudio.com/)

## 📥 Installation

### 1. Télécharger le projet

Dans Figma Make, utilisez le bouton de téléchargement pour récupérer tous les fichiers du projet sous forme d'archive ZIP.

### 2. Extraire le projet

Extrayez le contenu du ZIP dans un dossier de votre choix, par exemple :
- Windows : `C:\Users\VotreNom\Documents\flux-app`
- Mac/Linux : `~/Documents/flux-app`

### 3. Ouvrir dans Visual Studio Code

1. Lancez Visual Studio Code
2. Cliquez sur **Fichier > Ouvrir le dossier** (ou **File > Open Folder**)
3. Sélectionnez le dossier où vous avez extrait le projet
4. Le projet s'ouvre dans VS Code

### 4. Installer les dépendances

Dans VS Code, ouvrez le terminal intégré :
- Menu : **Terminal > Nouveau Terminal** (ou **Terminal > New Terminal**)
- Ou utilisez le raccourci : **Ctrl+`** (Windows/Linux) ou **Cmd+`** (Mac)

Dans le terminal, exécutez :

```bash
npm install
```

Cette commande va télécharger et installer toutes les bibliothèques nécessaires. Cela peut prendre quelques minutes.

### 5. Lancer l'application

Une fois l'installation terminée, lancez l'application en développement :

```bash
npm run dev
```

Votre navigateur devrait s'ouvrir automatiquement à l'adresse `http://localhost:3000`.

Si le navigateur ne s'ouvre pas, ouvrez-le manuellement et allez à : **http://localhost:3000**

## 🎯 Utilisation

### Première connexion

1. Sur la page de connexion, cliquez sur **"Pas encore de compte ? Créer un compte"**
2. Remplissez le formulaire :
   - **Prénom** : Votre prénom
   - **Email** : Votre email (utilisé comme identifiant)
   - **Mot de passe** : Minimum 6 caractères
3. Cliquez sur **"Créer mon compte"**

Vous êtes maintenant connecté ! 🎉

### Navigation

L'application comprend plusieurs modules accessibles depuis la barre latérale :

- **Dashboard** : Vue d'ensemble de vos finances
- **Transactions** : Gérer vos transactions (manuelles ou import CSV)
- **Budgets** : Créer et suivre vos budgets par catégories
- **Objectifs** : Définir et tracker vos objectifs financiers
- **Personnes** : Gérer votre cercle et analyser l'impact financier
- **Patrimoine** : Vue 360° de tous vos actifs
- **Family Office** : Gestion avancée du patrimoine familial
- **Simulateur** : Créer des scénarios "what if"

### Import de transactions CSV

1. Allez dans **Transactions**
2. Cliquez sur **"Importer CSV"**
3. Sélectionnez votre fichier CSV
4. Mappez les colonnes (date, montant, description)
5. Validez l'import

Format CSV recommandé :
```csv
date,montant,description
2024-01-15,-45.50,Restaurant Le Petit Bistro
2024-01-16,2500.00,Salaire janvier
```

### Données locales

⚠️ **Important** : Toutes vos données sont stockées localement dans le navigateur (localStorage). 

- ✅ **Avantages** : Vos données restent privées sur votre appareil
- ⚠️ **Attention** : Si vous videz le cache du navigateur, vous perdrez vos données
- 💡 **Conseil** : Exportez régulièrement vos données (fonctionnalité d'export disponible dans Paramètres)

## 🔧 Commandes utiles

```bash
# Lancer en développement (avec hot-reload)
npm run dev

# Compiler pour la production
npm run build

# Prévisualiser la version production
npm run preview

# Vérifier le code (linting)
npm run lint
```

## 🎨 Personnalisation

### Changer le thème

- Cliquez sur l'icône **Soleil/Lune** dans la barre latérale pour basculer entre mode clair et sombre
- Les préférences sont sauvegardées automatiquement

### Modifier les couleurs

Les couleurs principales sont définies dans `/styles/globals.css`. Vous pouvez les personnaliser :

```css
@theme {
  --color-primary-500: #3b82f6; /* Bleu principal */
  --color-purple-500: #a855f7;  /* Violet */
  /* ... autres couleurs */
}
```

## 📁 Structure du projet

```
flux-app/
├── components/          # Composants React
│   ├── auth/           # Authentification
│   ├── dashboard/      # Composants du dashboard
│   ├── transactions/   # Gestion des transactions
│   ├── budgets/        # Gestion des budgets
│   ├── goals/          # Objectifs
│   ├── people/         # Module personnes
│   ├── patrimoine/     # Patrimoine
│   ├── layout/         # Mise en page
│   └── ui/             # Composants UI réutilisables (shadcn)
├── contexts/           # Contextes React (Auth, Data, Theme)
├── hooks/              # Hooks personnalisés
├── utils/              # Fonctions utilitaires
├── styles/             # Styles CSS/Tailwind
├── types/              # Types TypeScript
├── App.tsx             # Composant principal
├── main.tsx            # Point d'entrée
└── package.json        # Dépendances
```

## 🐛 Résolution des problèmes

### Le serveur ne démarre pas

1. Vérifiez que Node.js est bien installé : `node --version`
2. Vérifiez que npm est installé : `npm --version`
3. Supprimez `node_modules` et réinstallez :
   ```bash
   rm -rf node_modules
   npm install
   ```

### Le port 3000 est déjà utilisé

Modifiez le port dans `vite.config.ts` :
```typescript
server: {
  port: 3001, // Changez le numéro du port
  open: true,
}
```

### Erreur "out of memory"

L'application a été optimisée pour éviter les fuites mémoire. Si le problème persiste :
1. Fermez les autres onglets du navigateur
2. Redémarrez le serveur de développement
3. Vérifiez la console pour des erreurs spécifiques

### Les données disparaissent

Vérifiez que vous n'avez pas :
- Vidé le cache du navigateur
- Utilisé le mode navigation privée
- Changé de navigateur

💡 **Solution** : Exportez régulièrement vos données depuis la page Paramètres.

## 📊 Performance

L'application est optimisée pour :
- ✅ Rendu fluide avec React.memo et useMemo
- ✅ Animations 60fps avec Motion
- ✅ Chargement rapide (< 2s)
- ✅ Responsive sur tous les appareils

## 🔒 Sécurité & Vie Privée

- 🔐 Authentification locale (pas de serveur distant)
- 💾 Données stockées uniquement sur votre appareil
- 🚫 Aucune donnée envoyée à des tiers
- 🔒 Mot de passe stocké avec hash local (simple)

⚠️ **Note** : Il s'agit d'une application de démonstration. Pour une utilisation en production, ajoutez :
- Chiffrement des données
- Hash sécurisé des mots de passe (bcrypt)
- Backup automatique des données

## 🚀 Déploiement

Pour déployer l'application en production :

### Option 1 : Build local

```bash
npm run build
```

Les fichiers compilés seront dans le dossier `dist/`. Vous pouvez les héberger sur n'importe quel serveur web statique.

### Option 2 : Vercel (gratuit)

1. Créez un compte sur [Vercel](https://vercel.com)
2. Installez Vercel CLI : `npm install -g vercel`
3. Dans le dossier du projet : `vercel`
4. Suivez les instructions

### Option 3 : Netlify (gratuit)

1. Créez un compte sur [Netlify](https://netlify.com)
2. Glissez-déposez le dossier `dist/` sur Netlify
3. Votre app est en ligne !

## 📝 Licence

Ce projet est un prototype/démonstration. Utilisez-le librement pour vos besoins personnels.

## 🤝 Support

Pour toute question ou problème :
1. Consultez la section "Résolution des problèmes" ci-dessus
2. Vérifiez les fichiers de documentation dans le dossier `/docs`
3. Consultez les commentaires dans le code source

## 🎉 Profitez de Flux !

Vous êtes maintenant prêt à prendre le contrôle de vos finances ! 💰✨

---

**Fait avec ❤️ et React + TypeScript + Tailwind CSS**
