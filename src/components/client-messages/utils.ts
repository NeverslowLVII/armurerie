import type { Weapon } from '@/services/api';
import {
  getMessageTemplateById,
  getRandomFormulePolitesse,
  getRandomSalutation,
} from './messageTemplates';

// Fonction pour calculer la similarité entre deux chaînes
// Implémentation d'une version améliorée avec plusieurs algorithmes
export const calculateSimilarity = (s1: string, s2: string): number => {
  if (!s1 || !s2) return 0;

  const str1 = s1.toLowerCase().trim();
  const str2 = s2.toLowerCase().trim();

  // Si les chaînes sont identiques, la similarité est de 1
  if (str1 === str2) return 1;

  // Si une chaîne est contenue entièrement dans l'autre, forte similarité
  if (str1.includes(str2) || str2.includes(str1)) {
    const lengthRatio =
      Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);
    // Plus les longueurs sont similaires, plus la similarité est élevée
    return 0.7 + lengthRatio * 0.3;
  }

  // Similarité de Jaccard (basée sur les ensembles de caractères)
  const set1 = new Set(str1);
  const set2 = new Set(str2);

  const intersection = new Set([...set1].filter((x) => set2.has(x)));

  const jaccardSimilarity =
    intersection.size / (set1.size + set2.size - intersection.size);

  // Distance de Levenshtein (basée sur l'édition)
  const levenshteinDistance = levenshtein(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  const levenshteinSimilarity =
    maxLength === 0 ? 1 : 1 - levenshteinDistance / maxLength;

  // Similarité des n-grammes (comparer les sous-séquences)
  const ngramSimilarity = calculateNgramSimilarity(str1, str2, 2); // bigrammes

  // Similarité de préfixe (les débuts des mots sont-ils identiques?)
  const prefixLength = commonPrefixLength(str1, str2);
  const prefixSimilarity = prefixLength / Math.min(str1.length, str2.length);

  // Poids dynamiques basés sur le type de différence
  let jaroWeight = 0.2;
  let levenWeight = 0.4;
  let ngramWeight = 0.2;
  let prefixWeight = 0.2;

  // Ajuster les poids en fonction des caractéristiques des chaînes
  if (Math.abs(str1.length - str2.length) > 3) {
    // Si les longueurs sont très différentes, donner plus de poids à Jaro
    jaroWeight = 0.4;
    levenWeight = 0.3;
    ngramWeight = 0.2;
    prefixWeight = 0.1;
  } else if (prefixLength > 2) {
    // Si elles commencent de la même façon, augmenter le poids du préfixe
    prefixWeight = 0.3;
    jaroWeight = 0.2;
    levenWeight = 0.3;
    ngramWeight = 0.2;
  }

  // Moyenne pondérée avec des poids dynamiques
  const weightedSimilarity =
    jaccardSimilarity * jaroWeight +
    levenshteinSimilarity * levenWeight +
    ngramSimilarity * ngramWeight +
    prefixSimilarity * prefixWeight;

  // Appliquer une correction non linéaire pour mieux distribuer les valeurs
  return adjustSimilarityDistribution(weightedSimilarity);
};

// Calcule la distance de Levenshtein entre deux chaînes
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  // Initialisation de la matrice
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Remplissage de la matrice
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // suppression
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

// Calcule la similarité basée sur les n-grammes
function calculateNgramSimilarity(s1: string, s2: string, n: number): number {
  if (s1.length < n || s2.length < n) return 0;

  // Génération des n-grammes
  const getNgrams = (str: string, n: number) => {
    const ngrams = new Set<string>();
    for (let i = 0; i <= str.length - n; i++) {
      ngrams.add(str.slice(i, i + n));
    }
    return ngrams;
  };

  const ngrams1 = getNgrams(s1, n);
  const ngrams2 = getNgrams(s2, n);

  // Calcul de l'intersection
  const intersection = new Set([...ngrams1].filter((x) => ngrams2.has(x)));

  // Similarité de Dice
  return (2 * intersection.size) / (ngrams1.size + ngrams2.size);
}

// Calcule la longueur du préfixe commun entre deux chaînes
function commonPrefixLength(s1: string, s2: string): number {
  let i = 0;
  const minLength = Math.min(s1.length, s2.length);
  while (i < minLength && s1[i] === s2[i]) {
    i++;
  }
  return i;
}

