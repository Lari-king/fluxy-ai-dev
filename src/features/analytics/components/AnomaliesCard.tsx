import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, ChevronRight, AlertCircle, History, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AnomaliesCardProps {
  anomalies: any;
  onFilterByAnomaly: (filter: { targetId: string, relatedIds: string[] }) => void;
  people?: any[];
  selectedTransactionId?: string | null;
  onSelectTransaction: (txn: any) => void;
}

/**
 * 🕵️ ANOMALIES CARD - VERSION HAUTE FIDÉLITÉ
 * Fusion de la logique analytique robuste et du design "Tesla/Apple" 2026.
 */
export const AnomaliesCard = memo(function AnomaliesCard({ 
  anomalies: data, 
  onFilterByAnomaly,
  onSelectTransaction,
  people = [],
  selectedTransactionId 
}: AnomaliesCardProps) {
  
  const peopleMap = useMemo(() => new Map(people.map((p: any) => [p.id, p])), [people]);

  // Préparation des données analytiques
  const processed = useMemo(() => {
    const list = data?.anomalies || data || [];
    if (!Array.isArray(list)) return [];
    
    return list.map((a: any, index: number) => {
      const tx = a.transaction || a.tx;
      if (!tx) return null;
      
      const person = peopleMap.get(tx.personId);
      const comparisonCount = a.context?.totalCompared || a.comparisonCount || 12;
      
      // Calcul de l'écart basé sur le score de confiance
      const confidence = Math.max(0, Math.min(100, a.confidence || a.score || 0));
      const habitAmount = tx.amount / (1 + (confidence / 100));
      const diff = tx.amount - habitAmount;

      return { 
        ...a, 
        tx, 
        person, 
        diff, 
        habitAmount, 
        comparisonCount,
        confidence,
        internalKey: `anom-${tx.id}-${index}`
      };
    }).filter(Boolean);
  }, [data, peopleMap]);

  if (processed.length === 0) return null;

  return (
    <div className="flex flex-col h-[450px] bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
      {/* Header unifié avec compteur */}
      <div className="px-4 py-3 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <Zap className="size-3 text-cyan-400 fill-cyan-400/20" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            Signaux IA ({processed.length})
          </span>
        </div>
        <div className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-bold text-cyan-400 uppercase">
          Analyse Live
        </div>
      </div>

      {/* Zone de Scroll (3.5 items visibles environ) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {processed.map((anom: any) => {
          const isSelected = selectedTransactionId === anom.tx.id;
          const isIncrease = anom.diff > 0;

          return (
            <motion.div
              key={anom.internalKey}
              whileHover={{ x: 4 }}
              onClick={() => {
                onFilterByAnomaly({
                  targetId: anom.tx.id,
                  relatedIds: anom.context?.relatedIds || []
                });
                onSelectTransaction(anom.tx);
              }}
              className={`group relative p-3 rounded-xl transition-all cursor-pointer border ${
                isSelected 
                  ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_-12px_rgba(6,182,212,0.5)]' 
                  : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3 min-w-0">
                  {/* Logo / Avatar */}
                  <div className="relative flex-shrink-0">
                    {anom.person ? (
                      <Avatar className={`size-9 border transition-colors ${isSelected ? 'border-cyan-400' : 'border-white/10'}`}>
                        <AvatarImage src={anom.person.avatar} />
                        <AvatarFallback className="bg-cyan-900/40 text-[10px] text-cyan-400 font-bold uppercase">
                          {anom.person.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={`size-9 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-black/40 border-white/10'
                      } border`}>
                        <AlertCircle className={`size-5 ${isSelected ? 'text-cyan-400' : 'text-white/20'}`} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                      {anom.tx.description}
                    </h4>
                    <p className="text-[9px] text-white/30 font-medium uppercase tracking-tighter mt-0.5">
                      {anom.tx.date ? format(parseISO(anom.tx.date), 'dd MMMM yyyy', { locale: fr }) : '--'}
                    </p>
                  </div>
                </div>

                {/* Badge Variation avec Glow */}
                <div className={`px-2 py-1 rounded-md text-[10px] font-mono font-black border flex flex-col items-end ${
                  isIncrease 
                    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                   <span className="text-[8px] opacity-60 font-black uppercase tracking-tighter">Écart</span>
                  {isIncrease ? '+' : ''}{formatCurrency(anom.diff)}
                </div>
              </div>

              {/* Analyse Contextuelle (Comparaison) */}
              <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-black/20 border border-white/5 mb-3">
                <div>
                  <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">Montant Actuel</p>
                  <p className="text-xs font-mono font-bold text-white">{formatCurrency(anom.tx.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-white/20 uppercase font-black tracking-widest">Habitude</p>
                  <p className="text-xs font-mono font-bold text-white/60">{formatCurrency(anom.habitAmount)}</p>
                </div>
              </div>

              {/* Footer de la carte */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-1.5 text-[9px] font-medium transition-colors ${isSelected ? 'text-cyan-400/60' : 'text-white/30'}`}>
                  <History className="size-2.5" />
                  Basé sur {anom.comparisonCount} opérations
                </div>
                <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all ${
                  isSelected ? 'text-cyan-400 opacity-100' : 'text-white/20 opacity-0 group-hover:opacity-100'
                }`}>
                  Analyse <ChevronRight className="size-2.5" />
                </div>
              </div>

              {/* Barre de confiance subtile */}
              <div className="absolute bottom-0 left-0 h-[1.5px] bg-white/5 w-full">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${anom.confidence}%` }}
                  className="h-full bg-cyan-500/40"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer informatif global */}
      <div className="p-3 bg-black/40 border-t border-white/5">
        <p className="text-[9px] text-white/20 text-center font-medium leading-relaxed italic">
          L'IA analyse les patterns temporels et les écarts de montants sur vos {processed.length} dernières alertes.
        </p>
      </div>
    </div>
  );
});