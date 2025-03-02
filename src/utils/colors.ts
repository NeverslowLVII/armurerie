// Fonction pour générer une couleur pastel unique basée sur une chaîne
export function stringToColor(str: string): string {
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
  
  // Fonction pour générer une couleur de texte contrastée
  export function getContrastTextColor(backgroundColor: string): string {
    // Extraire les valeurs HSL
    const matches = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!matches) return 'black';
  
    const l = Number.parseInt(matches[3]); // Luminosité
    return l > 65 ? '#374151' : 'white'; // Gris foncé ou blanc selon la luminosité
  } 