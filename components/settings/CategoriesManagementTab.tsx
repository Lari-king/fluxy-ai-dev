/**
 * 🏷️ CATEGORIES MANAGEMENT TAB - VERSION PRODUCTION OPTIMISÉE
 * 
 * 🚀 Optimisations de performance :
 * - Calcul des stats en O(n) (1 passage au lieu de 3)
 * - Mémoïsation correcte des parentCategories avec tri alphabétique
 * - ModernCategorySelect mémoïsé avec React.memo
 * - key={categories.length} force la régénération du Select (filet de sécurité)
 * - Stabilisation des références (useMemo/useCallback)
 * 
 * 🎨 UX améliorée :
 * - Tri alphabétique des catégories parentes (facilite la recherche)
 * - Mode "Continuer à ajouter" garde le parent sélectionné
 * - Suppression intelligente avec vérification des dépendances
 * 
 * ✨ Fonctionnalités :
 * - Sélection multiple pour réassignation en masse
 * - Intégration pyramide de Maslow avec analyse psychologique
 * - Import/Export CSV
 */

import React, { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  FolderTree, 
  Tag, 
  ChevronRight, 
  ChevronDown,
  X,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Sparkles,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
  Brain
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { toast } from 'sonner';
import { generateCategoryColor } from '../../src/utils/categories';
import { MaslowPyramid } from '../maslow/MaslowPyramid';
import { CSVPreviewModal } from './CSVPreviewModal';
import { MassActionMenu } from './MassActionMenu';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  emoji?: string;
  parentId?: string;
}

// --- COMPOSANT CUSTOM SELECT MODERNE (inspiré CommandBar) ---
interface ModernSelectProps {
  value: string;
  options: Category[];
  onChange: (val: string) => void;
  placeholder?: string;
  excludeId?: string; // Pour exclure la catégorie en cours d'édition
}

