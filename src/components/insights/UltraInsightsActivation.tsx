import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Eye, TrendingUp, Activity } from 'lucide-react';

interface UltraInsightsActivationProps {
  onActivate: () => void;
  onCancel: () => void;
}

export function UltraInsightsActivation({ onActivate, onCancel }: UltraInsightsActivationProps) {
  const [stage, setStage] = useState<'intro' | 'charging' | 'confirmation'>('intro');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Générer des particules aléatoires pour l'effet énergétique
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);

    // Transition automatique intro -> charging
    const timer1 = setTimeout(() => setStage('charging'), 800);
    // Transition automatique charging -> confirmation
    const timer2 = setTimeout(() => setStage('confirmation'), 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{
          background: 'radial-gradient(circle at center, rgba(10, 10, 10, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)',
        }}
      >
        {/* Particules violettes/argentées - RÉDUITES de 30 à 12 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 2 === 0 
                  ? 'radial-gradient(circle, rgba(168, 85, 247, 0.8), transparent)'
                  : 'radial-gradient(circle, rgba(192, 192, 192, 0.6), transparent)',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100, -200],
                opacity: [0, 0.8, 0],
                scale: [0.5, 1.5, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        {/* Cercles d'énergie concentriques */}
        <motion.div
          className="absolute"
          style={{
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            border: '2px solid rgba(168, 85, 247, 0.3)',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute"
          style={{
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            border: '2px solid rgba(192, 132, 252, 0.4)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
        />

        {/* Contenu principal */}
        <div className="relative z-10 text-center max-w-2xl px-8">
          <AnimatePresence mode="wait">
            {stage === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="inline-block mb-6"
                >
                  <div className="relative">
                    <Zap className="w-24 h-24 text-purple-400" strokeWidth={1.5} />
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        opacity: [0, 0.8, 0],
                        scale: [1, 1.3, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      <Zap className="w-24 h-24 text-purple-300" strokeWidth={1.5} />
                    </motion.div>
                  </div>
                </motion.div>
                <h2 className="text-4xl mb-4 bg-gradient-to-r from-purple-400 via-purple-200 to-purple-400 bg-clip-text text-transparent">
                  Ultra Insights
                </h2>
                <p className="text-white/60 text-lg">
                  Initialisation du mode d'analyse avancée...
                </p>
              </motion.div>
            )}

            {stage === 'charging' && (
              <motion.div
                key="charging"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="inline-block mb-8"
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                >
                  <div className="relative">
                    <Activity className="w-32 h-32 text-purple-300" strokeWidth={1.5} />
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.8, 0, 0.8],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    >
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, transparent 70%)',
                          boxShadow: '0 0 60px rgba(168, 85, 247, 0.8)',
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  className="h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600 rounded-full mx-auto"
                  style={{ maxWidth: '400px' }}
                />
                <p className="text-white/80 text-xl mt-6">
                  Chargement des algorithmes d'analyse...
                </p>
              </motion.div>
            )}

            {stage === 'confirmation' && (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 200, 
                    damping: 15,
                    delay: 0.2 
                  }}
                  className="inline-block mb-8"
                >
                  <div className="relative">
                    <Eye className="w-28 h-28 text-white" strokeWidth={1.5} />
                    <motion.div
                      className="absolute -inset-4"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      style={{
                        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
                        filter: 'blur(20px)',
                      }}
                    />
                  </div>
                </motion.div>

                <h2 className="text-5xl mb-6 bg-gradient-to-r from-purple-300 via-white to-purple-300 bg-clip-text text-transparent animate-pulse">
                  Ultra Insights
                </h2>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/90 text-xl mb-10 max-w-lg mx-auto"
                >
                  Prêt à découvrir vos patterns financiers cachés et identifier les ruptures dans vos habitudes ?
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-4 justify-center"
                >
                  <button
                    onClick={onCancel}
                    className="px-8 py-3 rounded-lg border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all"
                  >
                    Annuler
                  </button>
                  <motion.button
                    onClick={onActivate}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative px-10 py-3 rounded-lg overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)',
                      boxShadow: '0 0 30px rgba(147, 51, 234, 0.6)',
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600"
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative text-white font-medium text-lg flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Activer
                    </span>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}