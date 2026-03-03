import React, { useState, useMemo, useEffect, useCallback } from "react"; // Ajout de useCallback et React
import { motion } from "framer-motion";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileText,
  Download,
  Upload,
  ArrowRight,
  Edit3,
  Info,
  DollarSign,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  ImportPreviewData,
  DuplicateResult,
  Transaction,
} from "../types";
import {
  formatCurrency,
  formatDateCompact,
} from "@/utils/format";
import { cn } from "@/utils/transaction-helpers";

type Step = "preview" | "mapping" | "balance";

interface CSVPreviewDialogProps {
  data: ImportPreviewData | null;
  onConfirm?: (transactions: Transaction[]) => void;
  onClose: () => void;
  currentDatabaseBalance?: number;
}

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

// ============================================================================
// SOUS-COMPOSANT OPTIMISÉ (Zéro Lag)
// ============================================================================

const TransactionPreviewRow = React.memo(({ 
  result, 
  isSelected, 
  onToggle 
}: {
  result: DuplicateResult;
  isSelected: boolean;
  onToggle: () => void;
}) => {
  const { transaction, isDuplicate, confidence, reason } = result;
  const isIncome = transaction.amount >= 0;

  // Calcul de la sous-catégorie (Mémoïsé localement)
  const displaySubCat = useMemo(() => {
    if (transaction.subCategory) return transaction.subCategory;
    
    // Accès sécurisé aux données brutes
    const raw = (transaction as any).rawData;
    if (raw) {
      return raw['sous categorie operation'] || raw['Sous-Catégorie'] || "—";
    }
    return "—";
  }, [transaction.subCategory, (transaction as any).rawData]);

  // Formatage de la date (Mémoïsé localement)
  const safeDate = useMemo(() => {
    if (!transaction.date) return "Date absente";
    const d = new Date(transaction.date);
    return isNaN(d.getTime()) ? String(transaction.date) : formatDateCompact(transaction.date);
  }, [transaction.date]);

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-xl border transition-colors duration-200", 
        isDuplicate ? "bg-yellow-500/5 border-yellow-500/20" : "bg-white/5 border-white/10",
        !isSelected && "opacity-40"
      )}
    >
      <Checkbox 
        checked={isSelected} 
        onCheckedChange={onToggle} 
        className="flex-shrink-0" 
      />

      <div className="flex-1 grid grid-cols-[100px_1fr_120px_140px_140px] items-center gap-4 min-w-0">
        <div className="text-xs text-white/40 font-mono truncate">
          {safeDate}
        </div>
        
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">
            {transaction.description}
          </div>
          {isDuplicate && (
            <span className="text-[10px] text-amber-400 block truncate">
              {reason}
            </span>
          )}
        </div>

        <div className={cn(
          "text-sm font-bold text-right font-mono", 
          isIncome ? "text-emerald-400" : "text-white"
        )}>
          {formatCurrency(transaction.amount)}
        </div>

        <div className="text-[10px] font-bold uppercase text-white/60 bg-white/5 px-2 py-1 rounded border border-white/5 text-center truncate">
          {transaction.category || "—"}
        </div>

        <div className="text-[10px] font-bold uppercase text-white/40 bg-white/5 px-2 py-1 rounded border border-white/5 text-center truncate">
          {displaySubCat}
        </div>
      </div>

      <div className="w-20 flex justify-end">
        {isDuplicate && (
          <Badge className="text-[9px] bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
            {confidence === "high" ? "DOUBLON" : "POSSIBLE"}
          </Badge>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // ✅ LOGIQUE DE COMPARAISON STRICTE :
  // On ne re-render la ligne QUE si :
  // 1. Son état de sélection change
  // 2. L'ID de la transaction change (rare en scroll mais possible)
  // 3. Le contenu de la transaction a été modifié (via le mapping)
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.result.transaction.id === nextProps.result.transaction.id &&
    prevProps.result.transaction.description === nextProps.result.transaction.description &&
    prevProps.result.transaction.category === nextProps.result.transaction.category &&
    prevProps.result.transaction.subCategory === nextProps.result.transaction.subCategory
  );
});

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