const ModernCategorySelect = memo(({ value, options, onChange, placeholder, excludeId }: ModernSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ⚡️ Filtrage mémoisé pour éviter les recalculs lors de l'ouverture/fermeture
  const filteredOptions = useMemo(() => {
    if (!excludeId) return options;
    return options.filter(opt => opt.id !== excludeId);
  }, [options, excludeId]);

  const selectedOption = useMemo(() => 
    filteredOptions.find(o => o.id === value),
    [filteredOptions, value]
  );

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm text-white/90
          border backdrop-blur-xl transition-all duration-200
          bg-white/5 border-white/10 hover:bg-white/10 focus:border-cyan-400/50
          ${isOpen ? 'shadow-lg shadow-cyan-500/20 border-cyan-400/50' : ''}
        `}
      >
        <span className="truncate flex items-center gap-2">
          {selectedOption ? (
            <>
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: selectedOption.color }}
              />
              {selectedOption.name}
            </>
          ) : (
            placeholder || 'Choisir...'
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#0A0A0A]/95 border border-white/10 rounded-xl shadow-2xl z-[70] overflow-hidden backdrop-blur-2xl"
          >
            {/* Option "Aucune" */}
            <button
              onClick={() => {
                onChange('none');
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center gap-3 border-b border-white/5 group ${
                value === 'none' 
                  ? 'bg-cyan-500/20 text-cyan-400' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
              <span className="truncate">Aucune (catégorie principale)</span>
              {value === 'none' && <CheckCircle2 className="w-4 h-4 ml-auto" />}
            </button>

            {/* Liste des catégories avec scroll (max 7 visible = ~280px) */}
            <div className="max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-all flex items-center gap-3 border-b border-white/5 last:border-none group ${
                    value === opt.id 
                      ? 'bg-cyan-500/20 text-cyan-400' 
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform" 
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="truncate">{opt.name}</span>
                  {value === opt.id && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export function CategoriesManagementTab() {
  const { categories, transactions, updateCategories, updateTransactions } = useData();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showMaslowAnalysis, setShowMaslowAnalysis] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [selectedForReassign, setSelectedForReassign] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#3B82F6');
  const [formParentId, setFormParentId] = useState<string>('none');
  const [keepDialogOpen, setKeepDialogOpen] = useState(false);

  // Reassign state
  const [reassignTarget, setReassignTarget] = useState<{ category: string; subCategory?: string } | null>(null);

  // CSV Preview state
  const [showCSVPreview, setShowCSVPreview] = useState(false);
  const [csvPreviewData, setCSVPreviewData] = useState<{ parent: string; child: string }[]>([]);
  const [showMassActionMenu, setShowMassActionMenu] = useState(false);

  // ========================================
  // ⚡️ STATISTIQUES DE COMPLÉTION - OPTIMISÉ O(n)
  // ========================================
  const completionStats = useMemo(() => {
    return transactions.reduce((acc, t) => {
      acc.total++;
      
      const hasCategory = t.category && t.category !== 'Non classifié';
      const hasSubCategory = (t as any).subCategory && (t as any).subCategory !== '';

      if (!hasCategory) {
        acc.uncategorized++;
      } else if (hasCategory && hasSubCategory) {
        acc.fullyCompleted++;
      } else {
        acc.partiallyCompleted++;
      }
      return acc;
    }, { 
      total: 0, 
      fullyCompleted: 0, 
      partiallyCompleted: 0, 
      uncategorized: 0 
    });
  }, [transactions]);

  const completionRate = useMemo(() => 
    completionStats.total > 0 ? Math.round((completionStats.fullyCompleted / completionStats.total) * 100) : 0,
    [completionStats]
  );

  // ========================================
  // ⚡️ COMPTAGE DES TRANSACTIONS PAR CATÉGORIE - OPTIMISÉ
  // ========================================
  const categoryTransactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of transactions) {
      if (t.category && t.category !== 'Non classifié') {
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
      if ((t as any).subCategory) {
        const subKey = `${t.category}__${(t as any).subCategory}`;
        counts[subKey] = (counts[subKey] || 0) + 1;
      }
    }
    return counts;
  }, [transactions]);

  // ========================================
  // ⚡️ LISTE DES PARENTS MÉMOISÉE + TRI ALPHABÉTIQUE
  // Cela résout le bug où le select ne voyait pas les nouveaux parents
  // car le filtre inline créait une nouvelle référence à chaque render
  // Le tri alphabétique facilite la recherche visuelle
  // ========================================
  const parentCategories = useMemo(() => {
    return categories
      .filter(c => !c.parentId)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, [categories]);

  // ========================================
  // ARBRE DE CATÉGORIES AVEC COMPTEURS
  // ========================================
  const categoryTree = useMemo(() => {
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
    }, { parents: [] as Category[], children: {} as Record<string, Category[]> });
  }, [categories]);

  // ========================================
  // IMPORT/EXPORT
  // ========================================
  const handleExportCategories = useCallback(() => {
    const csvContent = ['categorie,sous_categorie'];
    
    categoryTree.parents.forEach(parent => {
      const children = categoryTree.children[parent.id] || [];
      
      if (children.length === 0) {
        csvContent.push(`${parent.name},`);
      } else {
        children.forEach(child => {
          csvContent.push(`${parent.name},${child.name}`);
        });
      }
    });
    
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `categories_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Catégories exportées');
  }, [categoryTree]);

  const handleImportCategories = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        
        if (lines.length < 2) {
          toast.error('Fichier vide ou invalide');
          return;
        }

        const dataLines = lines.slice(1);
        const previewData: { parent: string; child: string; isNew: boolean; parentExists: boolean }[] = [];
        const existingParentNames = new Set(categoryTree.parents.map(p => p.name));

        // Analyser les données pour preview
        dataLines.forEach(line => {
          const [parentName, childName] = line.split(',').map(s => s.trim());
          
          if (parentName) {
            const parentExists = existingParentNames.has(parentName);
            const childExists = childName && categories.some(c => {
              const parent = categoryTree.parents.find(p => p.name === parentName);
              return c.name === childName && c.parentId === parent?.id;
            });
            
            previewData.push({
              parent: parentName,
              child: childName || '',
              isNew: childName ? !childExists : !parentExists,
              parentExists
            });
          }
        });

        setCSVPreviewData(previewData as any);
        setShowCSVPreview(true);
      } catch (error) {
        console.error('Import preview error:', error);
        toast.error('Erreur lors de la lecture du fichier');
      }
    };
    
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [categories, categoryTree]);

  const handleConfirmCSVImport = useCallback(async () => {
    try {
      const newCategories: Category[] = [...categories];
      const existingParentNames = new Set(categoryTree.parents.map(p => p.name));
      const parentMap: Record<string, string> = {};

      // Créer les parents d'abord
      csvPreviewData.forEach(({ parent }) => {
        if (parent && !existingParentNames.has(parent) && !parentMap[parent]) {
          const newParent: Category = {
            id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: parent,
            color: generateCategoryColor(parent),
            icon: 'tag'
          };
          newCategories.push(newParent);
          parentMap[parent] = newParent.id;
          existingParentNames.add(parent);
        } else if (parent && !parentMap[parent]) {
          const existing = categoryTree.parents.find(p => p.name === parent);
          if (existing) parentMap[parent] = existing.id;
        }
      });

      // Créer les enfants
      csvPreviewData.forEach(({ parent, child }) => {
        if (child && parentMap[parent]) {
          const existingChild = categories.find(c => 
            c.parentId === parentMap[parent] && c.name === child
          );
          
          if (!existingChild) {
            const newChild: Category = {
              id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: child,
              color: generateCategoryColor(child),
              icon: 'tag',
              parentId: parentMap[parent]
            };
            newCategories.push(newChild);
          }
        }
      });

      await updateCategories(newCategories);
      
      // 🆕 ÉVÉNEMENT DE SYNCHRONISATION
      window.dispatchEvent(new CustomEvent('categories-updated'));
      
      const newCount = csvPreviewData.filter(d => d.isNew).length;
      toast.success(`${newCount} catégorie(s) / sous-catégorie(s) importée(s)`);
      
      setShowCSVPreview(false);
      setCSVPreviewData([]);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Erreur lors de l\'import');
    }
  }, [csvPreviewData, categories, categoryTree, updateCategories]);

  // ========================================
  // RÉASSIGNATION EN MASSE
  // ========================================
  const handleConfirmReassign = useCallback(async () => {
    if (!reassignTarget || selectedForReassign.size === 0) return;

    try {
      const updatedTransactions = transactions.map(t => {
        let shouldReassign = false;

        // Vérifier si la transaction correspond à l'une des catégories sélectionnées
        selectedForReassign.forEach(selectedId => {
          const category = categories.find(c => c.id === selectedId);
          if (!category) return;

          if (category.parentId) {
            // C'est une sous-catégorie
            const parent = categories.find(c => c.id === category.parentId);
            if (parent && t.category === parent.name && (t as any).subCategory === category.name) {
              shouldReassign = true;
            }
          } else {
            // C'est une catégorie principale
            if (t.category === category.name) {
              shouldReassign = true;
            }
          }
        });

        if (shouldReassign) {
          return {
            ...t,
            category: reassignTarget.category,
            subCategory: reassignTarget.subCategory || ''
          };
        }
        return t;
      });

      const count = updatedTransactions.filter((t, i) => t !== transactions[i]).length;
      await updateTransactions(updatedTransactions);
      
      // 🆕 ÉVÉNEMENT DE SYNCHRONISATION
      window.dispatchEvent(new CustomEvent('categories-updated'));
      
      toast.success(`${count} transaction${count > 1 ? 's' : ''} réassignée${count > 1 ? 's' : ''}`);
      setShowReassignDialog(false);
      setSelectedForReassign(new Set());
      setReassignTarget(null);
    } catch (error) {
      console.error('Reassign error:', error);
      toast.error('Erreur lors de la réassignation');
    }
  }, [reassignTarget, selectedForReassign, transactions, categories, updateTransactions]);

  const getTotalTransactionsForSelected = useMemo(() => {
    let total = 0;
    selectedForReassign.forEach(selectedId => {
      const category = categories.find(c => c.id === selectedId);
      if (!category) return;

      if (category.parentId) {
        const parent = categories.find(c => c.id === category.parentId);
        if (parent) {
          total += categoryTransactionCounts[`${parent.name}__${category.name}`] || 0;
        }
      } else {
        total += categoryTransactionCounts[category.name] || 0;
      }
    });
    return total;
  }, [selectedForReassign, categories, categoryTransactionCounts]);

  // ========================================
  // SUPPRESSION INTELLIGENTE
  // ========================================
  const canDeleteCategory = useCallback((category: Category) => {
    // Si c'est une catégorie parente
    if (!category.parentId) {
      const children = categoryTree.children[category.id] || [];
      
      // Vérifier si toutes les sous-catégories sont inutilisées
      const hasUsedChildren = children.some(child => {
        const count = categoryTransactionCounts[`${category.name}__${child.name}`] || 0;
        return count > 0;
      });

      if (hasUsedChildren) {
        return { canDelete: false, reason: 'Au moins une sous-catégorie contient des transactions' };
      }

      // Vérifier si la catégorie parente elle-même est utilisée
      const parentCount = categoryTransactionCounts[category.name] || 0;
      if (parentCount > 0) {
        return { canDelete: false, reason: `${parentCount} transaction${parentCount > 1 ? 's' : ''} utilisent cette catégorie` };
      }

      return { canDelete: true, reason: '' };
    } else {
      // C'est une sous-catégorie
      const parent = categories.find(c => c.id === category.parentId);
      if (!parent) return { canDelete: true, reason: '' };

      const count = categoryTransactionCounts[`${parent.name}__${category.name}`] || 0;
      if (count > 0) {
        return { canDelete: false, reason: `${count} transaction${count > 1 ? 's' : ''} utilisent cette sous-catégorie` };
      }

      return { canDelete: true, reason: '' };
    }
  }, [categoryTree, categories, categoryTransactionCounts]);

  const handleDeleteCategory = useCallback(async (category: Category) => {
    const { canDelete, reason } = canDeleteCategory(category);
    
    if (!canDelete) {
      toast.error(`Impossible de supprimer : ${reason}. Utilisez la réassignation rapide d'abord.`, { duration: 6000 });
      return;
    }

    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  }, [canDeleteCategory]);

  const confirmDelete = useCallback(async () => {
    if (!categoryToDelete) return;

    try {
      let updatedCategories = categories.filter(c => c.id !== categoryToDelete.id);
      
      // Si c'est une catégorie parente, supprimer aussi toutes ses sous-catégories inutilisées
      if (!categoryToDelete.parentId) {
        const children = categoryTree.children[categoryToDelete.id] || [];
        const childIdsToDelete = children.map(c => c.id);
        updatedCategories = updatedCategories.filter(c => !childIdsToDelete.includes(c.id));
      }

      await updateCategories(updatedCategories);
      
      // 🆕 ÉVÉNEMENT DE SYNCHRONISATION
      window.dispatchEvent(new CustomEvent('categories-updated'));
      
      toast.success('Catégorie supprimée');
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [categoryToDelete, categories, categoryTree, updateCategories]);

  // ========================================
  // SUPPRESSION EN MASSE
  // ========================================
  const [showMassDeleteConfirm, setShowMassDeleteConfirm] = useState(false);

  const handleMassDelete = useCallback(() => {
    // Vérifier que toutes les catégories sélectionnées sont supprimables
    const categoriesToCheck = Array.from(selectedForReassign)
      .map(id => categories.find(c => c.id === id))
      .filter((c): c is Category => c !== undefined);
    
    const unsuppressible = categoriesToCheck.filter(cat => {
      const { canDelete } = canDeleteCategory(cat);
      return !canDelete;
    });
    
    if (unsuppressible.length > 0) {
      toast.error(
        `${unsuppressible.length} catégorie(s) contiennent des transactions. Réassignez-les d'abord.`,
        { duration: 5000 }
      );
      return;
    }
    
    setShowMassDeleteConfirm(true);
  }, [selectedForReassign, categories, canDeleteCategory]);

  const confirmMassDelete = useCallback(async () => {
    try {
      let updatedCategories = categories.filter(c => !selectedForReassign.has(c.id));
      
      // Supprimer aussi les enfants des catégories parentes sélectionnées
      selectedForReassign.forEach(id => {
        const children = categoryTree.children[id] || [];
        children.forEach(child => {
          updatedCategories = updatedCategories.filter(c => c.id !== child.id);
        });
      });

      await updateCategories(updatedCategories);
      
      // 🆕 ÉVÉNEMENT DE SYNCHRONISATION
      window.dispatchEvent(new CustomEvent('categories-updated'));
      
      toast.success(`${selectedForReassign.size} catégorie(s) supprimée(s)`);
      setSelectedForReassign(new Set());
      setShowMassDeleteConfirm(false);
    } catch (error) {
      console.error('Mass delete error:', error);
      toast.error('Erreur lors de la suppression en masse');
    }
  }, [selectedForReassign, categories, categoryTree, updateCategories]);

  // ========================================
  // HANDLERS CATÉGORIES
  // ========================================
  const handleOpenAddDialog = useCallback(() => {
    setFormName('');
    setFormColor(generateCategoryColor(Date.now().toString()));
    setFormParentId('none');
    setEditingCategory(null);
    setKeepDialogOpen(false);
    setShowDialog(true);
  }, []);

  const handleOpenEditDialog = useCallback((category: Category) => {
    setFormName(category.name);
    setFormColor(category.color);
    setFormParentId(category.parentId || 'none');
    setEditingCategory(category);
    setKeepDialogOpen(false);
    setShowDialog(true);
  }, []);

  const handleSaveCategory = useCallback(async () => {
    if (!formName.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      let updatedCategories: Category[];
      const cleanName = formName.trim();
      const parentIdValue = formParentId === 'none' ? undefined : formParentId;

      if (editingCategory) {
        updatedCategories = categories.map((cat: Category) =>
          cat.id === editingCategory.id
            ? { ...cat, name: cleanName, color: formColor, parentId: parentIdValue }
            : cat
        );
        toast.success('Catégorie mise à jour');
      } else {
        const newCategory: Category = {
          id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: cleanName,
          color: formColor,
          icon: 'tag',
          ...(parentIdValue ? { parentId: parentIdValue } : {})
        };
        updatedCategories = [...categories, newCategory];
        toast.success(parentIdValue ? 'Sous-catégorie créée' : 'Catégorie créée');
      }

      await updateCategories(updatedCategories);
      window.dispatchEvent(new CustomEvent('categories-updated'));
      
      if (keepDialogOpen && !editingCategory) {
        // ⚡️ OPTIMISATION : Reset direct sans setTimeout (mémoïsation correcte du Select)
        setFormName('');
        setFormColor(generateCategoryColor(Date.now().toString()));
        // 🎯 UX AMÉLIORÉE : On garde le parent sélectionné pour ajouter plusieurs sous-catégories
        // Si vous voulez reset le parent, décommentez la ligne suivante :
        // setFormParentId('none');
      } else {
        setShowDialog(false);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [formName, formColor, formParentId, editingCategory, categories, updateCategories, keepDialogOpen]);

  const toggleExpand = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectForReassign = useCallback((categoryId: string) => {
    setSelectedForReassign(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Sélectionner/Désélectionner tout
  const toggleSelectAll = useCallback(() => {
    if (selectedForReassign.size === categories.length) {
      // Tout désélectionner
      setSelectedForReassign(new Set());
    } else {
      // Tout sélectionner
      setSelectedForReassign(new Set(categories.map(c => c.id)));
    }
  }, [selectedForReassign.size, categories]);

  // Vérifier si tout est sélectionné
  const isAllSelected = useMemo(() => {
    return categories.length > 0 && selectedForReassign.size === categories.length;
  }, [selectedForReassign.size, categories.length]);

  // Vérifier si sélection partielle
  const isPartiallySelected = useMemo(() => {
    return selectedForReassign.size > 0 && selectedForReassign.size < categories.length;
  }, [selectedForReassign.size, categories.length]);

  const availableColors = useMemo(() => [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
    '#6366F1', '#84CC16', '#06B6D4', '#A855F7'
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderTree className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-lg font-medium text-white/90">Gestion des catégories</h2>
            <p className="text-xs text-white/40">Organisez et suivez vos catégorisations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCategories}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/90 rounded-lg px-3 py-2 text-sm font-medium transition-all"
            title="Importer des catégories (CSV)"
          >
            <Upload className="w-4 h-4" />
            Importer
          </button>
          <button
            onClick={handleExportCategories}
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/90 rounded-lg px-3 py-2 text-sm font-medium transition-all"
            title="Exporter les catégories (CSV)"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button
            onClick={() => setShowMaslowAnalysis(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 rounded-lg px-3 py-2 text-sm font-medium transition-all"
            title="Analyse psychologique Maslow"
          >
            <Brain className="w-4 h-4" />
            Analyse Maslow
          </button>
          {selectedForReassign.size > 0 && (
            <MassActionMenu
              selectedCount={selectedForReassign.size}
              transactionCount={getTotalTransactionsForSelected}
              onReassign={() => setShowReassignDialog(true)}
              onDelete={handleMassDelete}
            />
          )}
          <button
            onClick={handleOpenAddDialog}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-lg shadow-cyan-500/25"
          >
            <Plus className="w-4 h-4" />
            Nouvelle catégorie
          </button>
        </div>
      </div>

      {/* STATISTIQUES DE COMPLÉTION */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-light text-white/90">{completionStats.total}</div>
          </div>
          <div className="text-xs font-medium text-white/60">Total transactions</div>
        </div>

        {/* Complètes */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div className="text-2xl font-light text-green-400">{completionStats.fullyCompleted}</div>
          </div>
          <div className="text-xs font-medium text-white/60 mb-2">Complètes (cat + sous-cat)</div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${completionStats.total > 0 ? (completionStats.fullyCompleted / completionStats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Partielles */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <TrendingUp className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-light text-orange-400">{completionStats.partiallyCompleted}</div>
          </div>
          <div className="text-xs font-medium text-white/60 mb-2">Partielles (seulement cat)</div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
              style={{ width: `${completionStats.total > 0 ? (completionStats.partiallyCompleted / completionStats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Non catégorisées */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-light text-red-400">{completionStats.uncategorized}</div>
          </div>
          <div className="text-xs font-medium text-white/60 mb-2">Non catégorisées</div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-500"
              style={{ width: `${completionStats.total > 0 ? (completionStats.uncategorized / completionStats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Taux de complétion global */}
      <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-medium text-white/90">Taux de complétion global</div>
              <div className="text-xs text-white/40">Transactions avec catégorie ET sous-catégorie</div>
            </div>
          </div>
          <div className="text-3xl font-light text-purple-400">{completionRate}%</div>
        </div>
        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-700 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Categories list - SCROLL INTERNE LIMITÉ */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {categories.length > 0 && (
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate = isPartiallySelected;
                      }
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded bg-white/10 border border-white/20 text-purple-500 focus:ring-purple-500/50 cursor-pointer"
                    title={isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
                  />
                </div>
              )}
              <div className="text-sm font-medium text-white/90">
                {categoryTree.parents.length} catégorie{categoryTree.parents.length > 1 ? 's' : ''}
              </div>
            </div>
            {selectedForReassign.size > 0 && (
              <div className="text-xs text-purple-400">
                {selectedForReassign.size} sélectionnée{selectedForReassign.size > 1 ? 's' : ''} • {getTotalTransactionsForSelected} transaction{getTotalTransactionsForSelected > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
        
        {categoryTree.parents.length === 0 ? (
          <div className="text-center py-12 px-6">
            <FolderTree className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <p className="text-white/60 mb-4">Aucune catégorie pour le moment</p>
            <button
              onClick={handleOpenAddDialog}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
            >
              Créer votre première catégorie
            </button>
          </div>
        ) : (
          <div 
            className="overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent p-2"
            style={{ maxHeight: '420px' }}
          >
            <div className="space-y-2">
              {categoryTree.parents.map((parent) => {
                const parentCount = categoryTransactionCounts[parent.name] || 0;
                const hasChildren = categoryTree.children[parent.id]?.length > 0;
                const isSelected = selectedForReassign.has(parent.id);
                const { canDelete } = canDeleteCategory(parent);

                return (
                  <div key={parent.id} className={`border rounded-lg overflow-hidden transition-all ${
                    isSelected ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10'
                  }`}>
                    {/* Parent */}
                    <div className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectForReassign(parent.id)}
                          className="w-4 h-4 rounded bg-white/10 border border-white/20 text-purple-500 focus:ring-purple-500/50 cursor-pointer"
                        />
                        {hasChildren && (
                          <button
                            onClick={() => toggleExpand(parent.id)}
                            className="text-white/60 hover:text-white/90 transition-colors"
                          >
                            {expandedCategories.has(parent.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${parent.color}20`, borderColor: parent.color, borderWidth: '1px' }}
                        >
                          <Tag className="w-4 h-4" style={{ color: parent.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white/90">{parent.name}</span>
                            {parentCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-[10px] font-bold border border-cyan-500/30">
                                {parentCount}
                              </span>
                            )}
                          </div>
                          {hasChildren && (
                            <div className="text-xs text-white/40">
                              {categoryTree.children[parent.id].length} sous-catégorie{categoryTree.children[parent.id].length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditDialog(parent)}
                          className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-cyan-400 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(parent)}
                          className={`p-2 hover:bg-white/5 rounded-lg transition-colors ${
                            canDelete 
                              ? 'text-white/60 hover:text-red-400'
                              : 'text-white/30 cursor-not-allowed'
                          }`}
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Children */}
                    <AnimatePresence>
                      {expandedCategories.has(parent.id) && categoryTree.children[parent.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-white/10"
                        >
                          {categoryTree.children[parent.id].map((child) => {
                            const childCount = categoryTransactionCounts[`${parent.name}__${child.name}`] || 0;
                            const isChildSelected = selectedForReassign.has(child.id);
                            const { canDelete: canDeleteChild } = canDeleteCategory(child);

                            return (
                              <div 
                                key={child.id}
                                className={`flex items-center justify-between p-3 pl-12 bg-black/20 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 ${
                                  isChildSelected ? 'bg-purple-500/10' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isChildSelected}
                                    onChange={() => toggleSelectForReassign(child.id)}
                                    className="w-4 h-4 rounded bg-white/10 border border-white/20 text-purple-500 focus:ring-purple-500/50 cursor-pointer"
                                  />
                                  <div 
                                    className="w-6 h-6 rounded flex items-center justify-center"
                                    style={{ backgroundColor: `${child.color}20`, borderColor: child.color, borderWidth: '1px' }}
                                  >
                                    <Tag className="w-3 h-3" style={{ color: child.color }} />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-white/90">{child.name}</span>
                                    {childCount > 0 && (
                                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold border border-purple-500/30">
                                        {childCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditDialog(child)}
                                    className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-cyan-400 transition-colors"
                                    title="Modifier"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(child)}
                                    className={`p-1.5 hover:bg-white/5 rounded transition-colors ${
                                      canDeleteChild 
                                        ? 'text-white/60 hover:text-red-400'
                                        : 'text-white/30 cursor-not-allowed'
                                    }`}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dialog - Création/Édition avec ModernSelect */}
      <AnimatePresence>
        {showDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDialog(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div>
                  <h3 className="text-base font-medium text-white/90">
                    {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {editingCategory ? 'Modifiez les informations' : 'Créez une nouvelle catégorie'}
                  </p>
                </div>
                <button
                  onClick={() => setShowDialog(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-white/60 hover:text-white/90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Nom */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">Nom</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Alimentation, Transport..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/30 backdrop-blur-xl"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && formName.trim()) {
                        handleSaveCategory();
                      }
                    }}
                  />
                </div>

                {/* Catégorie parente - ModernSelect 
                    🚨 CRITIQUE : key={categories.length} force React à recréer le composant
                    quand le nombre de catégories change. C'est notre filet de sécurité
                    qui garantit que les nouvelles catégories parentes apparaissent immédiatement.
                */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">Catégorie parente</label>
                  <ModernCategorySelect
                    key={categories.length}
                    value={formParentId}
                    options={parentCategories}
                    onChange={setFormParentId}
                    placeholder="Aucune (catégorie principale)"
                    excludeId={editingCategory?.id}
                  />
                </div>

                {/* Couleur */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">Couleur</label>
                  <div className="flex gap-2 flex-wrap">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormColor(color)}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          formColor === color 
                            ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-[#0A0A0A] scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Continuer à ajouter */}
                {!editingCategory && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="keepOpen"
                      checked={keepDialogOpen}
                      onChange={(e) => setKeepDialogOpen(e.target.checked)}
                      className="w-4 h-4 rounded bg-white/5 border border-white/10 text-cyan-500 focus:ring-cyan-500/50"
                    />
                    <label htmlFor="keepOpen" className="text-xs text-white/60 cursor-pointer select-none">
                      Continuer à ajouter des catégories
                    </label>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
                >
                  {keepDialogOpen ? 'Fermer' : 'Annuler'}
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={!formName.trim()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    formName.trim()
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingCategory ? 'Mettre à jour' : keepDialogOpen ? 'Créer & Continuer' : 'Créer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dialog - Confirmation de suppression */}
      <AnimatePresence>
        {showDeleteConfirm && categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0A0A]/95 backdrop-blur-2xl border border-red-500/30 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-red-500/10">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-white/90">Confirmer la suppression</h3>
                  <p className="text-xs text-white/40 mt-0.5">Cette action est irréversible</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-white/60 hover:text-white/90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4">
                <p className="text-sm text-white/70 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer <span className="font-medium text-white/90">"{categoryToDelete.name}"</span> ?
                </p>
                {!categoryToDelete.parentId && categoryTree.children[categoryToDelete.id]?.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-orange-400">
                      ⚠️ Toutes les sous-catégories seront également supprimées ({categoryTree.children[categoryToDelete.id].length})
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white text-sm font-medium transition-all shadow-lg shadow-red-500/25"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dialog - Réassignation avec confirmation */}
      <AnimatePresence>
        {showReassignDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReassignDialog(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0A0A]/95 backdrop-blur-2xl border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <RefreshCw className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-white/90">Réassignation rapide</h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    {selectedForReassign.size} catégorie{selectedForReassign.size > 1 ? 's' : ''} • {getTotalTransactionsForSelected} transaction{getTotalTransactionsForSelected > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowReassignDialog(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-white/60 hover:text-white/90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="text-xs text-white/40 mb-2">Catégories sources</div>
                  <div className="space-y-1">
                    {Array.from(selectedForReassign).slice(0, 3).map(id => {
                      const cat = categories.find(c => c.id === id);
                      if (!cat) return null;
                      return (
                        <div key={id} className="text-sm text-white/90">• {cat.name}</div>
                      );
                    })}
                    {selectedForReassign.size > 3 && (
                      <div className="text-xs text-white/40">... et {selectedForReassign.size - 3} autres</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60">Destination</label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 bg-white/5 border border-white/10 rounded-lg p-2">
                    {categoryTree.parents.map((parent) => (
                      <div key={parent.id} className="space-y-1">
                        <button
                          onClick={() => setReassignTarget({ category: parent.name })}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-all text-left ${
                            reassignTarget?.category === parent.name && !reassignTarget.subCategory
                              ? 'bg-purple-500/20 border border-purple-500/30'
                              : 'border border-white/10'
                          }`}
                        >
                          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${parent.color}20`, borderColor: parent.color, borderWidth: '1px' }}>
                            <Tag className="w-3 h-3" style={{ color: parent.color }} />
                          </div>
                          <span className="text-sm text-white/90">{parent.name}</span>
                          {reassignTarget?.category === parent.name && !reassignTarget.subCategory && (
                            <CheckCircle2 className="w-4 h-4 text-purple-400 ml-auto" />
                          )}
                        </button>
                        
                        {categoryTree.children[parent.id]?.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => setReassignTarget({ category: parent.name, subCategory: child.name })}
                            className={`w-full flex items-center gap-2 p-2 pl-8 rounded-lg hover:bg-white/10 transition-all text-left ${
                              reassignTarget?.category === parent.name && reassignTarget?.subCategory === child.name
                                ? 'bg-purple-500/20 border border-purple-500/30'
                                : 'border border-white/10'
                            }`}
                          >
                            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: `${child.color}20`, borderColor: child.color, borderWidth: '1px' }}>
                              <Tag className="w-2.5 h-2.5" style={{ color: child.color }} />
                            </div>
                            <span className="text-xs text-white/90">{child.name}</span>
                            {reassignTarget?.category === parent.name && reassignTarget?.subCategory === child.name && (
                              <CheckCircle2 className="w-4 h-4 text-purple-400 ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <button
                  onClick={() => setShowReassignDialog(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmReassign}
                  disabled={!reassignTarget}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    reassignTarget
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                >
                  Confirmer ({getTotalTransactionsForSelected} transaction{getTotalTransactionsForSelected > 1 ? 's' : ''})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dialog - Analyse Maslow */}
      <AnimatePresence>
        {showMaslowAnalysis && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMaslowAnalysis(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-6xl bg-[#0A0A0A] border border-purple-500/20 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <Brain className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-white/90">Analyse psychologique des finances</h3>
                  <p className="text-xs text-white/40 mt-0.5">Pyramide de Maslow • Équilibre de vie</p>
                </div>
                <button
                  onClick={() => setShowMaslowAnalysis(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white/90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <MaslowPyramid transactions={transactions} categories={categories} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Preview Modal */}
      <AnimatePresence>
        {showCSVPreview && (
          <CSVPreviewModal
            isOpen={showCSVPreview}
            onClose={() => {
              setShowCSVPreview(false);
              setCSVPreviewData([]);
            }}
            onConfirm={handleConfirmCSVImport}
            data={csvPreviewData}
          />
        )}
      </AnimatePresence>

      {/* Dialog - Confirmation suppression en masse */}
      <AnimatePresence>
        {showMassDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMassDeleteConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0A0A] border border-red-500/30 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-red-500/5">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-medium text-white/90">Suppression en masse</h3>
                  <p className="text-xs text-white/40 mt-0.5">Cette action est irréversible</p>
                </div>
                <button
                  onClick={() => setShowMassDeleteConfirm(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white/90"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <p className="text-sm text-white/70 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer <span className="font-medium text-white/90">{selectedForReassign.size} catégorie{selectedForReassign.size > 1 ? 's' : ''}</span> ?
                </p>
                
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <p className="text-xs text-orange-400 leading-relaxed">
                    ⚠️ Les sous-catégories liées seront également supprimées
                  </p>
                </div>

                <div className={`bg-white/5 border border-white/10 rounded-lg p-3 ${selectedForReassign.size > 7 ? 'max-h-[240px] overflow-y-auto' : ''} scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent`}>
                  <div className="text-xs text-white/40 mb-2">Catégories à supprimer :</div>
                  {Array.from(selectedForReassign).map(id => {
                    const cat = categories.find(c => c.id === id);
                    if (!cat) return null;
                    return (
                      <div key={id} className="text-sm text-white/90 py-1.5 border-b border-white/5 last:border-b-0">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>{cat.name}</span>
                          {cat.parentId && (
                            <span className="text-xs text-white/40">(sous-catégorie)</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <button
                  onClick={() => setShowMassDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmMassDelete}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white text-sm font-medium transition-all shadow-lg shadow-red-500/25"
                >
                  Supprimer ({selectedForReassign.size})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
