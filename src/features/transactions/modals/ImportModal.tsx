/**
 * 📥 IMPORT MODAL - VERSION RÉPARÉE ET OPTIMISÉE
 * Réintègre l'intelligence sémantique et la performance de l'ancienne version.
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, FileText, X, CheckCircle, AlertCircle, Download, ArrowRight, Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Types et Utils
import { Transaction, ImportPreviewData } from '../types';
import { parseCSV } from '@/utils/csv-parser'; // ✅ Utilisation du parser intelligent
import { detectDuplicates } from '@/utils/deduplication';
import { useData } from '@/contexts/DataContext';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport?: (transactions: Transaction[]) => void;
  onShowPreview?: (data: ImportPreviewData) => void;
  currentDatabaseBalance?: number;
}

export function ImportModal({
  open,
  onClose,
  onImport,
  onShowPreview,
  currentDatabaseBalance = 0
}: ImportModalProps) {
  const { transactions: existingTransactions } = useData();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // LOGIQUE DE TRAITEMENT (REPARÉE)
  // ============================================================================

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const content = await file.text();
      
      // 1. Parsing intelligent (Détecte séparateurs et colonnes sémantiquement)
      // On utilise le parseCSV de l'utilitaire qui est plus robuste
      const parsedTransactions = parseCSV(content);
      
      if (parsedTransactions.length === 0) {
        throw new Error("Aucune transaction n'a pu être extraite. Vérifiez le format du fichier.");
      }

      // 2. Déduplication performante (O(n) via Map)
      const results = detectDuplicates(parsedTransactions, existingTransactions);

      // 3. Préparation des données brutes pour le mapping si nécessaire
      const lines = content.split('\n').filter(l => l.trim());
      const rawData = {
        headers: lines[0].split(/[;,]/).map(h => h.trim()),
        rows: lines.slice(1).map(l => l.split(/[;,]/).map(v => v.trim()))
      };

      const previewData: ImportPreviewData = {
        results,
        rawData
      };

      if (onShowPreview) {
        onShowPreview(previewData);
        onClose();
        // Reset l'état après envoi
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'analyse du fichier");
    } finally {
      setIsProcessing(false);
    }
  };

  // ... (Handlers UI dans la partie suivante)
  // ============================================================================
  // HANDLERS UI
  // ============================================================================

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files[0]);
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Veuillez sélectionner un fichier CSV');
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const template = `Date,Libellé,Montant,Catégorie\n2024-02-18,Courses Carrefour,-45.50,Alimentation\n2024-02-19,Salaire,2500.00,Revenus`;
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_import.csv';
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-cyan-400" />
              Importer des transactions
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold">Smart AI Parsing</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Info Card */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-3">
            <AlertCircle className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-white/60 leading-relaxed">
              Le moteur d'importation analyse automatiquement la structure de votre fichier. 
              Les doublons seront détectés par comparaison intelligente des dates et montants.
            </div>
          </div>

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
                transition-all duration-300 group
                ${isDragging 
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-cyan-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white mb-1">Déposez votre CSV ici</p>
                  <p className="text-sm text-white/40">ou cliquez pour parcourir vos fichiers</p>
                </div>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{selectedFile.name}</p>
                <p className="text-xs text-white/40">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              <Button size="icon" variant="ghost" onClick={handleRemoveFile} className="hover:bg-red-500/10 hover:text-red-500">
                <X className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          <div className="flex gap-3 pt-6 border-t border-white/5">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-white/5 border-white/10">
              Annuler
            </Button>
            <Button
              onClick={() => selectedFile && processFile(selectedFile)}
              disabled={!selectedFile || isProcessing}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-bold"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Analyse...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Analyser le fichier <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}