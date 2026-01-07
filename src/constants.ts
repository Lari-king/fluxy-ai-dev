/**
 * Constants & Global Variables
 * 
 * Ce fichier centralise toutes les constantes et variables globales
 * utilisées dans l'application Flux.
 */

// ========================================
// APP CONFIG
// ========================================
export const APP_NAME = 'Flux';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Cockpit Financier Personnel Ultra-Avancé';

// ========================================
// LOCAL STORAGE KEYS
// ========================================
export const STORAGE_KEYS = {
  AUTH_USER: 'flux_auth_user',
  TRANSACTIONS: 'flux_transactions',
  BUDGETS: 'flux_budgets',
  GOALS: 'flux_goals',
  PEOPLE: 'flux_people',
  ASSETS: 'flux_assets',
  CATEGORIES: 'flux_categories',
  SETTINGS: 'flux_settings',
  THEME: 'flux_theme',
  RECURRING_GROUPS: 'flux_recurring_groups',
};

// ========================================
// DESIGN TOKENS
// ========================================

/**
 * Palette de couleurs principale
 */
export const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    500: '#6b7280',
    900: '#111827',
  },
};

/**
 * Espacements (en rem)
 */
export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

/**
 * Typographie
 */
export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
};

// ========================================
// CATEGORIES DE TRANSACTIONS
// ========================================
export const TRANSACTION_CATEGORIES = [
  // Dépenses
  { id: 'groceries', label: 'Courses', type: 'expense', icon: 'ShoppingCart', color: '#10b981' },
  { id: 'housing', label: 'Logement', type: 'expense', icon: 'Home', color: '#3b82f6' },
  { id: 'transport', label: 'Transport', type: 'expense', icon: 'Car', color: '#f59e0b' },
  { id: 'health', label: 'Santé', type: 'expense', icon: 'Heart', color: '#ef4444' },
  { id: 'entertainment', label: 'Loisirs', type: 'expense', icon: 'Film', color: '#8b5cf6' },
  { id: 'restaurants', label: 'Restaurants', type: 'expense', icon: 'UtensilsCrossed', color: '#ec4899' },
  { id: 'shopping', label: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#06b6d4' },
  { id: 'subscriptions', label: 'Abonnements', type: 'expense', icon: 'Repeat', color: '#14b8a6' },
  
  // Revenus
  { id: 'salary', label: 'Salaire', type: 'income', icon: 'Briefcase', color: '#10b981' },
  { id: 'freelance', label: 'Freelance', type: 'income', icon: 'Laptop', color: '#3b82f6' },
  { id: 'investments', label: 'Investissements', type: 'income', icon: 'TrendingUp', color: '#8b5cf6' },
  { id: 'other-income', label: 'Autres revenus', type: 'income', icon: 'Plus', color: '#06b6d4' },
];

// ========================================
// TYPES D'ASSETS (PATRIMOINE)
// ========================================
export const ASSET_TYPES = [
  { id: 'cash', label: 'Liquidités', icon: 'Wallet', color: '#10b981' },
  { id: 'real-estate', label: 'Immobilier', icon: 'Home', color: '#3b82f6' },
  { id: 'stocks', label: 'Actions', icon: 'TrendingUp', color: '#8b5cf6' },
  { id: 'crypto', label: 'Crypto', icon: 'Bitcoin', color: '#f59e0b' },
  { id: 'business', label: 'Entreprise', icon: 'Building2', color: '#06b6d4' },
  { id: 'other', label: 'Autres', icon: 'Briefcase', color: '#6b7280' },
];

// ========================================
// PROJECTIONS & SIMULATOR
// ========================================
export const PROJECTION_PERIODS = [
  { id: '1m', label: '1 mois', months: 1 },
  { id: '3m', label: '3 mois', months: 3 },
  { id: '6m', label: '6 mois', months: 6 },
  { id: '1y', label: '1 an', months: 12 },
  { id: '2y', label: '2 ans', months: 24 },
  { id: '5y', label: '5 ans', months: 60 },
];

// ========================================
// BUDGET FREQUENCIES
// ========================================
export const BUDGET_FREQUENCIES = [
  { id: 'monthly', label: 'Mensuel' },
  { id: 'weekly', label: 'Hebdomadaire' },
  { id: 'yearly', label: 'Annuel' },
];

// ========================================
// GOAL TYPES
// ========================================
export const GOAL_TYPES = [
  { id: 'savings', label: 'Épargne', icon: 'PiggyBank', color: '#10b981' },
  { id: 'investment', label: 'Investissement', icon: 'TrendingUp', color: '#3b82f6' },
  { id: 'purchase', label: 'Achat', icon: 'ShoppingCart', color: '#f59e0b' },
  { id: 'debt', label: 'Remboursement dette', icon: 'CreditCard', color: '#ef4444' },
  { id: 'other', label: 'Autre', icon: 'Target', color: '#8b5cf6' },
];

// ========================================
// FORMATTING
// ========================================
export const CURRENCY_FORMAT = {
  locale: 'fr-FR',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
};

export const DATE_FORMAT = {
  short: 'dd/MM/yyyy',
  long: 'dd MMMM yyyy',
  time: 'HH:mm',
  full: 'dd MMMM yyyy HH:mm',
};

// ========================================
// ANIMATION DURATIONS
// ========================================
export const ANIMATION = {
  fast: 150,     // ms
  normal: 300,   // ms
  slow: 500,     // ms
  verySlow: 1000 // ms
};

// ========================================
// BREAKPOINTS (Responsive)
// ========================================
export const BREAKPOINTS = {
  sm: 640,   // px
  md: 768,   // px
  lg: 1024,  // px
  xl: 1280,  // px
  '2xl': 1536, // px
};

// ========================================
// LIMITS & VALIDATION
// ========================================
export const LIMITS = {
  MAX_TRANSACTIONS: 10000,
  MAX_BUDGETS: 50,
  MAX_GOALS: 20,
  MAX_PEOPLE: 100,
  MAX_ASSETS: 200,
  CSV_MAX_SIZE_MB: 10,
  CSV_MAX_ROWS: 5000,
};

export default {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  STORAGE_KEYS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  TRANSACTION_CATEGORIES,
  ASSET_TYPES,
  PROJECTION_PERIODS,
  BUDGET_FREQUENCIES,
  GOAL_TYPES,
  CURRENCY_FORMAT,
  DATE_FORMAT,
  ANIMATION,
  BREAKPOINTS,
  LIMITS,
};
