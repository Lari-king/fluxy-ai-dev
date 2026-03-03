import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface UltraInsightsBadgeProps {
  onClick: () => void;
}

export function UltraInsightsBadge({ onClick }: UltraInsightsBadgeProps) {
  // ✅ On génère les positions une seule fois ou via un tableau fixe pour éviter le flickering
  const particles = React.useMemo(() => [...Array(8)], []);

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
        {particles.map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-purple-300 rounded-full opacity-0 group-hover:opacity-100"
            style={{
              left: `${(i * 15) + 5}%`, // Distribution plus régulière
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative flex items-center gap-3">
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="w-8 h-8 text-purple-400" />
          </motion.div>
          
          <motion.div
            className="absolute inset-0"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-8 h-8 text-purple-300" />
          </motion.div>
        </div>

        <div className="text-left">
          <div className="text-white font-medium flex items-center gap-2">
            Ultra Insights
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
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