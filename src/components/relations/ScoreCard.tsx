/*import { motion } from 'framer-motion';
import { Shield, Award } from 'lucide-react';

interface ScoreCardProps {
  type: 'liberte' | 'resilience';
  score: number;
  pillar1: { value: number; max: number; label: string };
  pillar2: { value: number; max: number; label: string };
  pillar3: { value: number; max: number; label: string };
}

export function ScoreCard({ type, score, pillar1, pillar2, pillar3 }: ScoreCardProps) {
  const isResilience = type === 'resilience';
  const mainColor = isResilience ? '#6366f1' : '#10b981';

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 flex flex-col gap-6"
    >
      <div className="flex justify-between items-start">
        <div className={`p-4 rounded-2xl ${isResilience ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
          {isResilience ? <Shield className="w-6 h-6 text-indigo-600" /> : <Award className="w-6 h-6 text-emerald-600" />}
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Score de {type}</span>
          <div className="text-4xl font-bold tracking-tight text-slate-900">{score}<span className="text-lg text-slate-300">/100</span></div>
        </div>
      </div>

      <div className="space-y-4">
        {[pillar1, pillar2, pillar3].map((p, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium px-1">
              <span className="text-slate-500">{p.label}</span>
              <span className="text-slate-900">{p.value} / {p.max}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(p.value / p.max) * 100}%` }}
                className="h-full rounded-full"
                style={{ backgroundColor: mainColor }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}*/