// Fonction pour ajuster la distribution des scores de similarité
// pour éviter qu'ils se regroupent tous dans une plage étroite
function adjustSimilarityDistribution(similarity: number): number {
  // Étirer la plage des valeurs pour mieux les distribuer
  if (similarity > 0.8) {
    // Les valeurs élevées restent élevées
    return similarity;
  }
  if (similarity > 0.6) {
    // Légère réduction dans la plage moyenne-haute
    return 0.6 + (similarity - 0.6) * 0.8;
  }
  if (similarity > 0.4) {
    // Réduction plus importante dans la plage moyenne
    return 0.4 + (similarity - 0.4) * 0.7;
  }
  // Les faibles valeurs sont encore réduites
  return similarity * 0.8;
}

// Normalisation des noms de détenteurs pour la comparaison
export const normalizeDetenteur = (name: string): string => {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    .normalize('NFD') // Décomposer les caractères accentués
    .replaceAll(/\p{M}/gu, '') // Supprimer les marques combinatoires (accents)
    .replaceAll(/[^a-z0-9]/g, ' ') // Remplacer les caractères spéciaux par des espaces
    .replaceAll(/\s+/g, ' '); // Réduire les espaces multiples
};

// Interface pour les groupes de détenteurs similaires
export interface DetenteurGroup {
  names: string[];
  primaryName: string;
  weapons: Weapon[];
  totalSpent: number;
  lastPurchase: Date;
  purchaseCount: number;
}

// Fonction pour grouper les armes par détenteur en tenant compte des similarités
export const groupWeaponsByDetenteur = (
  weapons: Weapon[],
  similarityThreshold = 0.8
): DetenteurGroup[] => {
  const groups: Record<string, DetenteurGroup> = {};

  for (const weapon of weapons) {
    if (!weapon.detenteur) continue;

    const normalizedName = normalizeDetenteur(weapon.detenteur);

    // Chercher un groupe existant avec un nom similaire
    let foundGroup = false;
    for (const key in groups) {
      if (
        calculateSimilarity(
          normalizedName,
          normalizeDetenteur(groups[key].primaryName)
        ) >= similarityThreshold
      ) {
        // Ajouter au groupe existant
        if (!groups[key].names.includes(weapon.detenteur)) {
          groups[key].names.push(weapon.detenteur);
        }
        groups[key].weapons.push(weapon);
        groups[key].totalSpent += weapon.prix;

        // Mettre à jour la date du dernier achat si nécessaire
        const purchaseDate = new Date(weapon.horodateur);
        if (purchaseDate > groups[key].lastPurchase) {
          groups[key].lastPurchase = purchaseDate;
        }

        groups[key].purchaseCount += 1;
        foundGroup = true;
        break;
      }
    }

    // Si aucun groupe similaire n'est trouvé, créer un nouveau groupe
    if (!foundGroup) {
      groups[normalizedName] = {
        names: [weapon.detenteur],
        primaryName: weapon.detenteur,
        weapons: [weapon],
        totalSpent: weapon.prix,
        lastPurchase: new Date(weapon.horodateur),
        purchaseCount: 1,
      };
    }
  }

  // Convertir l'objet en tableau et le trier par montant total dépensé
  return Object.values(groups).sort((a, b) => b.totalSpent - a.totalSpent);
};

