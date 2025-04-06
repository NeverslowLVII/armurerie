import { Weapon } from '@/services/api';

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
    const lengthRatio = Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);
    // Plus les longueurs sont similaires, plus la similarité est élevée
    return 0.7 + (lengthRatio * 0.3);
  }
  
  // Similarité de Jaccard (basée sur les ensembles de caractères)
  const set1 = new Set(str1);
  const set2 = new Set(str2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  const jaccardSimilarity = intersection.size / (set1.size + set2.size - intersection.size);
  
  // Distance de Levenshtein (basée sur l'édition)
  const levenshteinDistance = levenshtein(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  const levenshteinSimilarity = maxLength === 0 ? 1 : 1 - levenshteinDistance / maxLength;
  
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
    (jaccardSimilarity * jaroWeight) + 
    (levenshteinSimilarity * levenWeight) + 
    (ngramSimilarity * ngramWeight) + 
    (prefixSimilarity * prefixWeight);
  
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
        matrix[i - 1][j] + 1,       // suppression
        matrix[i][j - 1] + 1,       // insertion
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
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  
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
  } else if (similarity > 0.6) {
    // Légère réduction dans la plage moyenne-haute
    return 0.6 + (similarity - 0.6) * 0.8;
  } else if (similarity > 0.4) {
    // Réduction plus importante dans la plage moyenne
    return 0.4 + (similarity - 0.4) * 0.7;
  } else {
    // Les faibles valeurs sont encore réduites
    return similarity * 0.8;
  }
}

// Normalisation des noms de détenteurs pour la comparaison
export const normalizeDetenteur = (name: string): string => {
  if (!name) return '';
  
  return name.toLowerCase().trim()
    .normalize("NFD") // Décomposer les caractères accentués
    .replaceAll(/[\u0300-\u036F]/g, "") // Supprimer les accents
    .replaceAll(/[^a-z0-9]/g, " ") // Remplacer les caractères spéciaux par des espaces
    .replaceAll(/\s+/g, " "); // Réduire les espaces multiples
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
  similarityThreshold: number = 0.8
): DetenteurGroup[] => {
  const groups: Record<string, DetenteurGroup> = {};
  
  for (const weapon of weapons) {
    if (!weapon.detenteur) continue;
    
    const normalizedName = normalizeDetenteur(weapon.detenteur);
    
    // Chercher un groupe existant avec un nom similaire
    let foundGroup = false;
    for (const key in groups) {
      if (calculateSimilarity(normalizedName, normalizeDetenteur(groups[key].primaryName)) >= similarityThreshold) {
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
        purchaseCount: 1
      };
    }
  }
  
  // Convertir l'objet en tableau et le trier par montant total dépensé
  return Object.values(groups).sort((a, b) => b.totalSpent - a.totalSpent);
};

