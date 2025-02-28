module.exports = {
  // Dossier racine du projet
  srcDir: 'src',

  // Extensions de fichiers à analyser
  extensions: ['.tsx', '.ts'],

  // Fichiers à toujours considérer comme utilisés
  essentialFiles: [
    // Next.js essential files
    'app/page.tsx',
    'app/layout.tsx',
    'app/providers.tsx',
    'middleware.ts',
    // API routes
    'app/api/weapons/route.ts',
    'app/api/weapons/[id]/route.ts',
    'app/api/feedback/route.ts',
    'app/api/employees/route.ts',
    // Config files
    'config/defaults.ts',
    // Core utilities
    'lib/auth.ts',
    'lib/email.ts',
    'lib/init.ts',
    'lib/tokens.ts',
    // Hooks and stores
    'hooks/use-toast.ts',
    'stores/employeeStore.ts',
    // Utils
    'utils/roles.ts',
    'utils/format.ts',
    'utils/email.ts',
    'utils/colors.ts',
  ],

  // Motifs de fichiers à ignorer
  ignorePatterns: [
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.stories.*',
    '**/*.d.ts',
    '**/types.ts',
    '**/types/*.ts',
    'jest.setup.ts',
  ],

  // Dossiers à ignorer
  ignoreDirs: [
    'node_modules',
    '.next',
    'dist',
    'build',
    'coverage',
    '.git',
    'public',
    'scripts',
  ],
}; 