// Fonction pour générer des recommandations intelligentes basées sur l'historique d'achat
const generateSmartRecommendations = (
  group: DetenteurGroup
): {
  recommendations: string[];
  reasoning: string;
} => {
  const { weapons, totalSpent, purchaseCount } = group;

  // Extraire des informations pertinentes de l'historique d'achat
  const purchases = weapons.map((w) => ({
    name: w.nom_arme,
    price: w.prix,
    date: new Date(w.horodateur),
    type: categorizeWeapon(w.nom_arme),
  }));

  // Calculer la fourchette de prix habituelle
  const priceRangeMin = Math.min(...purchases.map((p) => p.price));
  const priceRangeMax = Math.max(...purchases.map((p) => p.price));
  const averagePrice = totalSpent / purchaseCount;

  // Identifier les catégories préférées
  const categories = purchases.map((p) => p.type);
  const categoryFrequency: Record<string, number> = {};
  for (const cat of categories) {
    categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
  }

  // Trouver la catégorie la plus fréquente
  const preferredCategory = Object.entries(categoryFrequency).sort(
    (a, b) => b[1] - a[1]
  )[0][0];

  // Vérifier la saisonnalité des achats
  const purchaseMonths = purchases.map((p) => p.date.getMonth());
  const monthFrequency: Record<number, number> = {};
  for (const month of purchaseMonths) {
    monthFrequency[month] = (monthFrequency[month] || 0) + 1;
  }

  // Trouver le mois avec le plus d'achats
  const preferredMonth = Object.entries(monthFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([month]) => Number(month))[0];

  // Générer des recommandations basées sur l'analyse
  const recommendations: string[] = [];
  let reasoning = '';

  // Recommandation basée sur la fourchette de prix
  const premiumThreshold = 50_000; // 500$
  if (averagePrice > premiumThreshold) {
    recommendations.push("nos pièces d'exception récemment importées d'Europe");
    reasoning += 'Client avec un budget élevé (achats moyens > 500$). ';
  } else {
    const avgPriceDollars = Math.floor(averagePrice / 100);
    const maxPriceDollars = Math.ceil(priceRangeMax / 100);
    const minPriceDollars = Math.floor(priceRangeMin / 100);

    // Éviter d'afficher une fourchette avec des valeurs identiques
    if (minPriceDollars === maxPriceDollars) {
      // Si le prix min et max sont identiques, créer une fourchette artificielle
      const lowerBound = Math.max(5, Math.floor(avgPriceDollars * 0.9));
      const upperBound = Math.ceil(avgPriceDollars * 1.1) + 5;

      recommendations.push(
        `nos nouvelles armes dans votre gamme de prix habituelle (${lowerBound}$ - ${upperBound}$)`
      );
    } else {
      recommendations.push(
        `nos nouvelles armes dans votre gamme de prix habituelle (${minPriceDollars}$ - ${maxPriceDollars}$)`
      );
    }

    reasoning += `Client sensible au prix, fourchette habituelle ${minPriceDollars}$ - ${maxPriceDollars}$. `;
  }

  // Recommandation basée sur la catégorie préférée
  if (preferredCategory) {
    // Vérifier si la catégorie est déjà au pluriel
    const catLower = preferredCategory.toLowerCase();

    // Corriger la formulation pour éviter les erreurs de formatage
    const articleAndCategory = getArticle(catLower);
    recommendations.push(`notre nouvelle sélection ${articleAndCategory}`);
    reasoning += `Forte préférence pour les ${catLower} (${categoryFrequency[preferredCategory]} achats). `;
  }

  // Recommandation basée sur la saisonnalité - doit être plus courte pour éviter les coupures
  const currentMonth = new Date().getMonth();
  const isPreferredSeason = Math.abs(currentMonth - preferredMonth) <= 1;

  if (isPreferredSeason) {
    const seasonalEvents = [
      'notre exposition spéciale où vous pourrez admirer des pièces rares venues du monde entier',
      "notre démonstration de tir avec les derniers modèles arrivés d'Europe",
      'notre vente privée réservée à nos clients distingués',
    ];
    recommendations.push(
      seasonalEvents[Math.floor(Math.random() * seasonalEvents.length)]
    );
    reasoning +=
      "Client qui achète généralement durant cette période de l'année. ";
  }

  // Recommandation basée sur la diversification - plus concise
  if (Object.keys(categoryFrequency).length > 1) {
    // Client varié qui aime essayer différents types
    const rareCategories = [
      'armes de collection du conflit de Sécession',
      'armes gravées de notre maître armurier',
      'armes personnalisées sur mesure',
    ];
    const rareCat =
      rareCategories[Math.floor(Math.random() * rareCategories.length)];
    recommendations.push(`nos ${rareCat} qui enrichiraient votre collection`);
    reasoning += "Client diversifié qui possède plusieurs catégories d'armes. ";
  } else {
    // Client fidèle à une seule catégorie - formuler de façon plus concise
    recommendations.push(
      `des accessoires de qualité pour vos ${preferredCategory.toLowerCase()}`
    );
    reasoning += 'Client focalisé sur une seule catégorie. ';
  }

  // Prendre seulement un maximum de 2 recommandations pour éviter de surcharger le message
  // Et s'assurer qu'aucune n'est trop longue
  const MAX_RECOMMENDATION_LENGTH = 80;
  const finalRecommendations = shuffleArray(recommendations)
    .slice(0, 1) // Réduire à 1 seule recommandation pour éviter les problèmes de troncation
    .map((rec) => {
      // Raccourcir les recommandations trop longues
      if (rec.length > MAX_RECOMMENDATION_LENGTH) {
        return `${rec.slice(0, Math.max(0, MAX_RECOMMENDATION_LENGTH - 3))}...`;
      }
      return rec;
    });

  return {
    recommendations: finalRecommendations,
    reasoning,
  };
};

