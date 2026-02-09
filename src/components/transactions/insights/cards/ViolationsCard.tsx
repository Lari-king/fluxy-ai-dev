/**
 * 🚨 VIOLATIONS CARD - VERSION R.A.S.P STABILISÉE & DEBUGGÉE
 * - Typage strict Transaction
 * - Filtrage des transactions masquées (isHidden)
 * - Logs pour comprendre pourquoi rien n'apparaît
 * - Affichage amélioré quand 0 violation
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, ShieldAlert, Info, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { parseTransactionDescription } from '@/utils/transaction-parser';
import { Transaction } from '@/contexts/DataContext';
import { RuleViolation } from '@/types/rules';

interface ViolationsCardProps {
  violations: RuleViolation[];
  onFilterByTransaction?: (transactionId: string) => void;
}

interface ViolationGroupProps {
  violations: RuleViolation[];
  title: string;
  icon: any;
  color: 'red' | 'orange' | 'cyan';
  onFilterByTransaction?: (transactionId: string) => void;
}

const ViolationGroup = memo(({
  violations,
  title,
  icon: Icon,
  color,
  onFilterByTransaction
}: ViolationGroupProps) => {
  const displayViolations = useMemo(() => {
    console.log(`[VIOLATION GROUP DEBUG] Groupe "${title}" – Violations brutes :`, violations.length);

    return violations
      .filter(v => {
        if (!v.transaction) return false;
        const tx = v.transaction as Transaction; // Typage plus sûr
        const keep = tx && !tx.isHidden;
        if (!keep) console.log('[VIOLATION FILTER] Transaction masquée ignorée :', tx?.id);
        return keep;
      })
      .map(v => ({
        ...v,
        parsed: parseTransactionDescription(v.transaction?.description || '')
      }));
  }, [violations]);

  if (displayViolations.length === 0) {
    console.log(`[VIOLATION GROUP] "${title}" : 0 violation après filtrage`);
    return null;
  }

  const colorClasses = {
    red: "from-red-500/10 to-red-900/10 border-red-500/30 text-red-400",
    orange: "from-orange-500/10 to-orange-900/10 border-orange-500/30 text-orange-400",
    cyan: "from-cyan-500/10 to-cyan-900/10 border-cyan-500/30 text-cyan-400"
  };

  return (
    <div className={`rounded-xl overflow-hidden bg-gradient-to-br border ${colorClasses[color].split(' text-')[0]}`}>
      <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorClasses[color].split(' ').pop()}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${colorClasses[color].split(' ').pop()}`}>
            {title}
          </span>
        </div>
        <span className="text-[10px] text-white/30 font-mono">
          {displayViolations.length}
        </span>
      </div>

      <div className="max-h-[220px] overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {displayViolations.map((v) => (
          <motion.button
            key={v.id}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}
            onClick={() => {
              console.log('[VIOLATION CLICK] Filtre vers transaction :', v.transaction?.id);
              onFilterByTransaction?.(v.transaction?.id || '');
            }}
            className="w-full p-2.5 rounded-lg text-left transition-all group hover:bg-white/5"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                {v.parsed.merchant || v.transaction?.description?.slice(0, 30) || 'Inconnu'}
              </span>
              <span className="text-sm font-mono font-bold text-white">
                {formatCurrency(v.transaction?.amount || 0)}
              </span>
            </div>

            <p className="text-xs text-white/60 line-clamp-2 leading-relaxed mb-2">
              {v.message || v.rule?.name || 'Règle déclenchée'}
            </p>

            <div className="flex items-center justify-between text-[10px]">
              <span className="text-white/40">
                {v.transaction?.date 
                  ? new Date(v.transaction.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                  : 'Date inconnue'}
              </span>
              {v.acknowledged && (
                <span className="text-green-500/60 font-medium">Vérifié</span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
});

export const ViolationsCard = memo(function ViolationsCard({
  violations,
  onFilterByTransaction
}: ViolationsCardProps) {
  console.log('[VIOLATIONS CARD] Violations reçues au total :', violations?.length || 0);

  const groups = useMemo(() => ({
    critical: violations.filter(v => v.severity === 'error'),
    warning: violations.filter(v => v.severity === 'warning'),
    info: violations.filter(v => v.severity === 'info'),
  }), [violations]);

  if (violations.length === 0) {
    console.log('[VIOLATIONS CARD] Aucune violation → rendu null');
    return null;
  }

  console.log('[VIOLATIONS CARD] Groupes :', {
    critical: groups.critical.length,
    warning: groups.warning.length,
    info: groups.info.length
  });

  return (
    <div className="space-y-4">
      <ViolationGroup
        violations={groups.critical}
        title="Alertes Critiques"
        icon={AlertOctagon}
        color="red"
        onFilterByTransaction={onFilterByTransaction}
      />
      
      <ViolationGroup
        violations={groups.warning}
        title="Avertissements"
        icon={ShieldAlert}
        color="orange"
        onFilterByTransaction={onFilterByTransaction}
      />
      
      <ViolationGroup
        violations={groups.info}
        title="Informations"
        icon={Info}
        color="cyan"
        onFilterByTransaction={onFilterByTransaction}
      />
    </div>
  );
});