// Fonction pour générer des recommandations intelligentes basées sur l'historique d'achat
export const generateSmartRecommendations = (group: DetenteurGroup): {
  recommendations: string[];
  reasoning: string;
} => {
  const { weapons, totalSpent, purchaseCount } = group;
  
  // Extraire des informations pertinentes de l'historique d'achat
  const purchases = weapons.map(w => ({
    name: w.nom_arme,
    price: w.prix,
    date: new Date(w.horodateur),
    type: categorizeWeapon(w.nom_arme)
  }));
  
  // Calculer la fourchette de prix habituelle
  const priceRangeMin = Math.min(...purchases.map(p => p.price));
  const priceRangeMax = Math.max(...purchases.map(p => p.price));
  const averagePrice = totalSpent / purchaseCount;
  
  // Identifier les catégories préférées
  const categories = purchases.map(p => p.type);
  const categoryFrequency: Record<string, number> = {};
  for (const cat of categories) {
    categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
  }
  
  // Trouver la catégorie la plus fréquente
  const preferredCategory = Object.entries(categoryFrequency)
    .sort((a, b) => b[1] - a[1])[0][0];
  
  // Vérifier la saisonnalité des achats
  const purchaseMonths = purchases.map(p => p.date.getMonth());
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
  let reasoning = "";
  
  // Recommandation basée sur la fourchette de prix
  const premiumThreshold = 50_000; // 500€
  if (averagePrice > premiumThreshold) {
    recommendations.push(
      "nos pièces d'exception récemment importées d'Europe"
    );
    reasoning += "Client avec un budget élevé (achats moyens > 500$). ";
  } else {
    const avgPriceEur = Math.floor(averagePrice / 100);
    const maxPriceEur = Math.ceil(priceRangeMax / 100);
    const minPriceEur = Math.floor(priceRangeMin / 100);
    
    recommendations.push(
      `nos nouvelles armes dans votre gamme de prix habituelle (${avgPriceEur}$ - ${maxPriceEur}$)`
    );
    reasoning += `Client sensible au prix, fourchette habituelle ${minPriceEur}$ - ${maxPriceEur}$. `;
  }
  
  // Recommandation basée sur la catégorie préférée
  if (preferredCategory) {
    // Vérifier si la catégorie est déjà au pluriel
    const catLower = preferredCategory.toLowerCase();
    
    recommendations.push(
      `notre dernière cargaison ${getArticle(catLower)}${catLower}`
    );
    reasoning += `Forte préférence pour les ${catLower} (${categoryFrequency[preferredCategory]} achats). `;
  }
  
  // Recommandation basée sur la diversification
  if (Object.keys(categoryFrequency).length > 1) {
    // Client varié qui aime essayer différents types
    const rareCategories = [
      "Armes de collection du conflit de Sécession", 
      "Armes gravées du maître armurier de Saint Denis", 
      "Armes personnalisées du Colonel Johnston"
    ];
    const rareCat = rareCategories[Math.floor(Math.random() * rareCategories.length)];
    recommendations.push(
      `nos ${rareCat.toLowerCase()} qui feraient belle figure dans votre arsenal`
    );
    reasoning += "Client diversifié qui possède plusieurs catégories d'armes. ";
  } else {
    // Client fidèle à une seule catégorie
    recommendations.push(
      `des accessoires de qualité pour accompagner vos ${preferredCategory.toLowerCase()}`
    );
    reasoning += "Client focalisé sur une seule catégorie. ";
  }
  
  // Recommandation saisonnière
  const currentMonth = new Date().getMonth();
  const isPreferredSeason = Math.abs(currentMonth - preferredMonth) <= 1;
  
  if (isPreferredSeason) {
    const seasonalEvents = [
      "notre exposition spéciale où vous pourrez admirer des pièces rares venues du monde entier",
      "notre démonstration de tir où nos experts feront des merveilles avec les derniers modèles",
      "notre vente privée réservée à notre distinguée clientèle"
    ];
    recommendations.push(seasonalEvents[Math.floor(Math.random() * seasonalEvents.length)]);
    reasoning += "Client qui achète généralement durant cette période de l'année. ";
  }
  
  return {
    recommendations: shuffleArray(recommendations).slice(0, 2), // Limiter à 2 recommandations
    reasoning
  };
};

// Fonction pour catégoriser les armes
function categorizeWeapon(weaponName: string): string {
  const lowerName = weaponName.toLowerCase();
  
  if (lowerName.includes("pistolet") || lowerName.includes("revolver")) {
    return "Armes de poing";
  } else if (lowerName.includes("fusil") && !lowerName.includes("chasse")) {
    return "Fusils d'assaut";
  } else if (lowerName.includes("chasse") || lowerName.includes("carabine")) {
    return "Armes de chasse";
  } else if (lowerName.includes("sniper") || lowerName.includes("précision")) {
    return "Armes de précision";
  } else if (lowerName.includes("tactique")) {
    return "Équipement tactique";
  } else {
    return "Autres armes";
  }
}