// Fonction pour catégoriser les armes
function categorizeWeapon(weaponName: string): string {
  const lowerName = weaponName.toLowerCase();

  if (lowerName.includes('pistolet') || lowerName.includes('revolver')) {
    return 'Armes de poing';
  }
  if (lowerName.includes('fusil') && !lowerName.includes('chasse')) {
    return "Fusils d'assaut";
  }
  if (lowerName.includes('chasse') || lowerName.includes('carabine')) {
    return 'Armes de chasse';
  }
  if (lowerName.includes('sniper') || lowerName.includes('précision')) {
    return 'Armes de précision';
  }
  if (lowerName.includes('tactique')) {
    return 'Équipement tactique';
  }
  return 'Autres armes';
}

// Fonction utilitaire pour déterminer le genre d'une arme
function getWeaponGender(weaponName: string): 'M' | 'F' {
  const lowerName = weaponName.toLowerCase();

  // Liste non exhaustive des noms d'armes masculins
  const masculins = [
    'revolver',
    'pistolet',
    'fusil',
    'canon',
    'sabre',
    'couteau',
    'poignard',
  ];

  // Liste non exhaustive des noms d'armes féminins
  const feminins = [
    'carabine',
    'mitraillette',
    'mitrailleuse',
    'épée',
    'dague',
    'arbalète',
  ];

  // Vérifier si le nom commence par un des mots de genre connu
  for (const mot of masculins) {
    if (lowerName.includes(mot)) return 'M';
  }

  for (const mot of feminins) {
    if (lowerName.includes(mot)) return 'F';
  }

  // Par défaut, la plupart des armes sont masculines en français
  return 'M';
}

