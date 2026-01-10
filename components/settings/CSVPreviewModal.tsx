/**
 * 👁️ CSV PREVIEW MODAL
 * Modal de prévisualisation avant import CSV
 */

import { motion } from 'framer-motion';
import { X, Eye, CheckCircle2, AlertCircle, FileText, Plus, Loader } from 'lucide-react';

interface CSVPreviewData {
  parent: string;
  child: string;
  isNew: boolean;
  parentExists: boolean;
}

interface CSVPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: CSVPreviewData[];
}

export function CSVPreviewModal({ isOpen, onClose, onConfirm, data }: CSVPreviewModalProps) {
  if (!isOpen) return null;

  const stats = {
    total: data.length,
    newParents: new Set(data.filter(d => !d.parentExists && !d.child).map(d => d.parent)).size,
    newChildren: data.filter(d => d.child && d.isNew).length,
    existing: data.filter(d => !d.isNew).length
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-4xl bg-[#0A0A0A] border border-cyan-500/20 rounded-xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 shrink-0">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <Eye className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-medium text-white/90">Prévisualisation CSV</h3>
            <p className="text-xs text-white/40 mt-0.5">
              Vérifiez les données avant import • {stats.total} ligne{stats.total > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-white/60 hover:text-white/90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 p-4 border-b border-white/10 bg-black/20 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-white/60">Total</span>
            </div>
            <div className="text-xl font-light text-white/90">{stats.total}</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs text-white/60">Nouvelles cat.</span>
            </div>
            <div className="text-xl font-light text-green-400">{stats.newParents}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs text-white/60">Nouvelles sous-cat.</span>
            </div>
            <div className="text-xl font-light text-purple-400">{stats.newChildren}</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs text-white/60">Existantes</span>
            </div>
            <div className="text-xl font-light text-orange-400">{stats.existing}</div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full">
            <thead className="bg-black/40 sticky top-0 z-10 border-b border-white/10">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 p-3">Statut</th>
                <th className="text-left text-xs font-medium text-white/60 p-3">Catégorie</th>
                <th className="text-left text-xs font-medium text-white/60 p-3">Sous-catégorie</th>
                <th className="text-left text-xs font-medium text-white/60 p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr 
                  key={index} 
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-3">
                    {row.isNew ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-medium border border-green-500/30">
                        <Plus className="w-2.5 h-2.5" />
                        NOUVEAU
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-medium border border-orange-500/30">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        EXISTE
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-sm font-medium text-white/90">{row.parent}</span>
                  </td>
                  <td className="p-3">
                    {row.child ? (
                      <span className="text-sm text-white/70">{row.child}</span>
                    ) : (
                      <span className="text-xs text-white/30 italic">Sans enfant</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-xs text-white/40">
                      {row.isNew ? 
                        (row.child ? 'Créer sous-catégorie' : 'Créer catégorie') : 
                        (row.child ? 'Lier à existante' : 'Ignorer (existe)')
                      }
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between shrink-0">
          <div className="text-xs text-white/40">
            {stats.newParents + stats.newChildren} élément{stats.newParents + stats.newChildren > 1 ? 's' : ''} seront créé{stats.newParents + stats.newChildren > 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/5 hover:text-white/90 transition-all text-sm font-medium"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white text-sm font-medium transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Confirmer l'import
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
