import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, ShieldAlert, Info, ChevronRight } from 'lucide-react';
import { useRules } from '@/contexts/RulesContext';
import { formatCurrency } from '@/utils/format';
import { parseTransactionDescription, ParsedTransaction } from '@/utils/transaction-parser';
import type { RuleViolation } from '../types'; // ✅ Import modulaire

/**
 * 🛡️ VIOLATIONS CARD - VERSION HAUTE FIDÉLITÉ CONNECTÉE
 * Design focus : Sévérité immédiate, clarté textuelle et hiérarchie visuelle.
 */
export const ViolationsCard = memo(function ViolationsCard({ 
  onFilterByTransaction 
}: { 
  onFilterByTransaction?: (id: string) => void 
}) {
  // Récupération des violations depuis le RulesContext (alimenté par les transactions réelles)
  const { violations } = useRules();

  // Calcul du résumé pour la gestion de l'affichage
  const summary = useMemo(() => {
    return {
      total: violations.length,
      critical: violations.filter(v => v.severity === 'error').length,
      warning: violations.filter(v => v.severity === 'warning').length,
      hasViolations: violations.length > 0
    };
  }, [violations]);

  // Groupement par sévérité pour la hiérarchie visuelle
  const groups = useMemo(() => ({
    critical: violations.filter(v => v.severity === 'error'),
    warning: violations.filter(v => v.severity === 'warning'),
    info: violations.filter(v => v.severity === 'info'),
  }), [violations]);

  if (!summary.hasViolations) return null;

  const renderGroup = (
    title: string, 
    items: RuleViolation[], 
    Icon: React.ComponentType<{ className?: string }>, 
    colorClass: string, 
    accentColor: string
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        {/* Header du groupe (Subtil) */}
        <div className={`flex items-center gap-2 px-1 text-[9px] font-black uppercase tracking-[0.2em] ${colorClass} opacity-80`}>
          <Icon className="w-3 h-3" /> {title} ({items.length})
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {items.map((v) => {
              const tx = v.transaction;
              // On utilise ton parser pour extraire le marchand et l'emoji
              const parsed: ParsedTransaction = parseTransactionDescription(tx?.description || '');
              
              // ✅ Sécurisation de l'emoji (fallback sur '💸')
              const displayEmoji = (parsed as any).emoji || '💸';

              return (
                <motion.button
                  key={v.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => tx?.id && onFilterByTransaction?.(tx.id)}
                  className="group relative w-full flex flex-col gap-2 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all overflow-hidden text-left shadow-sm"
                >
                  {/* Barre de sévérité latérale (Signature Design) */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentColor}`} />

                  {/* Ligne 1 : Titre Règle & Montant */}
                  <div className="flex justify-between items-center pl-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/90 truncate">
                        {v.rule?.name || 'Alerte Intelligence'}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-white shrink-0">
                      {formatCurrency(tx?.amount || 0)}
                    </span>
                  </div>

                  {/* Ligne 2 : Message IA (Point focal) */}
                  <div className="pl-1">
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                      {/* Nettoyage des guillemets éventuels du message */}
                      {v.message.replace(/^"|"$/g, '')}
                    </p>
                  </div>

                  {/* Ligne 3 : Footer (Marchand & Action) */}
                  <div className="pl-1 mt-1 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <div className="size-4 rounded-full bg-white/5 flex items-center justify-center text-[10px] shrink-0">
                        {displayEmoji}
                      </div>
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter truncate">
                        {parsed.merchant || 'Opération'}
                      </span>
                    </div>
                    
                    <div className={`text-[9px] font-black text-cyan-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 flex items-center gap-0.5`}>
                      DÉTAILS <ChevronRight className="size-2.5" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar pb-2">
      {renderGroup("Critique", groups.critical, AlertOctagon, "text-red-400", "bg-red-500")}
      {renderGroup("Avertissement", groups.warning, ShieldAlert, "text-orange-400", "bg-orange-500")}
      {renderGroup("Information", groups.info, Info, "text-cyan-400", "bg-cyan-500")}
    </div>
  ); 
});