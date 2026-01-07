#!/bin/bash

# --- Création des nouveaux répertoires si nécessaire ---
mkdir -p components/dashboard
mkdir -p hooks

# --- Création des fichiers dans /components/dashboard/ ---
touch components/dashboard/EnhancedFinancialWidget.tsx
touch components/dashboard/KPIMetric.tsx
touch components/dashboard/MiniLineChart.tsx
touch components/dashboard/DetailedBarChart.tsx
touch components/dashboard/CategoryBreakdown.tsx
touch components/dashboard/PeriodSelector.tsx
touch components/dashboard/ExportCSVButton.tsx

# --- Création des fichiers dans /hooks/ ---
touch hooks/useFinancialKPIs.ts
touch hooks/useChartData.ts

echo "✅ Tous les nouveaux fichiers ont été créés avec succès."
echo "Prochaine étape : remplir le contenu de ces fichiers."