const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');

// Définition des correspondances (Ancien -> Nouveau)
const hookMapping = {
    'useChartData': { newName: 'useCharts', file: 'use-charts' },
    'useFinancialKPIs': { newName: 'useFinance', file: 'use-finance' },
    'useRecentTransactions': { newName: 'useFinance', file: 'use-finance' },
    'useRuleViolationsCache': { newName: 'useRules', file: 'use-rules' },
    'useDebouncedValue': { newName: 'useDebouncedValue', file: 'use-performance' },
    'useDebounce': { newName: 'useDebounce', file: 'use-performance' },
    'useLock': { newName: 'useLock', file: 'use-performance' }
};

function refactorFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let hasChanged = false;

    // 1. Remplacement des noms de fonctions dans le code
    Object.keys(hookMapping).forEach(oldName => {
        const { newName } = hookMapping[oldName];
        if (content.includes(oldName)) {
            // Utilise une regex pour ne remplacer que le mot exact (pas dans d'autres mots)
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');
            content = content.replace(regex, newName);
            hasChanged = true;
        }
    });

    // 2. Mise à jour des lignes d'imports
    // Cette regex capture : import { ... } from '@/hooks/...' ou '../hooks/...'
    content = content.replace(/from\s+['"]([^'"]*hooks\/)([^'"]+)['"]/g, (match, pathPrefix, fileName) => {
        // On cherche si l'un de nos nouveaux fichiers doit remplacer l'ancien
        for (const key in hookMapping) {
            if (fileName.includes(key)) {
                hasChanged = true;
                return `from '${pathPrefix}${hookMapping[key].file}'`;
            }
        }
        return match;
    });

    if (hasChanged) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ REFACTO : ${path.relative(srcPath, filePath)}`);
    }
}

function scan(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scan(fullPath);
        } else if (/\.(ts|tsx)$/.test(file)) {
            refactorFile(fullPath);
        }
    });
}

console.log("🚀 Alignement des composants sur la nouvelle architecture hooks...");
scan(srcPath);
console.log("✨ Terminé ! Tous les imports sont synchronisés.");