# Guide d'import CSV - Flux

## Format du fichier CSV

Votre fichier CSV doit contenir les colonnes suivantes (séparées par `,` ou `;`) :

### Colonnes obligatoires

| Colonne | Description | Exemple |
|---------|-------------|---------|
| `date` | Date de la transaction | `2024-01-15` ou `15/01/2024` |
| `description` ou `libellé` | Description de la transaction | `Courses Carrefour` |
| `montant` ou `amount` | Montant (négatif pour dépenses, positif pour revenus) | `-45.50` ou `2000.00` |
| `type` | Type de transaction : `online` ou `physical` | `online` |

### Colonnes optionnelles

| Colonne | Description | Exemple |
|---------|-------------|---------|
| `url` | URL du site/produit (pour achats en ligne) | `https://www.amazon.fr/produit/12345` |
| `address` ou `adresse` | Adresse du lieu (pour achats physiques) | `12 Rue de la Paix, 75002 Paris` |
| `brand` ou `marque` | Nom de l'enseigne/marque | `Carrefour`, `Amazon` |
| `brandlogo` | URL du logo de la marque | `https://...` |
| `city` ou `ville` | Ville de la transaction | `Paris` |
| `country` ou `pays` | Pays de la transaction | `France` |
| `continent` | Continent | `Europe`, `Asie`, etc. |
| `person` ou `personne` | Nom de la personne | `Ma compagne` |
| `personid` | ID de la personne | `partner` |
| `notes` | Notes supplémentaires | `Cadeau d'anniversaire` |
| `category` ou `catégorie` | Catégorie | `Alimentation` |

## Exemple de fichier CSV

```csv
date,description,montant,type,url,brand,city,country
2024-01-15,iPhone 15 Pro,1199.00,online,https://www.apple.com/fr/iphone,Apple,Paris,France
2024-01-16,Courses alimentaires,-87.50,physical,,Carrefour,Paris,France
2024-01-17,Essence,-65.00,physical,"Station Total, Avenue des Champs",Total,Paris,France
2024-01-18,Salaire,2500.00,online,,,Paris,France
```

## Fonctionnalités automatiques

### Extraction d'informations depuis URL

Lorsque vous fournissez une URL pour un achat en ligne, Flux extrait automatiquement :
- Le titre du produit
- La description
- Le prix (si disponible)
- Le logo de la marque
- Le nom du site

### Géolocalisation

Les adresses fournies permettent de :
- Visualiser vos dépenses sur une carte
- Analyser vos flux par localisation
- Comprendre vos habitudes de consommation géographiques

### Attribution aux personnes

Vous pouvez associer chaque transaction à une personne de votre cercle familial :
- **Famille directe** : vous, votre compagne, vos enfants
- **Famille élargie** : parents, grands-parents, frères et sœurs
- **Grande famille** : oncles, tantes, cousins, etc.

Cela permet d'analyser l'impact financier de chaque personne sur vos finances.

## Catégorisation automatique

Flux catégorise automatiquement vos transactions selon des règles intelligentes basées sur :
- Les mots-clés dans la description
- Le type de transaction
- La marque/enseigne
- Le montant

Les catégories par défaut sont :
1. **Famille** 👨‍👩‍👧
2. **Investissements** 📈
3. **Plaisir** 🎉
4. **Dette** ⚠️
5. **Logement** 🏠
6. **Transport** 🚗
7. **Santé** ⚕️
8. **Alimentation** 🍔

## Import via l'interface

1. Allez dans **Transactions**
2. Cliquez sur **Importer CSV**
3. Glissez-déposez votre fichier ou cliquez pour le sélectionner
4. Les transactions seront automatiquement catégorisées
5. Vous pouvez ensuite éditer chaque transaction pour enrichir les détails

## Saisie manuelle

Si vous préférez saisir manuellement, cliquez sur **Nouvelle transaction** et remplissez :
- Les informations de base (date, montant, description)
- Le type (en ligne ou physique)
- Pour les achats en ligne : ajoutez l'URL et cliquez sur **Extraire** pour récupérer automatiquement les infos
- Pour les achats physiques : ajoutez l'adresse pour la géolocalisation
- Ajoutez l'enseigne/marque avec son logo
- Sélectionnez la personne à l'origine de la transaction
- Ajoutez des notes si nécessaire

## Conseils

✅ **DO**
- Utilisez des montants négatifs pour les dépenses et positifs pour les revenus
- Renseignez le maximum d'informations pour une analyse complète
- Utilisez des URLs complètes pour l'extraction automatique
- Maintenez un format de date cohérent

❌ **DON'T**
- Ne mélangez pas différents séparateurs (virgule et point-virgule)
- N'oubliez pas le type de transaction (online/physical)
- Ne laissez pas de lignes vides dans le CSV
