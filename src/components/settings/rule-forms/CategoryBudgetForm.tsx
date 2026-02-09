import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, DollarSign, Info } from 'lucide-react';
import { RuleConditions, RulePeriod, CategoryBudgetConditions } from '@/types/rules';
import { useData } from '@/contexts/DataContext';

interface CategoryBudgetFormProps {
  conditions: RuleConditions;
  onChange: (conditions: RuleConditions) => void;
}

const ModernHierarchicalSelect = memo(
  ({
    value,
    onChange,
    organizedCategories,
    placeholder = 'Sélectionner...',
  }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCat = useMemo(() => {
      for (const parent of organizedCategories) {
        if (parent.name === value) return parent;
        const child = parent.children.find((c: any) => c.name === value);
        if (child) return child;
      }
      return null;
    }, [value, organizedCategories]);

    return (
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition-all outline-none focus:border-purple-500/50"
        >
          <span className="flex items-center gap-2">
            {selectedCat ? (
              <>
                <span className="text-lg leading-none">{selectedCat.emoji}</span>
                <span className="font-medium text-white">{selectedCat.name}</span>
              </>
            ) : (
              <span className="text-white/30">{placeholder}</span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-white/40 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute z-[100] w-full mt-2 bg-[#1A1A1A]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                {organizedCategories.map((parent: any) => (
                  <div key={parent.id} className="space-y-0.5">
                    <button
                      onClick={() => {
                        console.group('🔵 Sélection catégorie parent');
                        console.log('Nom sélectionné :', parent.name);
                        console.log('Est sous-catégorie ?', false);
                        console.groupEnd();
                        onChange(parent.name, false);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        value === parent.name
                          ? 'bg-purple-500/20 text-white border border-purple-500/30'
                          : 'text-purple-300/90 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-base">{parent.emoji}</span>
                      <span className="flex-1 text-left font-bold uppercase tracking-wider text-xs">
                        {parent.name}
                      </span>
                      {value === parent.name && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {parent.children.map((child: any) => (
                      <button
                        key={child.id}
                        onClick={() => {
                          console.group('🟣 Sélection sous-catégorie');
                          console.log('Nom sélectionné :', child.name);
                          console.log('Parent :', parent.name);
                          console.log('Est sous-catégorie ?', true);
                          console.groupEnd();
                          onChange(child.name, true);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 pl-8 pr-3 py-2 rounded-lg text-sm transition-all ${
                          value === child.name
                            ? 'bg-purple-500/20 text-white border border-purple-500/30'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="text-white/20">↳</span>
                        <span className="text-base">{child.emoji}</span>
                        <span className="flex-1 text-left truncate">{child.name}</span>
                        {value === child.name && (
                          <Check className="w-3.5 h-3.5 text-purple-400" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

export function CategoryBudgetForm({ conditions, onChange }: CategoryBudgetFormProps) {
  // Cast typé : on sait que ce formulaire est pour une règle category_budget
  const budgetCond = conditions as CategoryBudgetConditions;

  const { categories } = useData();
  const [localAmount, setLocalAmount] = useState<string>(
    budgetCond.maxAmount?.toString() || ''
  );

  useEffect(() => {
    setLocalAmount(budgetCond.maxAmount?.toString() || '');
  }, [budgetCond.maxAmount]);

  const organizedCategories = useMemo(() => {
    const parents = categories
      .filter((cat) => !cat.parentId)
      .sort((a, b) => a.name.localeCompare(b.name));

    return parents.map((parent) => ({
      ...parent,
      children: categories
        .filter((child) => child.parentId === parent.id)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }, [categories]);

  const handleAmountBlur = useCallback(() => {
    const val = parseFloat(localAmount);
    if (!isNaN(val)) {
      onChange({ ...budgetCond, maxAmount: val });
    }
  }, [localAmount, budgetCond, onChange]);

  // Debug console
  useEffect(() => {
    console.groupCollapsed('📊 État actuel des conditions (CategoryBudgetForm)');
    console.log('conditions reçues :', JSON.stringify(budgetCond, null, 2));
    console.log('Valeur affichée dans le select :', budgetCond.subCategory || budgetCond.category || '(vide)');
    console.log('subCategory stockée :', budgetCond.subCategory || '(non défini)');
    console.groupEnd();
  }, [budgetCond]);

  const handleCategorySelect = (name: string, isSub: boolean) => {
    console.group('→ Changement de cible budget');
    console.log('Nouvelle sélection :', name);
    console.log('Type :', isSub ? 'Sous-catégorie' : 'Catégorie principale');

    let newConditions: CategoryBudgetConditions;

    if (isSub) {
      // On priorise subCategory (comme tu l'as choisi)
      newConditions = { ...budgetCond, subCategory: name };
      // Si tu veux aussi garder la catégorie parent, ajoute un état local pour le parent
    } else {
      newConditions = { ...budgetCond, category: name, subCategory: undefined };
    }

    console.log('Nouvelles conditions envoyées :', newConditions);
    console.groupEnd();

    onChange(newConditions);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest ml-1">
          Cible du budget (Catégorie ou Sous-catégorie)
        </label>
        <ModernHierarchicalSelect
          value={budgetCond.subCategory || budgetCond.category || ''}
          onChange={handleCategorySelect}
          organizedCategories={organizedCategories}
          placeholder="Choisir une catégorie ou sous-catégorie..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest ml-1">
            Budget Max (€)
          </label>
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-purple-400 transition-colors">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              type="number"
              value={localAmount}
              onChange={(e) => setLocalAmount(e.target.value)}
              onBlur={handleAmountBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleAmountBlur()}
              placeholder="0.00"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest ml-1">
            Fréquence
          </label>
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
            {(['daily', 'weekly', 'monthly'] as RulePeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onChange({ ...budgetCond, period: p })}
                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-tighter rounded-lg transition-all ${
                  budgetCond.period === p
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {p === 'daily' ? 'Jour' : p === 'weekly' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bloc debug visible temporaire — à supprimer après validation */}
      <div className="p-3 bg-gray-900/60 border border-gray-700 rounded-xl text-xs font-mono text-cyan-300">
        <strong>Debug conditions actuelles :</strong><br />
        category: <span className="text-white">{budgetCond.category || '—'}</span><br />
        subCategory: <span className="text-white">{budgetCond.subCategory || '—'}</span><br />
        maxAmount: <span className="text-white">{budgetCond.maxAmount ?? '—'}</span><br />
        period: <span className="text-white">{budgetCond.period || '—'}</span>
      </div>

      <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex gap-3">
        <div className="mt-0.5">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Info className="w-3.5 h-3.5 text-purple-400" />
          </div>
        </div>
        <p className="text-[12px] text-purple-200/60 leading-relaxed italic">
          Le moteur détectera toute transaction dont la catégorie <strong>ou sous-catégorie</strong>{' '}
          correspond au nom sélectionné.
        </p>
      </div>
    </div>
  );
}