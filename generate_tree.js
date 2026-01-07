import fs from 'fs/promises';
import path from 'path';

// Dossiers et fichiers à ignorer pour un rapport concis
const IGNORE = [
    'node_modules', 
    '.git', 
    'dist', 
    '.vscode',
    'package-lock.json', 
    'yarn.lock',
    'generate_tree.js',
    'test-path.js' // Ignore le script de test précédent
];

/**
 * Affiche récursivement l'arborescence du répertoire.
 * @param {string} dir Le répertoire à parcourir.
 * @param {string} prefix Le préfixe d'indentation.
 */
async function walkDir(dir, prefix = '') {
    // Lecture du répertoire (fichiers et dossiers)
    let files;
    try {
        files = await fs.readdir(dir);
    } catch (e) {
        // En cas d'erreur de lecture (par exemple, permissions), on arrête.
        console.error(`Erreur de lecture du répertoire: ${dir}`);
        return;
    }

    // Filtrer les éléments à ignorer
    files = files.filter(file => !IGNORE.includes(file));

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fullPath = path.join(dir, file);
        
        let stats;
        try {
            stats = await fs.stat(fullPath);
        } catch (e) {
            continue; // Ignorer les liens brisés ou les erreurs de stat
        }

        const isDirectory = stats.isDirectory();
        const isLast = i === files.length - 1;
        
        // Déterminer le symbole d'affichage de l'arborescence
        const symbol = isLast ? '└── ' : '├── ';
        
        // Afficher l'élément
        console.log(`${prefix}${symbol}${file}${isDirectory ? '/' : ''}`);

        // Appel récursif pour les sous-dossiers
        if (isDirectory) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            await walkDir(fullPath, newPrefix);
        }
    }
}

async function main() {
    const rootDir = process.cwd(); // Commence à la racine du projet
    console.log(`Arborescence du projet (racine: ${path.basename(rootDir)}/):\n`);
    await walkDir(rootDir);
    console.log('\n--- Fin du rapport ---');
}

main().catch(console.error);

/**
 * Pour l'utiliser: 
 * 1. Assurez-vous d'avoir ce fichier generate_tree.js à la racine.
 * 2. Exécutez dans votre terminal: node generate_tree.js
 * 3. Copiez/collez le résultat.
 */