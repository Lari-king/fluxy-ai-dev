import { Transaction } from '@/utils/csv-parser';

/**
 * 🎯 EXTRACT CATEGORIES - VERSION COMPLÈTE
 * Extrait les catégories ET sous-catégories en préservant la hiérarchie.
 */
export function extractCategoriesFromTransactions(
  transactions: any[], 
  existingCategories: any[] = []
): any[] {
  const categoryMap = new Map<string, any>();

  // Normalisation du nom pour la comparaison
  const normalizeKey = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ');

  // 1. On réintègre l'existant pour ne pas perdre les IDs ou couleurs déjà définis
  existingCategories.forEach(cat => {
    // On crée une clé unique combinant nom et parent pour différencier 
    // deux sous-catégories qui auraient le même nom mais des parents différents.
    const key = normalizeKey(cat.name + (cat.parentId || ''));
    categoryMap.set(key, cat);
  });

  // 2. Extraction depuis les transactions
  transactions.forEach(txn => {
    if (!txn.category) return;
    
    // --- GESTION DU PARENT ---
    const parentName = txn.category.charAt(0).toUpperCase() + txn.category.slice(1).toLowerCase();
    const parentKey = normalizeKey(parentName);
    
    let parentId: string;

    if (!categoryMap.has(parentKey)) {
      parentId = parentKey.replace(/\s+/g, '-');
      categoryMap.set(parentKey, {
        id: parentId,
        name: parentName,
        color: generateCategoryColor(parentKey),
        icon: 'tag',
      });
    } else {
      parentId = categoryMap.get(parentKey).id;
    }

    // --- GESTION DE LA SOUS-CATÉGORIE (Correction cruciale) ---
    if (txn.subCategory && txn.subCategory.trim() !== '') {
      const subName = txn.subCategory.charAt(0).toUpperCase() + txn.subCategory.slice(1).toLowerCase();
      // Clé unique pour la sous-catégorie liée à son parent
      const subKey = normalizeKey(subName + parentId); 

      if (!categoryMap.has(subKey)) {
        categoryMap.set(subKey, {
          id: `sub-${parentId}-${subKey.replace(/\s+/g, '-')}`,
          name: subName,
          parentId: parentId, // Liaison avec le parent
          color: generateCategoryColor(subKey),
          icon: 'tag',
        });
      }
    }
  });

  return Array.from(categoryMap.values());
}

/**
 * Génère une couleur cohérente basée sur le nom
 */
export function generateCategoryColor(name: string): string {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#06B6D4', '#A855F7'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Retourne l'objet catégorie par son nom
 */
export function getCategoryByName(name: string, categories: any[]): any | undefined {
  return categories.find(cat => cat.name === name);
}

/**
 * Liste tous les noms uniques de catégories (utile pour les filtres)
 */
export function getUniqueCategoryNames(transactions: Transaction[]): string[] {
  const categorySet = new Set<string>();
  transactions.forEach(txn => {
    if (txn.category) categorySet.add(txn.category);
  });
  return Array.from(categorySet).sort();
}

export function generateCategoryId(): string {
  return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function canDeleteCategory(categoryId: string, allCategories: any[]): boolean {
  return !allCategories.some(cat => cat.parentId === categoryId);
}

export function getSubcategories(parentId: string, allCategories: any[]): any[] {
  return allCategories.filter(cat => cat.parentId === parentId);
}

export function getRootCategories(allCategories: any[]): any[] {
  return allCategories.filter(cat => !cat.parentId);
}

export function buildCategoryTree(categories: any[]): {
  parents: any[];
  children: Record<string, any[]>;
} {
  return categories.reduce((acc, cat) => {
    if (!cat.parentId) {
      acc.parents.push(cat);
    } else {
      if (!acc.children[cat.parentId]) acc.children[cat.parentId] = [];
      acc.children[cat.parentId].push(cat);
    }
    return acc;
  }, { parents: [] as any[], children: {} as Record<string, any[]> });
}