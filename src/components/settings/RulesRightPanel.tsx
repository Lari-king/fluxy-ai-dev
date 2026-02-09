/**
 * 📊 RULES RIGHT PANEL - REFONTE COMPLÈTE 2026
 * * Preview détaillée :
 * - Prise en charge de la hiérarchie des catégories
 * - Plus large (440px)
 * - Spacing aéré
 * - Visuels améliorés
 * - ✅ CORRECTIF : Normalisation ID -> Nom pour détection des sous-catégories
 * - 🔍 LOGS : Monitoring complet du moteur d'impact
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
import { Rule } from '@/types/rules';
import { useData } from '@/contexts/DataContext';
import { formatCurrency } from '@/utils/format';
import { evaluateRule } from '@/utils/ruleEngine';
import { useDebouncedValue } from '@/hooks/use-performance';

interface RulesRightPanelProps {
  rule: Rule | null;
  isCreating: boolean;
}

export function RulesRightPanel({ rule, isCreating }: RulesRightPanelProps) {
  const { transactions, categories } = useData();

  // ⚡ OPTIMISATION : On attend 500ms que l'utilisateur arrête de modifier la règle
  const debouncedRule = useDebouncedValue(rule, 500);

  // 🛠️ CRÉATION DU LOOKUP MAP (ID <-> NAME)
  const categoryLookup = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach(c => {
      map.set(c.id, c.name);
      map.set(c.name, c.name);
    });
    return map;
  }, [categories]);

  /**
   * 🔄 NORMALISATION CRUCIALE
   * Le moteur de règle compare rule.conditions.category avec transaction.category.
   * On s'assure que transaction.category contient le NOM de la sous-catégorie 
   * si elle existe, sinon le NOM de la catégorie parente.
   */
  const getNormalizedTransaction = (t: any) => {
    const mainCatName = categoryLookup.get(t.category) || t.category;
    
    let subCatName = "";
    if (typeof t.subCategory === 'object' && t.subCategory) {
      subCatName = t.subCategory.name;
    } else {
      subCatName = categoryLookup.get(t.subCategory) || t.subCategory || "";
    }

    return {
      ...t,
      // On écrase category par le nom de la sous-catégorie pour le matching de budget
      category: subCatName || mainCatName,
      originalCategory: t.category,
      originalSubCategory: t.subCategory
    };
  };

  const impact = useMemo(() => {
    if (!debouncedRule) {
      return { count: 0, amount: 0, percentage: 0 };
    }

    console.log('🔍 [RulesRightPanel] Calcul de l\'impact pour:', debouncedRule.name);
    console.time("Impact Calculation"); 
    
    let matchedSamples: any[] = [];

    const validTransactions = transactions.filter((t) => {
      const normalizedT = getNormalizedTransaction(t);
      const result = evaluateRule(debouncedRule, normalizedT, categories);
      
      if (result.matches && matchedSamples.length < 3) {
        matchedSamples.push({ 
          desc: t.description, 
          detectedAs: normalizedT.category,
          ruleTarget: debouncedRule.conditions?.category 
        });
      }

      return result.matches;
    });

    if (matchedSamples.length > 0) {
      console.table(matchedSamples);
    }

    const matchingCount = validTransactions.length;
    const totalAmount = validTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    console.timeEnd("Impact Calculation");

    return {
      count: matchingCount,
      amount: totalAmount,
      percentage: transactions.length > 0 ? (matchingCount / transactions.length) * 100 : 0,
    };
  }, [debouncedRule, transactions, categories, categoryLookup]);

  const recentMatches = useMemo(() => {
    if (!debouncedRule || impact.count === 0) return [];
    
    return transactions
      .filter(t => {
        const normalizedT = getNormalizedTransaction(t);
        return evaluateRule(debouncedRule, normalizedT, categories).matches;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [debouncedRule, transactions, impact.count, categories, categoryLookup]);

  if (!rule) {
    return (
      <div className="h-full flex items-center justify-center bg-black border-l border-white/10">
        <div className="text-center px-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Eye className="w-10 h-10 text-white/20" />
          </div>
          <p className="text-sm text-white/40">La prévisualisation apparaîtra ici</p>
          <p className="text-xs text-white/30 mt-2">Sélectionnez ou créez une règle</p>
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
            <Eye className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-medium text-white/90">Prévisualisation</h2>
            <p className="text-xs text-white/40 mt-0.5">Impact en temps réel</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Résumé de la règle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-5 ${
            rule.severity === 'error' ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30' :
            rule.severity === 'warning' ? 'bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30' :
            'bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              rule.severity === 'error' ? 'bg-red-500/20' :
              rule.severity === 'warning' ? 'bg-orange-500/20' :
              'bg-blue-500/20'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                rule.severity === 'error' ? 'text-red-400' :
                rule.severity === 'warning' ? 'text-orange-400' :
                'text-blue-400'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white/90 mb-2">{rule.name}</h3>
              {rule.description && (
                <p className="text-xs text-white/60 leading-relaxed mb-3">{rule.description}</p>
              )}
              
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  rule.enabled 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-white/10 text-white/60 border border-white/10'
                }`}>
                  {rule.enabled ? '✓ Active' : '○ Désactivée'}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs capitalize bg-white/5 text-white/60 border border-white/10">
                  {rule.severity}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section : Impact */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Impact estimé
          </h3>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs text-cyan-400/70 font-medium">Transactions détectées</div>
                <div className="text-xs text-cyan-400/50 mt-0.5">Sur l'historique complet</div>
              </div>
            </div>

            <div className="text-4xl font-light text-white/90 mb-2">{impact.count}</div>
            <div className="text-sm text-white/60 mb-4">
              {impact.percentage.toFixed(1)}% de vos transactions
            </div>

            <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(impact.percentage, 100)}%` }}
              />
            </div>

            {impact.amount !== 0 && (
              <div className="pt-4 border-t border-white/10">
                <div className="text-xs text-white/60 mb-1">Montant total impacté</div>
                <div className="text-2xl font-light text-white/90">
                  {formatCurrency(Math.abs(impact.amount))}
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-4 h-4 text-white/60" />
              <span className="text-xs font-medium text-white/60">Période d'analyse</span>
            </div>
            <div className="text-sm text-white/90">{transactions.length} transactions</div>
            <div className="text-xs text-white/40 mt-1">Base de données complète</div>
          </motion.div>
        </div>

        {/* Section : Actions */}
        {rule.actions && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              Actions automatiques
            </h3>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4"
            >
              {rule.actions.markAsAnomaly ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Marquer comme anomalie</div>
                    <div className="text-xs text-white/40 mt-1 leading-relaxed">
                      Les transactions détectées seront visibles dans la section Anomalies
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
              ) : (
                <div className="flex items-start gap-3 opacity-40">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white/40">Marquer comme anomalie</div>
                    <div className="text-xs text-white/30 mt-1">Désactivé</div>
                  </div>
                </div>
              )}

              {rule.actions.notifyUser ? (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90">Notification push</div>
                    <div className="text-xs text-white/40 mt-1 leading-relaxed">
                      Alerte instantanée lors de chaque détection
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
              ) : (
                <div className="flex items-start gap-3 opacity-40">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-white/40">Notification push</div>
                    <div className="text-xs text-white/30 mt-1">Désactivé</div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* EXEMPLES RÉCENTS */}
        {recentMatches.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
              Exemples détectés
            </h3>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              {recentMatches.map(t => (
                <div key={t.id} className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/90 truncate font-medium">{t.description}</div>
                      <div className="text-xs text-white/40 mt-1">
                        {new Date(t.date).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                    <span className={`text-sm font-medium flex-shrink-0 ${
                      t.amount < 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        )}

        {/* Conseil intelligent */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-xl p-5"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-cyan-300 mb-2">Conseil intelligent</div>
              <div className="text-xs text-cyan-400/70 leading-relaxed">
                {isCreating 
                  ? "Cette règle sera appliquée immédiatement à toutes vos transactions."
                  : impact.count > 0 
                    ? `Cette règle a détecté ${impact.count} transaction${impact.count > 1 ? 's' : ''}. Ajustez les seuils pour affiner la détection.`
                    : "Aucune transaction détectée. Si vous avez sélectionné une catégorie parente, vérifiez que vos transactions sont bien classées dedans."
                }
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}