// Fonction pour capitaliser correctement les noms d'armes
function capitalizeWeaponName(name: string): string {
  // Vérifie si le nom commence déjà par une majuscule
  if (/^[A-Z]/.test(name)) return name;

  // Sinon, capitalise chaque mot
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Fonction utilitaire pour correctement appliquer les articles et accords
function getArticle(mot: string, defini = false): string {
  // Nettoyage du texte d'entrée pour éviter les problèmes
  const cleanedMot = mot.trim().replaceAll(/\s+/g, ' ');

  // Capitaliser le nom de l'arme
  const capitalizedName = capitalizeWeaponName(cleanedMot);

  const premiereLettre = cleanedMot.charAt(0).toLowerCase();
  const voyelles = [
    'a',
    'e',
    'i',
    'o',
    'u',
    'é',
    'è',
    'ê',
    'à',
    'â',
    'î',
    'ô',
    'û',
    'ù',
    'h',
  ];
  const commenceParVoyelle = voyelles.includes(premiereLettre);
  const gender = getWeaponGender(cleanedMot);

  // Détecter si le mot est au pluriel (se termine par 's' ou 'x')
  const motTrimmed = cleanedMot.toLowerCase();
  const estPlurel = motTrimmed.endsWith('s') || motTrimmed.endsWith('x');

  // Pour un article défini (le/la/les)
  if (defini) {
    // Pour les mots commençant par une voyelle
    if (commenceParVoyelle) {
      return `l'${capitalizedName}`;
    }

    // Pour les mots au pluriel
    if (estPlurel) {
      return `les ${capitalizedName}`;
    }

    // Pour les mots au singulier avec consonne
    return gender === 'M' ? `le ${capitalizedName}` : `la ${capitalizedName}`;
  }
  // Pour un article indéfini avec "de" (d'un/d'une/de)

  // Pour les mots commençant par une voyelle
  if (commenceParVoyelle) {
    return `d'${capitalizedName}`;
  }

  // Pour les mots au pluriel
  if (estPlurel) {
    return `de ${capitalizedName}`;
  }

  // Pour les mots au singulier avec consonne
  return gender === 'M' ? `de ${capitalizedName}` : `de ${capitalizedName}`;
}

// Fonction utilitaire pour mélanger un tableau
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Générer un message personnalisé pour un client dans le style de Red Dead Redemption 2
export const generateClientMessage = (
  group: DetenteurGroup,
  template = 'standard',
  vendorName = 'Armurier'
): string => {
  const { primaryName, weapons, totalSpent, lastPurchase, purchaseCount } =
    group;

  // Obtenir les armes uniques
  const uniqueWeapons = [...new Set(weapons.map((w) => w.nom_arme))];

  // Formater le montant total (en dollars)
  const formattedTotal = (totalSpent / 100)
    .toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'narrowSymbol',
    })
    .replace('US$', '$');

  // Calculer le nombre de jours depuis le dernier achat
  const daysSinceLastPurchase = Math.floor(
    (Date.now() - new Date(lastPurchase).getTime()) / (1000 * 3600 * 24)
  );

  // Générer des recommandations intelligentes
  const smartRecommendations = generateSmartRecommendations(group);
  const recommendations = smartRecommendations.recommendations.map((rec) => {
    // Nettoyer les recommandations pour éviter les erreurs de formatage
    return rec.replaceAll(/\s+/g, ' ').trim();
  });

  // Obtenir une salutation aléatoire et s'assurer qu'elle ne se termine pas par une virgule
  const rawSalutation = getRandomSalutation(primaryName);
  const salutation = rawSalutation.endsWith(',')
    ? rawSalutation
    : `${rawSalutation}`;

  // Obtenir une formule de politesse aléatoire
  const formule = getRandomFormulePolitesse();

  // Préparer les données pour le template avec une logique améliorée pour éviter "0 jours"
  const templateData = {
    uniqueWeapons,
    formattedTotal,
    purchaseCount,
    daysSinceLastPurchase:
      daysSinceLastPurchase === 0 ? 1 : daysSinceLastPurchase, // Minimum 1 jour
    recommendations,
  };

  // Récupérer le template correspondant et générer les sections du message
  const messageTemplate = getMessageTemplateById(template);
  const templateSections = messageTemplate.template(templateData);

  // Assembler le message
  let message = `${salutation}\n\n`;
  message += `${templateSections.intro} ${templateSections.body} ${templateSections.recommendation} ${templateSections.closing}\n\n`;
  message += `${formule}\n${vendorName}`;

  // Limiter à MAX_LENGTH caractères (750)
  const MAX_LENGTH = 750;
  if (message.length > MAX_LENGTH) {
    // Définir la longueur réservée pour la signature
    const signatureLength = formule.length + vendorName.length + 2; // +2 pour le saut de ligne
    const maxContentLength = MAX_LENGTH - signatureLength;

    // Trouver où couper de manière intelligente (à la fin d'une phrase)
    let contentPart = message.slice(0, Math.max(0, maxContentLength));

    // Points de terminaison de phrases par ordre de préférence
    const sentenceEndings = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    let cutPoint = -1;

    // Chercher le dernier point de terminaison de phrase
    for (const ending of sentenceEndings) {
      const lastIndex = contentPart.lastIndexOf(ending);
      if (lastIndex > cutPoint) {
        cutPoint = lastIndex + ending.length; // Inclut le caractère de ponctuation et l'espace/retour à la ligne
      }
    }

    // Si aucun point de terminaison trouvé, essayer de couper à un retour à la ligne
    if (cutPoint === -1 || cutPoint < maxContentLength - 200) {
      cutPoint = contentPart.lastIndexOf('\n');
    }

    // Si toujours pas trouvé, couper simplement à la longueur maximale
    if (cutPoint === -1 || cutPoint < maxContentLength - 200) {
      cutPoint = maxContentLength;
    }

    // Extraire la partie à conserver
    contentPart = message.slice(0, Math.max(0, cutPoint)).trim();

    // Déterminer si nous devons ajouter des points de suspension
    const needsEllipsis = cutPoint < message.length - signatureLength - 10; // -10 pour éviter des points de suspension juste avant la signature

    // Reconstruire le message avec la signature
    message = contentPart;
    if (needsEllipsis) {
      message += '...';
    }
    message += `\n\n${formule}\n${vendorName}`;
  }

  return message;
};
