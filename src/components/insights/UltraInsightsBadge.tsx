import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface UltraInsightsBadgeProps {
  onClick: () => void;
}

/**
 * Badge flottant pour accéder rapidement à Ultra Insights
 * Affichable sur le dashboard ou la page transactions
 */
export function UltraInsightsBadge({ onClick }: UltraInsightsBadgeProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl p-4 transition-all"
      style={{
        background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        boxShadow: '0 0 30px rgba(147, 51, 234, 0.2)',
      }}
    >
      {/* Effet de brillance animé */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
      />
      
      {/* Particules flottantes au hover */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-300 rounded-full opacity-0 group-hover:opacity-100"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1 + Math.random(),
              repeat: Infinity,
              delay: Math.random() * 0.5,
            }}
          />
        ))}
      </div>

      <div className="relative flex items-center gap-3">
        <div className="relative">
          <motion.div
            animate={{
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <Sparkles className="w-8 h-8 text-purple-400" />
          </motion.div>
          
          {/* Pulsation */}
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <Sparkles className="w-8 h-8 text-purple-300" />
          </motion.div>
        </div>

        <div className="text-left">
          <div className="text-white font-medium flex items-center gap-2">
            Ultra Insights
            <motion.span
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/50 text-purple-100"
            >
              BETA
            </motion.span>
          </div>
          <p className="text-white/60 text-xs">
            Analyse avancée de vos finances
          </p>
        </div>
      </div>
    </motion.button>
  );
}
