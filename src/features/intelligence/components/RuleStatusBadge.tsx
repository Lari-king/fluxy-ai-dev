import { RuleSeverity } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RuleStatusBadgeProps {
  severity: RuleSeverity;
  count?: number;
}

export function RuleStatusBadge({ severity, count }: RuleStatusBadgeProps) {
  const configs = {
    info: {
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      icon: ShieldCheck,
      label: 'Info'
    },
    warning: {
      color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      icon: AlertTriangle,
      label: 'Avertissement'
    },
    error: {
      color: 'bg-red-500/10 text-red-400 border-red-500/20',
      icon: AlertOctagon,
      label: 'Critique'
    }
  };

  const config = configs[severity];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider ${config.color}`}>
      <Icon className="w-3 h-3" />
      <span>{count !== undefined ? `${count} ${config.label}` : config.label}</span>
    </div>
  );
}
