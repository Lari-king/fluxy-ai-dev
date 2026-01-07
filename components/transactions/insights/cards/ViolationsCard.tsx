/**
 * 🚨 VIOLATIONS CARD - VERSION COHÉRENTE 2026
 * 
 * Design unifié avec parsing intelligent :
 * - Tailles cohérentes
 * - Parsing pour noms clairs
 * - Catégories colorées
 * - Max 5 items puis scroll interne
 * - Séparation par sévérité
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, ShieldAlert, Info } from 'lucide-react';
import { formatCurrency } from '../../../../src/utils/format';
import { parseTransactionDescription, colorMap } from '../../../../src/utils/transaction-parser';

interface ViolationsCardProps {
  violations: any[];
  onFilterByTransaction?: (transactionId: string) => void;
}

const ViolationGroup = ({ 
  violations, 
  severity, 
  title, 
  icon: Icon, 
  color,
  onFilterByTransaction 
}: any) => {
  
  const parsedViolations = useMemo(() => {
    return violations.map((violation: any) => ({
      ...violation,
      parsed: parseTransactionDescription(violation.transaction.description)
    }));
  }, [violations]);

  if (parsedViolations.length === 0) return null;

  return (
    <div className={`rounded-xl overflow-hidden bg-gradient-to-br from-${color}-500/10 to-${color}-900/10 border border-${color}-500/30`}>
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/20 rounded-full blur-3xl`} />
        <div className={`relative px-4 py-3 border-b border-${color}-500/20`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 border border-${color}-500/30 flex items-center justify-center`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
              <div>
                <h3 className="text-sm text-white/90 font-medium">{title}</h3>
                <p className="text-xs text-white/40">{parsedViolations.length} détectée{parsedViolations.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste avec scroll interne (max 5 items) */}
      <div className="max-h-[280px] overflow-y-auto scrollbar-thin">
        <div className="p-3 space-y-2">
          {parsedViolations.map((violation: any, idx: number) => {
            const colors = colorMap[violation.parsed.color];
            const Icon = violation.parsed.icon;
            
            return (
              <motion.button
                key={violation.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => onFilterByTransaction?.(violation.transaction.id)}
                className={`group w-full p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-${color}-500/10 hover:border-${color}-500/30 transition-all text-left`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm text-white/90 mb-1 group-hover:text-white transition-colors truncate">
                      {violation.parsed.merchant}
                    </h4>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {violation.parsed.category}
                    </span>
                  </div>
                  
                  <span className={`text-sm font-mono font-medium text-${color}-400 flex-shrink-0`}>
                    {formatCurrency(violation.transaction.amount)}
                  </span>
                </div>

                <p className="text-xs text-white/50 leading-relaxed mb-2">
                  {violation.message}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-white/40">
                    {new Date(violation.transaction.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ViolationsCard = memo(function ViolationsCard({ 
  violations, 
  onFilterByTransaction 
}: ViolationsCardProps) {
  const criticalViolations = violations.filter((v: any) => v.severity === 'error');
  const warningViolations = violations.filter((v: any) => v.severity === 'warning');
  const infoViolations = violations.filter((v: any) => v.severity === 'info');
  
  return (
    <>
      <ViolationGroup
        violations={criticalViolations}
        severity="error"
        title="Alertes Critiques"
        icon={AlertOctagon}
        color="red"
        onFilterByTransaction={onFilterByTransaction}
      />
      
      <ViolationGroup
        violations={warningViolations}
        severity="warning"
        title="Avertissements"
        icon={ShieldAlert}
        color="orange"
        onFilterByTransaction={onFilterByTransaction}
      />
      
      <ViolationGroup
        violations={infoViolations}
        severity="info"
        title="Notifications"
        icon={Info}
        color="cyan"
        onFilterByTransaction={onFilterByTransaction}
      />
    </>
  );
});
