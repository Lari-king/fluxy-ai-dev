import { Transaction } from '@/utils/csv-parser'; // ✅ CORRECTION: chemin correct

/**
 * Extract unique categories from transactions and merge with existing categories
 */
export function extractCategoriesFromTransactions(
  transactions: Transaction[],
  existingCategories: any[] = []
): any[] {
  const categoryMap = new Map<string, any>();

  // Normalize category name for comparison (lowercase, trim, normalize spaces)
  const normalizeKey = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ');

  // Add existing categories first (using normalized keys)
  existingCategories.forEach(cat => {
    const key = normalizeKey(cat.name);
    categoryMap.set(key, cat);
  });

  // Extract categories from transactions
  transactions.forEach(txn => {
    if (!txn.category) return;
    
    const key = normalizeKey(txn.category);
    if (!categoryMap.has(key)) {
      // Capitalize first letter for display
      const displayName = txn.category.charAt(0).toUpperCase() + txn.category.slice(1).toLowerCase();
      
      categoryMap.set(key, {
        id: key.replace(/\s+/g, '-'),
        name: displayName,
        color: generateCategoryColor(key),
        icon: 'tag',
      });
    }
  });

  return Array.from(categoryMap.values());
}

/**
 * Generate a consistent color for a category based on its name
 */
export function generateCategoryColor(name: string): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
    '#6366F1', // indigo
    '#84CC16', // lime
    '#06B6D4', // cyan
    '#A855F7', // violet
  ];

  // Simple hash function to get consistent color for same name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get category object by name
 */
export function getCategoryByName(name: string, categories: any[]): any | undefined {
  return categories.find(cat => cat.name === name);
}

/**
 * Get all unique category names from transactions
 */
export function getUniqueCategoryNames(transactions: Transaction[]): string[] {
  const categorySet = new Set<string>();

  transactions.forEach(txn => {
    if (txn.category) {
      categorySet.add(txn.category);
    }
  });

  return Array.from(categorySet).sort();
}

/**
 * 🆕 Génère un ID unique pour une catégorie
 */
export function generateCategoryId(): string {
  return `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 🆕 Vérifie si une catégorie peut être supprimée
 * (ne peut pas être supprimée si elle a des sous-catégories)
 */
export function canDeleteCategory(categoryId: string, allCategories: any[]): boolean {
  return !allCategories.some(cat => cat.parentId === categoryId);
}

/**
 * 🆕 Obtient toutes les sous-catégories d'une catégorie parente
 */
export function getSubcategories(parentId: string, allCategories: any[]): any[] {
  return allCategories.filter(cat => cat.parentId === parentId);
}

/**
 * 🆕 Obtient toutes les catégories racines (sans parent)
 */
export function getRootCategories(allCategories: any[]): any[] {
  return allCategories.filter(cat => !cat.parentId);
}

/**
 * 🆕 Construit un arbre de catégories hiérarchique
 */
export function buildCategoryTree(categories: any[]): {
  parents: any[];
  children: Record<string, any[]>;
} {
  return categories.reduce((acc, cat) => {
    if (!cat.parentId) {
      acc.parents.push(cat);
    } else {
      if (!acc.children[cat.parentId]) {
        acc.children[cat.parentId] = [];
      }
      acc.children[cat.parentId].push(cat);
    }
    return acc;
  }, { parents: [] as any[], children: {} as Record<string, any[]> });
}