export function CSVPreviewDialog({
  open,
  onClose,
  data,
  onConfirm,
  currentDatabaseBalance = 0,
}: CSVPreviewDialogProps) {
  const [currentStep, setCurrentStep] = useState<Step>("preview");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentBalance, setCurrentBalance] = useState<string>("");
  
  // État pour le mapping des colonnes
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({
    date: "Date",
    description: "Libellé",
    amount: "Montant",
    category: "Catégorie"
  });

  // Initialisation
  useEffect(() => {
    if (data?.results) {
      const ids = new Set(
        data.results
          .filter((r) => !r.isDuplicate || r.confidence === "none")
          .map((r) => r.transaction.id)
      );
      setSelectedIds(ids);
      setCurrentStep("preview");
    }
  }, [data]);

// ============================================================================
  // COMPUTED VALUES (OPTIMISÉ POUR LA PERFORMANCE)
  // ============================================================================

  // ✅ NOUVEAU BLOC : Ce calcul ne se déclenche QUE si le fichier change 
  // ou si l'utilisateur modifie manuellement un menu déroulant de mapping.
  // Il est désormais totalement ignoré quand on coche/décoche une transaction.
  const mappedResults = useMemo(() => {
    if (!data?.results || !data?.rawData?.headers) return [];

    const headers = data.rawData.headers;
    
    // On pré-calcule les index pour éviter de faire .indexOf() 
    // à l'intérieur de la boucle .map() (gain de performance O(n))
    const mappingIdx = {
      description: headers.indexOf(columnMapping.description),
      category: headers.indexOf(columnMapping.category),
      subCategory: headers.indexOf(columnMapping.subCategory),
      amount: headers.indexOf(columnMapping.amount),
      date: headers.indexOf(columnMapping.date),
    };

    console.log("⚡ [Perf] Recalcul global du mapping CSV");

    return data.results.map(res => {
      const row = res.rawRow;
      if (!row) return res;

      // On retourne une nouvelle structure de transaction fusionnée
      return {
        ...res,
        transaction: {
          ...res.transaction,
          // Injection dynamique basée sur le mapping choisi
          description: mappingIdx.description !== -1 
            ? (row[mappingIdx.description] || res.transaction.description)
            : res.transaction.description,
            
          category: mappingIdx.category !== -1 
            ? (row[mappingIdx.category] || res.transaction.category)
            : res.transaction.category,

          subCategory: mappingIdx.subCategory !== -1 
            ? (row[mappingIdx.subCategory] || '') 
            : (res.transaction.subCategory || ''),
            
          // On garde date et amount tels qu'ils ont été parsés initialement 
          // (car ils sont déjà convertis en Date/Number par le csv-parser)
        }
      };
    });
    // On utilise data.results comme dépendance plutôt que data pour être plus précis
  }, [data?.results, data?.rawData?.headers, columnMapping]);
  // 2. Transactions sélectionnées (Basé sur le mapping actuel)
  const selectedTransactions = useMemo(() => {
    return mappedResults
      .filter((r) => selectedIds.has(r.transaction.id))
      .map((r) => r.transaction);
  }, [mappedResults, selectedIds]);

  // 3. Montant total du fichier (transactions sélectionnées uniquement)
  const totalFileAmount = useMemo(() => {
    return selectedTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );
  }, [selectedTransactions]);

  // 4. Solde final théorique (Base + Import)
  const theoreticalFinalBalance = useMemo(() => {
    return currentDatabaseBalance + totalFileAmount;
  }, [currentDatabaseBalance, totalFileAmount]);

  // 5. Statistiques globales pour les badges et l'en-tête
  const stats = useMemo(() => {
    if (!data || mappedResults.length === 0)
      return {
        total: 0,
        duplicates: 0,
        selected: 0,
        totalAmount: 0,
        income: 0,
        expenses: 0,
      };

    const duplicates = mappedResults.filter((r) => r.isDuplicate).length;
    const selected = selectedIds.size;
    
    const income = selectedTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expenses = selectedTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      total: mappedResults.length,
      duplicates,
      selected,
      totalAmount: totalFileAmount,
      income,
      expenses,
    };
  }, [
    mappedResults,
    selectedIds,
    selectedTransactions,
    totalFileAmount,
  ]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

