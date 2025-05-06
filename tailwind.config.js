const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Utilise la classe .dark sur <html>
  theme: {
    extend: {
      colors: {
        // Redéfinir la couleur blanche pour être légèrement grise
        white: colors.neutral[50], // Remplacer le blanc pur (back to neutral[50])

        // Redéfinir les couleurs de base pour un thème clair plus doux
        // Utilise neutral-50 (gris très clair) comme fond par défaut
        // Utilise neutral-900 (gris foncé) comme texte par défaut
        light: {
          background: colors.neutral[50],
          foreground: colors.neutral[900],
        },
        // Couleurs pour le thème sombre (peut être ajusté si nécessaire)
        dark: {
          background: colors.neutral[950], // Un gris très très foncé
          foreground: colors.neutral[200],
        },
        // Vous pouvez garder ou redéfinir d'autres couleurs
        primary: {
          DEFAULT: colors.red[600],
          foreground: colors.white, // This should now use neutral[50]
        },
        secondary: {
          DEFAULT: colors.orange[500],
          foreground: colors.white, // This should now use neutral[50]
        },
        // Assurer que les couleurs `background` et `foreground` de base sont définies
        // pour être utilisées implicitement par Tailwind (ex: bg-background)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}; 