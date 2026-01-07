import React from 'react';
import { motion } from 'framer-motion';
import { Info, AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';
import type { GeneratedInsight } from '../../src/utils/insights/insights-generator';

interface InsightCardProps {
  insight: GeneratedInsight;
  index: number;
}

export function InsightCard({ insight, index }: InsightCardProps) {
  const severityConfig = {
    info: {
      icon: Info,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-blue-400',
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-amber-400',
    },
    critical: {
      icon: AlertCircle,
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      iconColor: 'text-red-400',
    },
  };

  const config = severityConfig[insight.severity];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 backdrop-blur-sm`}
    >
      <div className="flex gap-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-white font-medium mb-1">{insight.title}</h4>
          <p className="text-white/70 text-sm mb-2">{insight.description}</p>
          {insight.recommendation && (
            <p className="text-white/60 text-xs italic border-l-2 border-purple-500/50 pl-2">
              💡 {insight.recommendation}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
