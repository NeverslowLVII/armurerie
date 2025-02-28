import fs from 'fs';
import path from 'path';
const glob = require('glob');

interface FileInfo {
  file: string;
  content: string;
}

interface Config {
  // Dossier source à analyser
  srcDir: string;
  // Extensions de fichiers à analyser
  extensions: string[];
  // Fichiers à toujours considérer comme utilisés (chemins relatifs au srcDir)
  essentialFiles: string[];
  // Motifs de fichiers à ignorer
  ignorePatterns: string[];
  // Dossiers à ignorer
  ignoreDirs: string[];
}

// Configuration par défaut
const defaultConfig: Config = {
  srcDir: 'src',
  extensions: ['.tsx', '.ts', '.jsx', '.js'],
  essentialFiles: [
    // Next.js essential files
    'app/page.tsx',
    'app/layout.tsx',
    'pages/_app.tsx',
    'pages/index.tsx',
    // Remix essential files
    'root.tsx',
    'entry.client.tsx',
    'entry.server.tsx',
    // Gatsby essential files
    'gatsby-browser.js',
    'gatsby-config.js',
    'gatsby-node.js',
    'gatsby-ssr.js',
  ],
  ignorePatterns: [
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.stories.*',
    '**/*.d.ts',
  ],
  ignoreDirs: [
    'node_modules',
    '.next',
    'dist',
    'build',
    'coverage',
  ],
};

// Fonction pour lire la configuration personnalisée
function loadConfig(): Config {
  const configPath = path.join(process.cwd(), 'unused-files.config.js');
  let customConfig = {};
  
  if (fs.existsSync(configPath)) {
    try {
      customConfig = require(configPath);
    } catch (error) {
      console.warn('Warning: Error loading custom config, using defaults', error);
    }
  }
  
  return { ...defaultConfig, ...customConfig };
}

// Fonction pour trouver tous les fichiers correspondant aux critères
function findAllFiles(config: Config): string[] {
  const patterns = config.extensions.map(ext => `**/*${ext}`);
  const allFiles: string[] = [];
  
  try {
    patterns.forEach(pattern => {
      const files = glob.sync(pattern, {
        cwd: path.join(process.cwd(), config.srcDir),
        ignore: [...config.ignorePatterns, ...config.ignoreDirs.map(dir => `${dir}/**`)],
        nodir: true,
        absolute: false
      });
      allFiles.push(...files);
    });
  } catch (error) {
    console.error('Erreur lors de la recherche des fichiers :', error);
    process.exit(1);
  }
  
  return allFiles;
}

// Fonction pour lire le contenu de tous les fichiers
function readAllFiles(files: string[], config: Config): FileInfo[] {
  return files.map((file: string) => {
    const fullPath = path.join(process.cwd(), config.srcDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return { file, content };
  });
}

// Fonction pour trouver les imports dans un fichier
function findImports(content: string): string[] {
  const imports: string[] = [];
  
  // Import statiques
  const staticImportRegex = /import(?:["'\s]*([\w*{}\n\r\t, ]+)from\s*)?["'\s]["'\s](.*?)["'\s]/g;
  let match;
  while ((match = staticImportRegex.exec(content)) !== null) {
    imports.push(match[2]);
  }
  
  // Import dynamiques
  const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Require
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // React.lazy
  const lazyRegex = /React\.lazy\(\s*\(?[^=>]*=>\s*import\(['"]([^'"]+)['"]\)/g;
  while ((match = lazyRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Fonction pour résoudre le chemin d'import
function resolveImportPath(importPath: string, currentFile: string, allFiles: string[], config: Config): string | null {
  if (!importPath.startsWith('.')) return null;
  
  const normalized = path.normalize(path.join(path.dirname(currentFile), importPath));
  
  // Vérifier toutes les extensions possibles
  for (const ext of config.extensions) {
    const possibilities = [
      normalized + ext,
      normalized + '/index' + ext,
      normalized.replace(/\/index$/, '') + ext,
    ];
    
    for (const possibility of possibilities) {
      if (allFiles.includes(possibility)) {
        return possibility;
      }
    }
  }
  
  return null;
}

// Fonction principale
function findUnusedFiles(): void {
  try {
    const config = loadConfig();
    
    // Vérifier si le dossier source existe
    const srcPath = path.join(process.cwd(), config.srcDir);
    if (!fs.existsSync(srcPath)) {
      console.error(`Erreur : Le dossier source '${config.srcDir}' n'existe pas.`);
      process.exit(1);
    }
    
    const allFiles = findAllFiles(config);
    
    if (allFiles.length === 0) {
      console.log(`Aucun fichier trouvé dans '${config.srcDir}' avec les extensions : ${config.extensions.join(', ')}`);
      return;
    }
    
    const fileInfos = readAllFiles(allFiles, config);
    const usedFiles = new Set<string>();
    
    // Marquer les fichiers essentiels comme utilisés
    config.essentialFiles.forEach(file => {
      if (allFiles.includes(file)) {
        usedFiles.add(file);
      }
    });
    
    // Trouver tous les imports
    fileInfos.forEach(({ file, content }) => {
      const imports = findImports(content);
      imports.forEach(imp => {
        const resolvedPath = resolveImportPath(imp, file, allFiles, config);
        if (resolvedPath) {
          usedFiles.add(resolvedPath);
        }
      });
    });
    
    // Trouver les fichiers non utilisés
    const unusedFiles = allFiles.filter(file => !usedFiles.has(file));
    
    // Afficher les résultats
    if (unusedFiles.length === 0) {
      console.log('Aucun fichier inutilisé trouvé !');
      return;
    }
    
    console.log('Fichiers potentiellement non utilisés :');
    console.log('=====================================');
    unusedFiles.forEach((file: string) => {
      console.log(`- ${file}`);
    });
    console.log('\nNote : Certains fichiers peuvent être chargés dynamiquement ou utilisés d\'une manière qui n\'est pas détectable par ce script.');
    console.log('Vérifiez manuellement avant de supprimer des fichiers.');
    
  } catch (error) {
    console.error('Une erreur est survenue :', error);
    process.exit(1);
  }
}

// Exécuter le script
findUnusedFiles(); 