// ============================================================================
  // HANDLERS (OPTIMISÉS AVEC USECALLBACK)
  // ============================================================================

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (!data?.results) return;
    const allIds = new Set(
      data.results.map((r) => r.transaction.id),
    );
    setSelectedIds(allIds);
  }, [data?.results]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleSelectOnlyValid = useCallback(() => {
    if (!data?.results) return;
    const validIds = new Set(
      data.results
        .filter(
          (r) => !r.isDuplicate || r.confidence === "none",
        )
        .map((r) => r.transaction.id),
    );
    setSelectedIds(validIds);
  }, [data?.results]);

  const handleConfirm = useCallback(() => {
    if (!onConfirm || !data) return;

    const headers = data.rawData.headers;
    const mappingIdx = {
      description: headers.indexOf(columnMapping.description),
      category: headers.indexOf(columnMapping.category),
      subCategory: headers.indexOf(columnMapping.subCategory),
      amount: headers.indexOf(columnMapping.amount),
      date: headers.indexOf(columnMapping.date),
    };

    const transactionsToImport = data.results
      .filter((res) => selectedIds.has(res.transaction.id))
      .map((res) => {
        const row = res.rawRow; 
        
        return {
          ...res.transaction,
          description: row && mappingIdx.description !== -1 
            ? row[mappingIdx.description] 
            : (res.transaction.description || 'Sans description'),
            
          category: row && mappingIdx.category !== -1 
            ? row[mappingIdx.category] 
            : (res.transaction.category || 'Non catégorisé'),

          subCategory: row && mappingIdx.subCategory !== -1 
            ? row[mappingIdx.subCategory] 
            : (res.transaction.subCategory || ''),

          date: res.transaction.date,
          amount: res.transaction.amount,
        };
      });

    if (transactionsToImport.length === 0) {
      toast.error("Aucune transaction sélectionnée");
      return;
    }

    onConfirm(transactionsToImport);
    toast.success(`${transactionsToImport.length} transactions importées`);
  }, [onConfirm, data, columnMapping, selectedIds]);

  const handleDownloadCSV = useCallback(() => {
    if (!data) return;

    const headers = data.rawData.headers.join(",");
    const rows = data.rawData.rows
      .map((row) => row.join(","))
      .join("\n");
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preview-transactions.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast.success("CSV téléchargé");
  }, [data]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!data) return null;

  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-[#050505] overflow-hidden">
      {/* Header avec titre et bouton fermer */}
      <div className="flex-shrink-0 border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Eye className="w-5 h-5 text-cyan-400" />
              Aperçu de l'importation
            </h2>
            <p className="text-sm text-white/40 mt-1">
              Vérifiez et ajustez les transactions détectées dans votre fichier CSV avant l'importation.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 px-6 py-4 border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setCurrentStep("preview")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm",
              currentStep === "preview"
                ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300"
                : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10",
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                currentStep === "preview"
                  ? "bg-cyan-500 text-white"
                  : "bg-white/10 text-white/40",
              )}
            >
              1
            </div>
            <span>Aperçu</span>
          </button>

          <ArrowRight className="w-4 h-4 text-white/20" />

          <button
            onClick={() => setCurrentStep("mapping")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm",
              currentStep === "mapping"
                ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300"
                : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10",
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                currentStep === "mapping"
                  ? "bg-cyan-500 text-white"
                  : "bg-white/10 text-white/40",
              )}
            >
              2
            </div>
            <span>Mapping (optionnel)</span>
          </button>

          <ArrowRight className="w-4 h-4 text-white/20" />

          <button
            onClick={() => setCurrentStep("balance")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm",
              currentStep === "balance"
                ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300"
                : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10",
            )}
          >
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                currentStep === "balance"
                  ? "bg-cyan-500 text-white"
                  : "bg-white/10 text-white/40",
              )}
            >
              3
            </div>
            <span>Solde (optionnel)</span>
          </button>
        </div>

      {/* Conteneur de scroll */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar px-6">
        <div className="space-y-4 py-4">
            {/* ========== ÉTAPE 1 : APERÇU ========== */}
            {currentStep === "preview" && (
            <>
              {/* Stats - ✅ Optimisé pour gagner de l'espace */}
              <div className="grid grid-cols-5 gap-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-white/40" />
                    <span className="text-[10px] text-white/40 font-medium">
                      Total
                    </span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {stats.total}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[10px] text-yellow-400 font-medium">
                      Doublons
                    </span>
                  </div>
                  <div className="text-xl font-black text-yellow-400">
                    {stats.duplicates}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Revenus
                    </span>
                  </div>
                  <div className="text-base font-black text-emerald-400">
                    +{formatCurrency(stats.income)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] text-red-400 font-medium">
                      Dépenses
                    </span>
                  </div>
                  <div className="text-base font-black text-red-400">
                    {formatCurrency(stats.expenses)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[10px] text-cyan-400 font-medium">
                      Solde fichier
                    </span>
                  </div>
                  <div className="text-base font-black text-cyan-400">
                    {formatCurrency(stats.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {stats.duplicates > 0 && (
                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-yellow-400">
                      {stats.duplicates} doublon
                      {stats.duplicates > 1 ? "s" : ""}{" "}
                      potentiel{stats.duplicates > 1 ? "s" : ""}{" "}
                      détecté{stats.duplicates > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-yellow-400/80 mt-1">
                      Ces transactions semblent déjà exister
                      dans votre base de données. Elles ont été
                      désélectionnées automatiquement.
                    </p>
                  </div>
                </div>
              )}

              {/* Selection Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-2" />
                  Tout sélectionner
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs"
                >
                  <X className="w-3.5 h-3.5 mr-2" />
                  Tout désélectionner
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectOnlyValid}
                  className="bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-2" />
                  Sélectionner uniquement les valides
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCSV}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs ml-auto"
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  Télécharger CSV
                </Button>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-white/40 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Transactions ({data.results.length})
                </h3>

                {/* ✅ CORRECTION : En-tête aligné sur la grille des lignes */}
{/* ✅ CORRECTION : En-tête aligné sur la nouvelle grille à 5 colonnes */}
<div className="flex items-center gap-4 px-3 py-2 bg-white/5 rounded-t-xl border border-white/10">
  <div className="w-5 flex-shrink-0"></div> {/* Espace checkbox */}
  <div className="flex-1 grid grid-cols-[100px_1fr_120px_140px_140px] gap-4 text-[10px] font-bold uppercase tracking-wider text-white/40">
    <div className="truncate">Date</div>
    <div className="truncate">Description</div>
    <div className="text-right truncate">Montant</div>
    <div className="text-center truncate">Catégorie</div>
    <div className="text-center truncate text-cyan-400">Sous-Catégorie</div> {/* Titre ajouté */}
  </div>
  <div className="w-20 flex-shrink-0"></div> {/* Espace badge doublon */}
</div>

                <ScrollArea className="h-[500px] rounded-b-xl border-x border-b border-white/10 p-4">
                  <div className="space-y-2">
                  {mappedResults.map((result) => (
                      <TransactionPreviewRow
                        key={result.transaction.id}
                        result={result}
                        isSelected={selectedIds.has(
                          result.transaction.id,
                        )}
                        onToggle={() =>
                          handleToggle(result.transaction.id)
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}

          {/* ========== ÉTAPE 2 : MAPPING ========== */}
{/* ========== ÉTAPE 2 : MAPPING ========== */}
{currentStep === "mapping" && (
  <div className="space-y-6 py-4 max-w-2xl mx-auto">
    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-start gap-3">
      <Settings2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-cyan-400">Configuration des colonnes</p>
        <p className="text-xs text-cyan-400/80 mt-1">
          Si les données ne semblent pas correctes, ajustez la correspondance entre les colonnes de votre CSV et les champs de l'application.
        </p>
      </div>
    </div>

    <div className="grid gap-4">
      {/* Liste des champs incluant maintenant 'subCategory' */}
      {['date', 'description', 'amount', 'category', 'subCategory'].map((field) => (
        <div key={field} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white capitalize">
              {field === 'subCategory' ? 'Sous-Catégorie' : field}
            </span>
            <span className="text-[10px] text-white/40">
              {field === 'subCategory' ? 'Champ optionnel' : "Champ requis pour l'import"}
            </span>
          </div>
          <Select 
            value={columnMapping[field] || "none"} 
            onValueChange={(val) => setColumnMapping(prev => ({ ...prev, [field]: val }))}
          >
            <SelectTrigger className="w-[240px] bg-black/40 border-white/10 text-white">
              <SelectValue placeholder="Choisir une colonne..." />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
              <SelectItem value="none" className="text-white/40 italic">Ne pas mapper</SelectItem>
              {data.rawData.headers.map((header) => (
                <SelectItem key={header} value={header}>{header}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>

    {/* Aperçu des données brutes pour aider au mapping */}
    <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-dashed border-white/10">
      <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Info className="w-3 h-3" />
        Aperçu des premières lignes du fichier
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] text-left text-white/60">
          <thead>
            <tr>
              {data.rawData.headers.slice(0, 6).map(h => (
                <th key={h} className="pb-2 pr-4 font-bold text-cyan-400/70">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rawData.rows.slice(0, 3).map((row, i) => (
              <tr key={i} className="border-t border-white/5">
                {row.slice(0, 6).map((cell, j) => (
                  <td key={j} className="py-2 pr-4 truncate max-w-[120px]" title={cell}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

          {/* ========== ÉTAPE 3 : AJUSTEMENT DE SOLDE ========== */}
          {currentStep === "balance" && (
            <div className="max-w-md mx-auto space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">
                    Solde actuel en base
                  </p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(currentDatabaseBalance)}
                  </p>
                </div>

                <div className="p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-center">
                  <p className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider mb-1">
                    Total à importer
                  </p>
                  <p className="text-xl font-bold text-cyan-400">
                    {totalFileAmount >= 0 ? "+" : ""}
                    {formatCurrency(totalFileAmount)}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-gray-800 to-black rounded-3xl text-center border border-white/10 shadow-xl">
                <p className="text-sm text-white/60 mb-1">
                  Solde final théorique attendu
                </p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(theoreticalFinalBalance)}
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  Quel est votre solde réel actuel ?
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={currentBalance}
                    onChange={(e) =>
                      setCurrentBalance(e.target.value)
                    }
                    placeholder="Saisir le montant de votre banque..."
                    className="w-full p-4 text-xl font-bold border-2 border-white/10 rounded-2xl focus:border-cyan-500 bg-white/5 text-white outline-none transition-all shadow-inner placeholder:text-white/20"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">
                    €
                  </div>
                </div>

                {currentBalance && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-amber-400 italic bg-amber-500/10 p-3 rounded-xl border border-amber-500/20"
                  >
                    <strong>Note :</strong> Une écriture
                    d'ajustement de
                    <span className="font-bold underline mx-1">
                      {formatCurrency(
                        parseFloat(currentBalance) -
                          theoreticalFinalBalance,
                      )}
                    </span>
                    sera créée pour équilibrer vos comptes.
                  </motion.p>
                )}
              </div>
            </div>
          )}
          </div>
        </div>

{/* Actions Footer */}
<div className="flex gap-3 px-6 py-4 mt-auto border-t border-white/5 bg-[#050505] flex-shrink-0">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          <X className="w-4 h-4 mr-2" />
          Annuler
        </Button>

        <div className="flex-1" />

        {currentStep === "preview" && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep("mapping")}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Configurer Mapping
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentStep("balance")}
              className="bg-cyan-500 text-white hover:bg-cyan-600"
            >
              Suivant : Solde
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {currentStep === "mapping" && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep("preview")}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Retour
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentStep("balance")}
              className="bg-cyan-500 text-white hover:bg-cyan-600"
            >
              Vérifier le solde
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}

        {currentStep === "balance" && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep("preview")} // Retour au début pour corriger la sélection
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Modifier la sélection
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-8"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Lancer l'importation ({selectedIds.size})
            </Button>
          </>
        )}
      </div>
    </div>
  );
}