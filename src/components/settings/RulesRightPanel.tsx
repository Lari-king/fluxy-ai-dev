/**
 * 📊 RULES RIGHT PANEL - VERSION CORRIGÉE 2026
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  TrendingUp, 
  AlertTriangle, 
  Zap,
  Clock,
  Sparkles,
  CheckCircle2,
  Activity,
  BarChart3
} from 'lucide-react';
import { Rule } from '@/features/intelligence/types';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/utils/format';
import { evaluateRule } from '@/features/intelligence/engine/rule-engine';
import { useDebouncedValue } from '@/hooks/use-performance';

interface RulesRightPanelProps {
  rule: Rule | null;
  isCreating: boolean;
}

export function RulesRightPanel({ rule, isCreating }: RulesRightPanelProps) {
  const { transactions, categories } = useData();

  // ⚡ On attend que l'utilisateur stabilise sa saisie
  const debouncedRule = useDebouncedValue(rule, 400);

  // 🛠️ Lookup pour traduire les IDs en Noms si nécessaire
  const categoryLookup = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(c => {
      map.set(c.id, c.name);
      if (c.children) {
        c.children.forEach((child: any) => map.set(child.id, child.name));
      }
    });
    return map;
  }, [categories]);

  /**
   * Normalise la transaction pour le moteur de calcul
   * On s'assure que 'category' contient le nom pour le matching de texte
   */
  const getNormalizedTransaction = (t: any) => {
    const mainCatName = categoryLookup.get(t.category) || t.category;
    const subCatName = t.subCategory 
      ? (typeof t.subCategory === 'object' ? t.subCategory.name : categoryLookup.get(t.subCategory) || t.subCategory)
      : null;

    return {
      ...t,
      // Le moteur compare souvent le string category
      category: subCatName || mainCatName,
    };
  };

  const impact = useMemo(() => {
    if (!debouncedRule || !transactions.length) {
      return { count: 0, amount: 0, percentage: 0, matches: [] };
    }

    const matchedTransactions = transactions.filter((t) => {
      const normalizedT = getNormalizedTransaction(t);
      // ✅ Correction : evaluateRule renvoie { isViolation: boolean }
      const result = evaluateRule(debouncedRule as any, normalizedT);
      return result.isViolation;
    });

    const matchingCount = matchedTransactions.length;
    const totalAmount = matchedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      count: matchingCount,
      amount: totalAmount,
      percentage: (matchingCount / transactions.length) * 100,
      matches: matchedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3)
    };
  }, [debouncedRule, transactions, categoryLookup]);

  if (!rule) {
    return (
      <div className="h-full flex items-center justify-center bg-black border-l border-white/10">
        <div className="text-center px-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Eye className="w-10 h-10 text-white/20" />
          </div>
          <p className="text-sm text-white/40 font-medium">Analyse d'impact</p>
          <p className="text-xs text-white/20 mt-2 max-w-[200px]">Modifiez les conditions pour voir les transactions détectées en temps réel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin bg-black border-l border-white/10">
      
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 p-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-medium text-white/90">Impact estimé</h2>
            <p className="text-xs text-white/40 mt-0.5">Simulation sur {transactions.length} opérations</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Widget Impact Principal */}
        <motion.div
          key={impact.count}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-2xl p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-semibold text-white">{impact.count}</div>
              <div className="text-[10px] uppercase tracking-wider text-cyan-400/70 font-bold">Détections</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-white/40">Couverture data</span>
                <span className="text-white/90 font-medium">{impact.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(impact.percentage, 100)}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Volume financier</div>
              <div className="text-xl font-medium text-white/90">
                {formatCurrency(impact.amount)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Actions Actives */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">Actions configurées</h3>
          <div className="grid grid-cols-1 gap-2">
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${rule.actions?.markAsAnomaly ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-white/5 border-white/10 text-white/20'}`}>
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">Marquage Anomalie</span>
              {rule.actions?.markAsAnomaly && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-orange-400" />}
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${rule.actions?.sendNotification || rule.actions?.notifyUser ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/10 text-white/20'}`}>
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium">Notification Push</span>
              {(rule.actions?.sendNotification || rule.actions?.notifyUser) && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-blue-400" />}
            </div>
          </div>
        </div>

        {/* Liste des matchs récents */}
        {impact.matches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40">Échantillon détecté</h3>
              <span className="text-[10px] text-cyan-400/50">Dernières opérations</span>
            </div>
            <div className="space-y-2">
              {impact.matches.map((t, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={t.id} 
                  className="bg-white/5 border border-white/10 rounded-xl p-3"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white/90 truncate">{t.description}</div>
                      <div className="text-[10px] text-white/40 mt-1 uppercase">{t.category}</div>
                    </div>
                    <div className={`text-xs font-bold ${t.amount < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(t.amount)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Conseil contextuel */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-white/90 mb-1">Analyse du moteur</div>
              <p className="text-xs text-white/50 leading-relaxed">
                {impact.count === 0 
                  ? "Ajustez vos critères (montant, mots-clés ou catégorie) pour que la règle puisse identifier des transactions."
                  : `Cette règle est ${impact.count > 50 ? 'très large' : 'bien ciblée'}. Elle générera des alertes pour environ ${impact.percentage.toFixed(1)}% de votre flux.`
                }
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}