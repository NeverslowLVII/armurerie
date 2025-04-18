#!/usr/bin/env node

/**
 * Script de vérification complète avant déploiement
 * Exécute une série de vérifications pour s'assurer que le projet est prêt pour déploiement
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const reportDir = path.join(rootDir, 'reports');

// Parse command line arguments
const args = process.argv.slice(2);
const skipKnip = args.includes('--skip-knip');

// Couleurs pour le terminal
const colors = {
  reset: '1B[0M',
  red: '1B[31m',
  green: '1B[32m',
  yellow: '1B[33m',
  blue: '1B[34m',
  magenta: '1B[35m',
  cyan: '1B[36m',
  white: '1B[37m',
};

// Créer le répertoire de rapports s'il n'existe pas
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Define a constant file path
const REPORT_PATH = path.join(reportDir, 'latest-deploy-check.txt');

let report = '';

function appendReport(text) {
  report += text + '\n';
}

function logAndReport(text, color = colors.white) {
  console.log(color + text + colors.reset);
  appendReport(text);
}

function executeCommand(command, description) {
  logAndReport(`\n=== ${description} ===`, colors.cyan);
  logAndReport(`Commande: ${command}`, colors.blue);

  try {
    const output = execSync(command, { cwd: rootDir, encoding: 'utf8' });
    logAndReport('Status: SUCCÈS ✓', colors.green);
    return { success: true, output };
  } catch (error) {
    logAndReport(`Status: ÉCHEC ✗`, colors.red);
    logAndReport(`Erreur: ${error.message}`, colors.red);
    return { success: false, output: error.message };
  }
}

async function promptToContinue() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(
      colors.yellow + 'Voulez-vous continuer malgré les erreurs? (o/n) ' + colors.reset,
      answer => {
        rl.close();
        resolve(answer.toLowerCase() === 'o');
      }
    );
  });
}

// Extracted function for build checks
async function performBuildCheck() {
  let buildOutput = '';
  try {
    buildOutput = execSync('npm run build', { cwd: rootDir, encoding: 'utf8' });
    logAndReport('\n=== Build du projet ===', colors.cyan);
    logAndReport('Commande: npm run build', colors.blue);

    if (buildOutput.includes('Dynamic server usage')) {
      logAndReport('Status: SUCCÈS AVEC AVERTISSEMENTS ⚠️', colors.yellow);
      logAndReport('Note: Des routes dynamiques ont été détectées...', colors.yellow);
      handleDynamicRoutes(buildOutput);
    } else {
      logAndReport('Status: SUCCÈS ✓', colors.green);
    }
    return { success: true, output: buildOutput };
  } catch (error) {
    logAndReport('\n=== Build du projet ===', colors.cyan);
    logAndReport('Commande: npm run build', colors.blue);
    logAndReport(`Status: ÉCHEC ✗`, colors.red);
    logAndReport(`Erreur: ${error.message}`, colors.red);
    return { success: false, output: error.message };
  }
}

// Extract dynamic routes handling
function handleDynamicRoutes(buildOutput) {
  const dynamicRoutes =
    buildOutput.match(/Route\s+([^\s]+)\s+couldn't be rendered statically/g) || [];
  if (dynamicRoutes.length > 0) {
    logAndReport('Routes dynamiques:', colors.yellow);
    for (const route of dynamicRoutes) {
      logAndReport(
        `- ${route.replaceAll('Route', '').replaceAll("couldn't be rendered statically", '')}`,
        colors.yellow
      );
    }
  }
  logAndReport('Ces avertissements peuvent être ignorés...', colors.yellow);
}

// Simplify runChecks to use these extracted functions
async function runChecks() {
  logAndReport('=== RAPPORT DE PRÉ-DÉPLOIEMENT ===', colors.magenta);
  logAndReport(`Date: ${new Date().toLocaleString()}`, colors.white);

  // Run all checks
  const results = await runAllChecks();

  // Process results and generate report
  await handleResults(results);
}

async function runAllChecks() {
  const results = [];

  // Vérification 1: ESLint - Analyse statique du code
  const lintResult = executeCommand('npm run lint', 'Vérification du lint (ESLint)');
  results.push(lintResult);

  // Vérification 2: TypeScript - Vérification des types
  const typesResult = executeCommand('npm run check-types', 'Vérification des types TypeScript');
  results.push(typesResult);

  // Vérification 3: Tests unitaires (si applicable)
  // const testsResult = executeCommand('npm test', 'Exécution des tests unitaires');

  // Vérification 4: Recherche de code mort avec Knip (optional)
  const knipResult = skipKnip
    ? { success: true, output: 'Vérification ignorée (--skip-knip)' }
    : executeCommand('npm run knip', 'Recherche de code mort (Knip)');
  results.push(knipResult);

  if (skipKnip) {
    logAndReport('Recherche de code mort (Knip)', colors.cyan);
    logAndReport('Status: IGNORÉ (--skip-knip) ⚠️', colors.yellow);
  }

  // Vérification 5: Recherche d'exports non utilisés avec ts-prune
  const pruneResult = executeCommand(
    'npm run find-unused',
    "Recherche d'exports non utilisés (ts-prune)"
  );
  results.push(pruneResult);

  // Vérification 6: Dépendances non utilisées
  const depcheckResult = executeCommand(
    'npx depcheck --ignores="autoprefixer,postcss,lint-staged,prettier-plugin-tailwindcss"',
    'Vérification des dépendances non utilisées'
  );
  results.push(depcheckResult);

  // Vérification 7: Formatage du code
  const prettierResult = executeCommand('npm run format', 'Formatage du code (Prettier)');
  results.push(prettierResult);

  // Vérification 8: Code dupliqué
  const duplicateResult = executeCommand('npm run find-duplicates', 'Recherche de code dupliqué');
  results.push(duplicateResult);

  // Vérification 9: Build de test
  const buildResult = await performBuildCheck();
  results.push(buildResult);

  // Vérification 10: Validité du schema Prisma
  const prismaValidateResult = executeCommand('npx prisma validate', 'Validation du schema Prisma');
  results.push(prismaValidateResult);

  return results;
}

async function handleResults(results) {
  const failedChecks = results.filter(r => !r.success).length;
  const totalChecks = results.length;

  logAndReport('\n=== RÉSUMÉ ===', colors.magenta);
  logAndReport(`Total des vérifications: ${totalChecks}`, colors.white);
  logAndReport(`Réussies: ${totalChecks - failedChecks}`, colors.green);
  logAndReport(`Échouées: ${failedChecks}`, failedChecks > 0 ? colors.red : colors.green);

  // Écrire le rapport dans un fichier
  if (!REPORT_PATH.startsWith(path.normalize(reportDir))) {
    throw new Error('Invalid report file path');
  }

  // Write the report to the fixed location
  fs.writeFileSync(REPORT_PATH, report);
  logAndReport(`\nRapport enregistré dans: ${REPORT_PATH}`, colors.blue);

  if (failedChecks > 0) {
    logAndReport(
      '\n⚠️  Des problèmes ont été détectés. Veuillez les corriger avant de déployer.',
      colors.yellow
    );
    const continueAnyway = await promptToContinue();

    if (!continueAnyway) {
      logAndReport("Opération annulée par l'utilisateur.", colors.yellow);
      process.exit(1);
    }

    logAndReport('Continuation malgré les erreurs...', colors.yellow);
  } else {
    logAndReport(
      '\n✅ Toutes les vérifications ont été passées avec succès! Le projet est prêt à être déployé.',
      colors.green
    );
  }
}

try {
  await runChecks();
} catch (error) {
  logAndReport(`\nUne erreur inattendue s'est produite: ${error.message}`, colors.red);
  process.exit(1);
}
