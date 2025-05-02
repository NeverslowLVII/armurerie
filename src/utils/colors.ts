// Fonction pour générer une couleur pastel unique basée sur une chaîne
/*
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const codePoint = str.codePointAt(i) || 0; // Add fallback to 0 if undefined
    hash = codePoint + ((hash << 5) - hash);
  }

  // Générer des composantes HSL pour des couleurs pastel
  const h = Math.abs(hash) % 360; // Teinte
  const s = 50 + (Math.abs(hash) % 30); // Saturation entre 50% et 80%
  const l = 80 + (Math.abs(hash) % 10); // Luminosité entre 80% et 90%

  return `hsl(${h}, ${s}%, ${l}%)`;
}
*/

// Fonction pour générer une couleur de texte contrastée
/*
function getContrastTextColor(backgroundColor: string): string {
  // Extraire les valeurs HSL
  const matches = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!matches) return 'black';

  const l = Number.parseInt(matches[3]); // Luminosité
  return l > 65 ? '#374151' : 'white'; // Gris foncé ou blanc selon la luminosité
}
*/

// Function to calculate relative luminance
const getLuminance = (r: number, g: number, b: number) => {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const normalizedC = c / 255; // Assign to new variable
    return normalizedC <= 3.928e-2
      ? normalizedC / 12.92
      : ((normalizedC + 5.5e-2) / 1.055) ** 2.4;
  });
  return 2.126e-1 * rs + 7.152e-1 * gs + 7.22e-2 * bs;
};

// Function to calculate contrast ratio
const getContrastRatio = (l1: number, l2: number) => {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

// Keep our existing WCAG-compliant version as the default
export const getTextColorForBackground = (
  backgroundColor: string
): 'text-white' | 'text-neutral-900' => {
  // Default to white text if no background color is provided
  if (!backgroundColor) return 'text-white';

  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);

  // Calculate luminance using WCAG formula
  const bgLuminance = getLuminance(r, g, b);
  const whiteLuminance = getLuminance(255, 255, 255);
  const blackLuminance = getLuminance(0, 0, 0);

  // Calculate contrast ratios
  const whiteContrast = getContrastRatio(whiteLuminance, bgLuminance);
  const blackContrast = getContrastRatio(blackLuminance, bgLuminance);

  // Return the color with better contrast ratio
  return whiteContrast > blackContrast ? 'text-white' : 'text-neutral-900';
};
