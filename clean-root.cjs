const fs = require('fs');
const path = require('path');

const filesToDelete = [
    'fix-ringcolor.js',
    'audit-imports.cjs',
    'all-imports-report.json',
    'arborescence.txt',
    'create_files.sh',
    'finish-him.cjs',
    'fix-imports-final.cjs',
    'map-imports.js',
    'migrate-to-src.sh',
    'ultimate-fix-v2.cjs'
];

console.log("🧹 Début du nettoyage de la racine...");

filesToDelete.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`✅ Supprimé : ${file}`);
        } catch (err) {
            console.error(`❌ Erreur sur ${file}:`, err.message);
        }
    } else {
        console.log(`ℹ️ Déjà absent : ${file}`);
    }
});

console.log("✨ Racine nettoyée ! N'oublie pas de supprimer manuellement useDebounce.ts (racine uniquement).");