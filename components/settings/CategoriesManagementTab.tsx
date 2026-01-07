/**
 * 🏷️ CATEGORIES MANAGEMENT TAB - VERSION 2026
 * 
 * Design harmonisé :
 * - Arborescence élégante avec animations
 * - Formulaire modal optimisé
 * - Performance avec useMemo/useCallback
 */

import { useState, useMemo, useCallback } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { toast } from 'sonner';
import { generateCategoryColor } from '../../src/utils/categories';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  emoji?: string;
  parentId?: string;
}

export function CategoriesManagementTab() {
  const { categories, updateCategories } = useData();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Form state
  const [formName, setFormName] = useState('');
  const [formColor, setFormColor] = useState('#3B82F6');
  const [formEmoji, setFormEmoji] = useState('');
  const [formParentId, setFormParentId] = useState<string>('none');

  // Organiser en arbre
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

  const handleOpenAddDialog = useCallback(() => {
    setFormName('');
    setFormColor(generateCategoryColor(Date.now().toString()));
    setFormEmoji('');
    setFormParentId('none');
    setEditingCategory(null);
    setShowDialog(true);
  }, []);

  const handleOpenEditDialog = useCallback((category: Category) => {
    setFormName(category.name);
    setFormColor(category.color);
    setFormEmoji(category.emoji || '');
    setFormParentId(category.parentId || 'none');
    setEditingCategory(category);
    setShowDialog(true);
  }, []);

  const handleSaveCategory = useCallback(async () => {
    if (!formName.trim()) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      let updatedCategories: Category[];

      if (editingCategory) {
        updatedCategories = categories.map((cat: Category) =>
          cat.id === editingCategory.id
            ? { 
                ...cat, 
                name: formName.trim(), 
                color: formColor,
                emoji: formEmoji,
                parentId: formParentId === 'none' ? undefined : formParentId 
              }
            : cat
        );
        toast.success('Catégorie mise à jour');
      } else {
        const newCategory: Category = {
          id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: formName.trim(),
          color: formColor,
          icon: 'tag',
          emoji: formEmoji,
          ...(formParentId !== 'none' ? { parentId: formParentId } : {})
        };
        updatedCategories = [...categories, newCategory];
        toast.success(formParentId !== 'none' ? 'Sous-catégorie créée' : 'Catégorie créée');
      }

      await updateCategories(updatedCategories);
      setShowDialog(false);
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, [formName, formColor, formEmoji, formParentId, editingCategory, categories, updateCategories]);

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    const hasChildren = categories.some((cat: Category) => cat.parentId === categoryId);
    
    if (hasChildren) {
      toast.error('Impossible de supprimer une catégorie qui contient des sous-catégories');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    try {
      const updatedCategories = categories.filter((cat: Category) => cat.id !== categoryId);
      await updateCategories(updatedCategories);
      toast.success('Catégorie supprimée');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erreur lors de la suppression');
    }
  }, [categories, updateCategories]);

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
            <p className="text-xs text-white/40">Organisez vos transactions par catégories</p>
          </div>
        </div>
        <button
          onClick={handleOpenAddDialog}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all shadow-lg shadow-cyan-500/25"
        >
          <Plus className="w-4 h-4" />
          Nouvelle catégorie
        </button>
      </div>

      {/* Categories list */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        {categoryTree.parents.length === 0 ? (
          <div className="text-center py-12">
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
          <div className="space-y-2">
            {categoryTree.parents.map((parent) => (
              <div key={parent.id} className="border border-white/10 rounded-lg overflow-hidden">
                {/* Parent */}
                <div className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    {categoryTree.children[parent.id]?.length > 0 && (
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
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${parent.color}20` }}
                    >
                      {parent.emoji || <Tag className="w-4 h-4" style={{ color: parent.color }} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/90">{parent.name}</div>
                      {categoryTree.children[parent.id]?.length > 0 && (
                        <div className="text-xs text-white/40">
                          {categoryTree.children[parent.id].length} sous-catégorie{categoryTree.children[parent.id].length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditDialog(parent)}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-cyan-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(parent.id)}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-red-400 transition-colors"
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
                      {categoryTree.children[parent.id].map((child) => (
                        <div 
                          key={child.id}
                          className="flex items-center justify-between p-3 pl-12 bg-black/20 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded flex items-center justify-center text-sm"
                              style={{ backgroundColor: `${child.color}20` }}
                            >
                              {child.emoji || <Tag className="w-3 h-3" style={{ color: child.color }} />}
                            </div>
                            <div className="text-sm text-white/90">{child.name}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditDialog(child)}
                              className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-cyan-400 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(child.id)}
                              className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
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
              className="relative w-full max-w-md bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-medium text-white/90">
                    {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                  </h3>
                  <p className="text-xs text-white/40">
                    {editingCategory ? 'Modifiez les informations' : 'Créez une nouvelle catégorie'}
                  </p>
                </div>
                <button
                  onClick={() => setShowDialog(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white/90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Nom */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60">Nom</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Alimentation, Transport..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                    autoFocus
                  />
                </div>

                {/* Emoji */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60">Emoji (optionnel)</label>
                  <input
                    value={formEmoji}
                    onChange={(e) => setFormEmoji(e.target.value)}
                    placeholder="🍔"
                    maxLength={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-lg text-center focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all placeholder:text-white/30"
                  />
                </div>

                {/* Catégorie parente */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60">Catégorie parente</label>
                  <select
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/90 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all appearance-none cursor-pointer"
                  >
                    <option value="none" className="bg-black">Aucune (catégorie principale)</option>
                    {categoryTree.parents
                      .filter((cat: Category) => !editingCategory || cat.id !== editingCategory.id)
                      .map((cat: Category) => (
                        <option key={cat.id} value={cat.id} className="bg-black">
                          {cat.emoji} {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Couleur */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-white/60">Couleur</label>
                  <div className="flex gap-2 flex-wrap">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setFormColor(color)}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          formColor === color 
                            ? 'ring-2 ring-cyan-500 scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-5 py-2.5 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={!formName.trim()}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    formName.trim()
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-white/5 text-white/30 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingCategory ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
