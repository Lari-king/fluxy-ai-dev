# 📖 Guide d'Installation Détaillé - Flux

Ce guide vous accompagne pas à pas pour installer et lancer l'application Flux sur votre ordinateur.

## 🎯 Vue d'ensemble

Flux est une application web moderne qui s'exécute dans votre navigateur. Vous aurez besoin de :
1. Télécharger les fichiers du projet
2. Installer Node.js (si ce n'est pas déjà fait)
3. Installer les dépendances du projet
4. Lancer l'application

**Durée estimée** : 10-15 minutes

---

## Étape 1️⃣ : Télécharger Node.js

Node.js est nécessaire pour faire fonctionner l'application.

### Vérifier si Node.js est déjà installé

Ouvrez un terminal (Invite de commandes sur Windows, Terminal sur Mac/Linux) et tapez :

```bash
node --version
```

Si vous voyez un numéro de version (ex: `v18.17.0`), Node.js est déjà installé ! Passez à l'étape 2.

Sinon, installez-le :

### Installation de Node.js

1. Allez sur [https://nodejs.org](https://nodejs.org)
2. Téléchargez la version **LTS** (recommandée)
3. Exécutez le fichier téléchargé
4. Suivez l'assistant d'installation (cliquez sur "Suivant" partout)
5. Une fois installé, redémarrez votre terminal
6. Vérifiez l'installation avec `node --version`

✅ **Node.js est installé !**

---

## Étape 2️⃣ : Télécharger le projet Flux

### Depuis Figma Make

1. Dans l'interface Figma Make, cherchez le bouton **"Download"** ou **"Télécharger"**
2. Le projet sera téléchargé sous forme de fichier ZIP (ex: `flux-app.zip`)
3. **Enregistrez-le** dans un endroit facile à retrouver (ex: Bureau, Documents)

### Extraire les fichiers

1. **Localisez le fichier ZIP** que vous venez de télécharger
2. **Faites un clic droit** sur le fichier
3. Choisissez **"Extraire tout..."** (Windows) ou **"Décompresser"** (Mac)
4. Choisissez un dossier de destination, par exemple :
   - Windows : `C:\Users\VotreNom\Documents\flux-app`
   - Mac : `/Users/VotreNom/Documents/flux-app`
5. **Validez** l'extraction

✅ **Les fichiers sont extraits !**

---

## Étape 3️⃣ : Ouvrir le projet dans VS Code

### Installer Visual Studio Code (si nécessaire)

Si vous n'avez pas VS Code :
1. Téléchargez-le sur [https://code.visualstudio.com](https://code.visualstudio.com)
2. Installez-le (gratuit et rapide)

### Ouvrir le projet

1. **Lancez Visual Studio Code**
2. Cliquez sur **"Fichier" > "Ouvrir le dossier"** (ou **"File" > "Open Folder"**)
3. **Naviguez** jusqu'au dossier où vous avez extrait le projet
4. **Sélectionnez le dossier** `flux-app` (ou le nom du dossier extrait)
5. Cliquez sur **"Sélectionner le dossier"**

Vous devriez maintenant voir tous les fichiers du projet dans la barre latérale gauche de VS Code.

✅ **Le projet est ouvert dans VS Code !**

---

## Étape 4️⃣ : Ouvrir le terminal dans VS Code

Le terminal vous permet d'exécuter des commandes pour installer et lancer l'application.

### Ouvrir le terminal intégré

Dans VS Code :
- **Menu** : Cliquez sur **"Terminal" > "Nouveau Terminal"**
- Ou utilisez le raccourci clavier :
  - **Windows/Linux** : `Ctrl + ù` ou `Ctrl + ²`
  - **Mac** : `Cmd + ù`

Un terminal s'ouvre en bas de la fenêtre VS Code.

### Vérifier que vous êtes dans le bon dossier

Dans le terminal, vous devriez voir le chemin du projet, par exemple :
```
C:\Users\VotreNom\Documents\flux-app>
```

Si ce n'est pas le cas, utilisez la commande `cd` pour naviguer :
```bash
cd Documents/flux-app
```

✅ **Le terminal est prêt !**

---

## Étape 5️⃣ : Installer les dépendances

Les dépendances sont les bibliothèques dont Flux a besoin pour fonctionner (React, Tailwind, etc.).

### Commande d'installation

Dans le terminal de VS Code, tapez :

```bash
npm install
```

Puis appuyez sur **Entrée**.

### Que se passe-t-il ?

- npm va télécharger toutes les bibliothèques nécessaires
- Vous verrez défiler du texte dans le terminal
- Cela peut prendre **2 à 5 minutes** selon votre connexion internet
- Un dossier `node_modules` sera créé (il contient les bibliothèques)

### Erreurs possibles

❌ **"npm n'est pas reconnu"**
→ Node.js n'est pas correctement installé. Recommencez l'étape 1.

❌ **Erreurs de permissions**
→ Sur Mac/Linux, essayez avec `sudo npm install` (et entrez votre mot de passe)

✅ **Les dépendances sont installées !**

---

## Étape 6️⃣ : Lancer l'application

C'est le moment de démarrer Flux ! 🚀

### Commande de démarrage

Dans le terminal de VS Code, tapez :

```bash
npm run dev
```

Puis appuyez sur **Entrée**.

### Que se passe-t-il ?

1. L'application se compile (quelques secondes)
2. Un serveur local démarre
3. Vous verrez dans le terminal quelque chose comme :
   ```
   VITE v5.0.8  ready in 500 ms

   ➜  Local:   http://localhost:3000/
   ➜  Network: use --host to expose
   ```
4. **Votre navigateur devrait s'ouvrir automatiquement** à l'adresse `http://localhost:3000`

### Si le navigateur ne s'ouvre pas automatiquement

Pas de panique ! Ouvrez manuellement votre navigateur préféré et allez à :
```
http://localhost:3000
```

✅ **L'application Flux est lancée !** 🎉

---

## Étape 7️⃣ : Créer votre compte

### Première utilisation

Vous arrivez sur la page de connexion de Flux.

1. Cliquez sur **"Pas encore de compte ? Créer un compte"**
2. Remplissez le formulaire :
   - **Prénom** : Votre prénom
   - **Email** : Votre email (sera votre identifiant)
   - **Mot de passe** : Minimum 6 caractères
3. Cliquez sur **"Créer mon compte"**

**Félicitations ! Vous êtes connecté !** 🎊

Vous arrivez maintenant sur le **Dashboard** de Flux.

---

## 🎮 Utiliser Flux

### Navigation

La barre latérale gauche contient tous les modules :
- **Dashboard** : Vue d'ensemble
- **Transactions** : Ajouter/importer des transactions
- **Budgets** : Gérer vos budgets
- **Objectifs** : Définir des objectifs financiers
- **Personnes** : Analyser l'impact de votre entourage
- **Patrimoine** : Vue complète de vos actifs
- **Simulateur** : Projections "what if"
- **Paramètres** : Configuration

### Ajouter votre première transaction

1. Cliquez sur **"Transactions"** dans la sidebar
2. Cliquez sur **"Nouvelle transaction"**
3. Remplissez les informations :
   - **Description** : Ex: "Restaurant"
   - **Montant** : Ex: -45.50 (négatif pour une dépense)
   - **Date** : Aujourd'hui
   - **Catégorie** : Choisissez ou créez une catégorie
4. Cliquez sur **"Enregistrer"**

Votre transaction apparaît maintenant dans la liste ! ✅

### Mode sombre

Cliquez sur l'icône **Lune/Soleil** dans la barre latérale pour basculer entre les modes clair et sombre.

---

## 🛑 Arrêter l'application

Quand vous voulez arrêter l'application :

1. Dans le terminal VS Code où elle tourne
2. Appuyez sur **Ctrl + C** (Windows/Linux) ou **Cmd + C** (Mac)
3. Confirmez avec **Y** (Yes) si demandé

Pour relancer l'application plus tard, retapez simplement `npm run dev` dans le terminal.

---

## 💾 Vos données

**Important** : Toutes vos données sont stockées localement dans votre navigateur (localStorage).

### Avantages
✅ Vos données restent privées sur votre ordinateur
✅ Pas besoin de connexion internet une fois l'app lancée
✅ Rapide et sécurisé

### Attention
⚠️ Si vous videz le cache de votre navigateur, vous perdrez vos données
⚠️ Les données ne sont pas synchronisées entre différents navigateurs

### Conseil
💡 Exportez régulièrement vos données (fonctionnalité disponible dans **Paramètres > Export des données**)

---

## ❓ Questions fréquentes

### Comment relancer l'application après avoir fermé VS Code ?

1. Ouvrez VS Code
2. **"Fichier" > "Ouvrir les éléments récents"** > Sélectionnez le projet Flux
3. Ouvrez le terminal (**Ctrl/Cmd + ù**)
4. Tapez `npm run dev`

### Le port 3000 est déjà utilisé

Si vous voyez une erreur disant que le port 3000 est occupé :

1. Fermez toutes les autres applications web qui tournent
2. Ou modifiez le port dans le fichier `vite.config.ts` :
   ```typescript
   server: {
     port: 3001, // Changez ici
   }
   ```

### L'application est lente

- Fermez les onglets inutiles dans votre navigateur
- Redémarrez l'application (Ctrl+C puis `npm run dev`)
- Vérifiez que votre ordinateur n'est pas surchargé

### Je veux modifier le code

Allez-y ! Tous les fichiers sont modifiables. L'application se rechargera automatiquement quand vous sauvegardez (hot-reload).

Principaux fichiers :
- `/App.tsx` : Composant principal
- `/components/` : Tous les composants
- `/styles/globals.css` : Styles et couleurs

---

## 🎓 Ressources supplémentaires

- [Documentation React](https://react.dev)
- [Documentation Tailwind CSS](https://tailwindcss.com)
- [Documentation TypeScript](https://www.typescriptlang.org)

---

## 🎉 Félicitations !

Vous avez réussi à installer et lancer Flux ! Profitez de votre cockpit financier personnel ! 💰✨

Si vous avez des questions, consultez le fichier `README.md` ou les fichiers dans `/docs/`.

**Bon voyage financier avec Flux ! 🚀**
