/**
 * 📤 IMPORT CSV - DESIGN DARK FUTURISTE - VERSION INTÉGRALE DÉDUPLIQUÉE
 */

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, ArrowLeft, Sparkles, Database, Info, Calendar } from 'lucide-react';
import { parseCSV, Transaction } from '@/utils/csv-parser';
import { toast } from 'sonner';
import { CSVPreviewDialog } from '@/components/transactions/modals/CSVPreviewDialog';
import { useData } from '@/contexts/DataContext';
import { detectDuplicates, DuplicateResult } from '@/utils/deduplication';

interface TransactionImportProps {
  onImport: (transactions: Transaction[]) => void;
  onClose?: () => void;
  currentDatabaseBalance?: number;
}

// ✅ CORRECTION 1 : Ajout de currentDatabaseBalance dans la déstructuration des props
export function TransactionImport({ onImport, onClose, currentDatabaseBalance = 0 }: TransactionImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { transactions: existingTransactions } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<{
    results: DuplicateResult[];
    rawData: { headers: string[]; rows: string[][] };
  } | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Format non supporté', {
        description: 'Merci d\'importer un fichier CSV',
      });
      return;
    }

    setImporting(true);

    try {
      const text = await file.text();
      const transactions = parseCSV(text);
      
      if (transactions.length === 0) {
        toast.error('Aucune transaction trouvée', {
          description: 'Le fichier CSV semble vide ou invalide',
        });
        setImporting(false);
        return;
      }

      // --- LOGIQUE DE DÉDUPLICATION ---
      const results = detectDuplicates(transactions, existingTransactions);

      // Parse raw data for preview
      const lines = text.trim().split('\n');
      let delimiter = ',';
      if (lines[0].includes('\t')) delimiter = '\t';
      else if (lines[0].includes(';')) delimiter = ';';

      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1, Math.min(11, lines.length)).map(line => {
        return line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
      });
      
      setPreviewData({
        results,
        rawData: { headers, rows },
      });

      setImporting(false);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast.error('Erreur d\'import', {
        description: 'Impossible de lire le fichier CSV',
      });
      setImporting(false);
    }
  };

  const handleConfirmImport = (transactions: Transaction[]) => {
    toast.success('Import réussi !', {
      description: `${transactions.length} transactions importées`,
    });
    onImport(transactions);
    setPreviewData(null);
    onClose?.();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="min-h-screen bg-[var(--color-bg-primary)] p-6"
      >
        {onClose && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onClose}
            className="flex items-center gap-2 mb-6 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Retour aux transactions</span>
          </motion.button>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-light text-[var(--color-text-primary)]">
                Importer des transactions
              </h1>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Smart Deduplication Active</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="panel-base p-0 overflow-hidden"
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`
                relative p-12 transition-all duration-300
                ${isDragging 
                  ? 'bg-purple-500/10 border-2 border-purple-500 border-dashed' 
                  : 'border-2 border-dashed border-[var(--color-border-primary)] hover:border-[var(--color-border-hover)]'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
              />

              <div className="text-center">
                <AnimatePresence mode="wait">
                  {importing ? (
                    <motion.div 
                      key="importing"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <div className="relative w-20 h-20 mb-4">
                        <div className="absolute inset-0 border-4 border-purple-500/20 rounded-2xl" />
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 border-4 border-t-purple-500 rounded-2xl"
                        />
                        <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-purple-500" />
                      </div>
                      <h3 className="text-lg text-[var(--color-text-primary)]">Analyse du fichier...</h3>
                    </motion.div>
                  ) : (
                    <motion.div key="idle">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
                        <FileText className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-lg text-[var(--color-text-primary)] mb-2">
                        {isDragging ? '📥 Dépose le fichier ici' : 'Glisse-dépose un fichier CSV ou clique pour sélectionner'}
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)] mb-6">
                        Format CSV uniquement • Taille max 10 MB
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-primary px-6 py-3 text-sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Sélectionner un fichier
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* ... Reste du décoratif ... */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                🏦 Formats bancaires supportés
              </h3>
            </div>
            <ul className="space-y-2 ml-10">
              <li className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Relevés bancaires standard (Date, Libellé, Montant)</span>
              </li>
            </ul>
          </motion.div>

        </div>
      </motion.div>

      {previewData && (
        <CSVPreviewDialog
          isOpen={!!previewData}
          onClose={() => setPreviewData(null)}
          results={previewData.results}
          rawData={previewData.rawData}
          onConfirmImport={handleConfirmImport}
          // ✅ CORRECTION 2 : Passage du solde au Dialog
          currentDatabaseBalance={currentDatabaseBalance}
        />
      )}
    </>
  );
}