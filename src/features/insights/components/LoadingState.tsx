import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export function LoadingState() {
  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Simulation de la carte de Projection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1 opacity-20">
          <div className="w-3.5 h-3.5 bg-white rounded-full animate-pulse" />
          <div className="h-2 w-20 bg-white rounded animate-pulse" />
        </div>
        <div className="h-32 w-full rounded-2xl bg-white/[0.03] border border-white/5 overflow-hidden relative">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        </div>
      </div>

      {/* Simulation des sections suivantes */}
      {[1, 2].map((i) => (
        <div key={i} className="space-y-3 opacity-50">
          <div className="flex items-center gap-2 px-1 opacity-20">
             <div className="w-3.5 h-3.5 bg-white rounded-full animate-pulse" />
             <div className="h-2 w-24 bg-white rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-20 w-full rounded-xl bg-white/[0.02] border border-white/5" />
            <div className="h-20 w-full rounded-xl bg-white/[0.02] border border-white/5" />
          </div>
        </div>
      ))}

      <div className="flex items-center justify-center gap-2 py-4">
        <Sparkles className="w-3 h-3 text-cyan-400 animate-spin-slow" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">
          IA en cours d'analyse...
        </span>
      </div>
    </div>
  );
}
