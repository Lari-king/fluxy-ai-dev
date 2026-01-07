/**
 * 🏷️ DEFAULT CATEGORIES
 * Catégories par défaut pour l'initialisation de l'application
 */

export interface Category {
    id: string;
    name: string;
    color: string;
    icon: string;
    parentId?: string;
  }
  
  /**
   * Catégories par défaut (principales)
   */
  export const DEFAULT_CATEGORIES: Category[] = [
    {
      id: 'cat_alimentation',
      name: 'Alimentation',
      color: '#14B8A6', // Teal
      icon: 'utensils',
    },
    {
      id: 'cat_transport',
      name: 'Transport',
      color: '#3B82F6', // Blue
      icon: 'car',
    },
    {
      id: 'cat_logement',
      name: 'Logement',
      color: '#8B5CF6', // Violet
      icon: 'home',
    },
    {
      id: 'cat_sante',
      name: 'Santé',
      color: '#10B981', // Green
      icon: 'heart-pulse',
    },
    {
      id: 'cat_loisirs',
      name: 'Loisirs',
      color: '#F97316', // Orange
      icon: 'coffee',
    },
    {
      id: 'cat_shopping',
      name: 'Shopping',
      color: '#EC4899', // Pink
      icon: 'shopping-bag',
    },
    {
      id: 'cat_education',
      name: 'Éducation',
      color: '#6366F1', // Indigo
      icon: 'graduation-cap',
    },
    {
      id: 'cat_famille',
      name: 'Famille',
      color: '#EF4444', // Red
      icon: 'users',
    },
    {
      id: 'cat_services',
      name: 'Services',
      color: '#84CC16', // Lime
      icon: 'wrench',
    },
    {
      id: 'cat_autres',
      name: 'Autres',
      color: '#64748B', // Slate
      icon: 'more-horizontal',
    },
  ];
  
  /**
   * Sous-catégories par défaut
   */
  export const DEFAULT_SUBCATEGORIES: Category[] = [
    // Sous-catégories Alimentation
    {
      id: 'cat_alimentation_restaurant',
      name: 'Restaurant',
      color: '#14B8A6',
      icon: 'utensils',
      parentId: 'cat_alimentation',
    },
    {
      id: 'cat_alimentation_courses',
      name: 'Courses',
      color: '#14B8A6',
      icon: 'shopping-cart',
      parentId: 'cat_alimentation',
    },
    {
      id: 'cat_alimentation_fastfood',
      name: 'Fast-food',
      color: '#14B8A6',
      icon: 'utensils',
      parentId: 'cat_alimentation',
    },
    
    // Sous-catégories Transport
    {
      id: 'cat_transport_essence',
      name: 'Essence',
      color: '#3B82F6',
      icon: 'fuel',
      parentId: 'cat_transport',
    },
    {
      id: 'cat_transport_parking',
      name: 'Parking',
      color: '#3B82F6',
      icon: 'car',
      parentId: 'cat_transport',
    },
    {
      id: 'cat_transport_public',
      name: 'Transport public',
      color: '#3B82F6',
      icon: 'bus',
      parentId: 'cat_transport',
    },
    
    // Sous-catégories Logement
    {
      id: 'cat_logement_loyer',
      name: 'Loyer',
      color: '#8B5CF6',
      icon: 'home',
      parentId: 'cat_logement',
    },
    {
      id: 'cat_logement_electricite',
      name: 'Électricité',
      color: '#8B5CF6',
      icon: 'zap',
      parentId: 'cat_logement',
    },
    {
      id: 'cat_logement_eau',
      name: 'Eau',
      color: '#8B5CF6',
      icon: 'droplet',
      parentId: 'cat_logement',
    },
    
    // Sous-catégories Loisirs
    {
      id: 'cat_loisirs_cinema',
      name: 'Cinéma',
      color: '#F97316',
      icon: 'film',
      parentId: 'cat_loisirs',
    },
    {
      id: 'cat_loisirs_sport',
      name: 'Sport',
      color: '#F97316',
      icon: 'dumbbell',
      parentId: 'cat_loisirs',
    },
    {
      id: 'cat_loisirs_streaming',
      name: 'Streaming',
      color: '#F97316',
      icon: 'tv',
      parentId: 'cat_loisirs',
    },
  ];
  
  /**
   * Retourne toutes les catégories (principales + sous-catégories)
   */
  export function getAllDefaultCategories(): Category[] {
    return [...DEFAULT_CATEGORIES, ...DEFAULT_SUBCATEGORIES];
  }
  
  /**
   * Initialise les catégories si aucune n'existe
   */
  export function initializeCategoriesIfEmpty(existingCategories: Category[]): Category[] {
    if (existingCategories.length === 0) {
      console.log('📦 Initialisation des catégories par défaut');
      return getAllDefaultCategories();
    }
    return existingCategories;
  }
  