// Fonction utilitaire pour déterminer le genre d'une arme
function getWeaponGender(weaponName: string): 'M' | 'F' {
  const lowerName = weaponName.toLowerCase();
  
  // Liste non exhaustive des noms d'armes masculins
  const masculins = ["revolver", "pistolet", "fusil", "canon", "sabre", "couteau", "poignard"];
  
  // Liste non exhaustive des noms d'armes féminins
  const feminins = ["carabine", "mitraillette", "mitrailleuse", "épée", "dague", "arbalète"];
  
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
  return name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Fonction utilitaire pour correctement appliquer les articles et accords
function getArticle(mot: string, defini: boolean = false): string {
  // Capitaliser le nom de l'arme
  const capitalizedName = capitalizeWeaponName(mot);
  
  const premiereLettre = mot.trim().charAt(0).toLowerCase();
  const voyelles = ['a', 'e', 'i', 'o', 'u', 'é', 'è', 'ê', 'à', 'â', 'î', 'ô', 'û', 'ù', 'h'];
  const commenceParVoyelle = voyelles.includes(premiereLettre);
  const gender = getWeaponGender(mot);
  
  // Détecter si le mot est au pluriel (se termine par 's' ou 'x')
  const motTrimmed = mot.trim().toLowerCase();
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
  else {
    // Pour les mots commençant par une voyelle
    if (commenceParVoyelle) {
      return `d'${capitalizedName}`;
    }
    
    // Pour les mots au pluriel
    if (estPlurel) {
      return `de ${capitalizedName}`;
    }
    
    // Pour les mots au singulier avec consonne
    return gender === 'M' ? `d'un ${capitalizedName}` : `d'une ${capitalizedName}`;
  }
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
  template: string = 'standard',
  vendorName: string = 'Armurier'
): string => {
  const { primaryName, weapons, totalSpent, lastPurchase, purchaseCount } = group;
  
  // Obtenir les armes uniques
  const uniqueWeapons = [...new Set(weapons.map(w => w.nom_arme))];
  
  // Formater le montant total (en dollars de l'époque)
  const formattedTotal = (totalSpent / 100).toLocaleString('fr-FR', { 
    style: 'currency', 
    currency: 'USD',
    currencyDisplay: 'narrowSymbol'
  }).replace('US$', '$');
  
  // Calculer le nombre de jours depuis le dernier achat
  const daysSinceLastPurchase = Math.floor(
    (Date.now() - new Date(lastPurchase).getTime()) / (1000 * 3600 * 24)
  );
  
  // Générer des recommandations intelligentes
  const { recommendations } = generateSmartRecommendations(group);
  
  // Liste de salutations de l'époque
  const salutations = [
    `Cher Monsieur ${primaryName}`,
    `Mon cher ${primaryName}`,
    `Monsieur ${primaryName}`,
    `Très estimé ${primaryName}`
  ];
  
  // Liste de formules de politesse de l'époque
  const formulesPolitesse = [
    "Votre dévoué serviteur,",
    "Avec ma plus haute considération,",
    "Votre fidèle armurier,",
    "Bien respectueusement,"
  ];
  
  // Choisir une salutation et une formule de politesse aléatoires
  const salutation = salutations[Math.floor(Math.random() * salutations.length)];
  const formule = formulesPolitesse[Math.floor(Math.random() * formulesPolitesse.length)];
  
  // Générer un message adapté au style de l'époque et au template
  let message = `${salutation},\n\n`;
  
  // Contenu du message selon le template
  switch (template) {
    case 'relance': {
      // Message de relance pour client qui n'a pas acheté depuis longtemps
      message += `Nous remarquons avec regret que ${daysSinceLastPurchase} jours se sont écoulés depuis votre dernière visite à notre établissement.\n\n`;
      
      const acquisitionText = purchaseCount === 1 
        ? getArticle(weapons[0].nom_arme, true)
        : `de plusieurs pièces d'armement notables`;
        
      message += `Notre registre indique que vous aviez fait l'acquisition ${acquisitionText} pour votre collection personnelle.\n\n`;
      
      message += `Le colonel Johnston, de passage récemment, a tenu à nous informer que de nombreux pillards sévissent sur les routes et que les honnêtes citoyens se doivent d'être correctement armés en ces temps troublés.\n\n`;
      
      message += recommendations.length > 0 
        ? `Nous avons récemment pris livraison de ${recommendations.join(' et ')} qui pourraient vous intéresser fortement, étant donné vos précédentes acquisitions.\n\n`
        : `Notre dernier arrivage de Smith & Wesson et Winchester est de première qualité. Nous vous les réserverons si vous nous en exprimez le souhait par retour de courrier.\n\n`;
      
      break;
    }
    
    case 'promo': {
      // Message de promotion avec offre spéciale
      message += `À l'occasion de la grande foire de Saint Denis qui se tiendra du 15 au 20 de ce mois, notre armurerie propose une offre exceptionnelle à notre clientèle de marque, dont vous faites partie.\n\n`;
      
      message += purchaseCount > 1
        ? `En tant que client fidèle ayant effectué ${purchaseCount} transactions chez nous pour un montant total de ${formattedTotal}, nous avons le privilège de vous offrir une remise de 15% sur votre prochain achat.\n\n`
        : `Suite à votre achat ${getArticle(weapons[0].nom_arme)}, nous souhaitons vous convier à notre exposition privée où sera présentée notre nouvelle collection tout juste importée d'Europe.\n\n`;
      
      if (recommendations.length > 0) {
        message += `Nous pensons particulièrement que ${recommendations.join(' et ')} mériteraient votre attention lors de votre prochaine visite.\n\n`;
      }
      
      message += `Cette offre n'est valable que jusqu'à la fin du mois. Passé ce délai, nous ne pourrons garantir ni les prix ni la disponibilité de ces pièces rares.\n\n`;
      break;
    }
    
    case 'remerciement': {
      // Message de remerciement après un achat récent
      if (daysSinceLastPurchase < 14) {
        message += `Permettez-moi de vous exprimer notre plus profonde gratitude pour votre récente visite du ${formatDate(lastPurchase)} dans notre établissement.\n\n`;
        
        const recentWeapons = weapons
          .filter(w => new Date(w.horodateur).getTime() > Date.now() - 14 * 24 * 60 * 60 * 1000)
          .map(w => w.nom_arme);
        
        const acquisitionText = recentWeapons.length === 1 
          ? getArticle(recentWeapons[0], true)
          : `de ces magnifiques pièces: ${recentWeapons.map(w => capitalizeWeaponName(w)).join(', ')}`;
           
        message += `L'acquisition ${acquisitionText} témoigne de votre excellent goût et de votre connaissance des armes à feu.\n\n`;
        
        message += `Le forgeron m'a chargé de vous informer personnellement que votre commande sera prête dans les plus brefs délais, avec le plus grand soin apporté à la finition et à la gravure que vous avez demandées.\n\n`;
        
        message += `J'espère sincèrement que ces acquisitions vous donneront entière satisfaction et vous serviront loyalement, que ce soit pour la chasse ou pour assurer votre protection.\n\n`;
      } else {
        // Si pas d'achat récent, revenir au message standard
        return generateClientMessage(group, 'standard');
      }
      break;
    }
    
    default: {
      // Message standard (comportement par défaut)
      if (purchaseCount === 1) {
        message += `Nous vous sommes fort obligés pour l'acquisition ${getArticle(weapons[0].nom_arme)} dans notre établissement. Nous espérons que cette arme vous donne entière satisfaction et vous sert bien dans vos aventures.\n\n`;
      } else {
        message += `Nous tenons à vous exprimer notre plus sincère gratitude pour vos ${purchaseCount} transactions au sein de notre armurerie, représentant la coquette somme de ${formattedTotal}.\n\n`;
        
        if (uniqueWeapons.length > 1) {
          const weaponsToShow = uniqueWeapons.slice(0, 2);
          const formattedWeapons = weaponsToShow.map(w => getArticle(w, true));
          
          message += `Nous avons noté votre penchant pour divers types d'armement, notamment ${formattedWeapons.join(' et ')}`;
          if (uniqueWeapons.length > 2) {
            message += ` ainsi que d'autres pièces remarquables`;
          }
          message += `.\n\n`;
        } else if (uniqueWeapons.length === 1) {
          message += `Nous avons remarqué votre affection particulière pour ${getArticle(uniqueWeapons[0], true)}.\n\n`;
        }
      }
      
      if (daysSinceLastPurchase > 60) {
        message += `Cela fait désormais ${daysSinceLastPurchase} jours que nous n'avons pas eu l'honneur de votre visite dans notre établissement. `;
        
        message += recommendations.length > 0 
          ? `Si vous passez par nos contrées, sachez que ${recommendations.join(' et ')} pourraient assurément attirer votre attention.\n\n`
          : `Une diligence vient tout juste de nous livrer des pièces qui pourraient susciter votre intérêt le plus vif.\n\n`;
      } else if (recommendations.length > 0) {
        message += `Au vu de vos précédentes emplettes, nous nous permettons de suggérer que ${recommendations.join(' et ')} mériteraient votre examen lors de votre prochaine visite.\n\n`;
      }
      break;
    }
  }
  
  // Formule de politesse et signature communes à tous les templates
  message += `N'hésitez point à nous adresser un télégramme ou à vous présenter à notre comptoir pour tout renseignement supplémentaire.\n\n${formule}\n${vendorName}\nArmurier à Saint Denis`;
  
  return message;
};

// Fonction auxiliaire pour formater une date dans le style de l'époque
function formatDate(date: string | number | Date): string {
  const d = new Date(date);
  const jour = d.getDate();
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][d.getMonth()];
  const annee = d.getFullYear();
  return `${jour} ${mois} ${annee}`;
} 