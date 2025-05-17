import type { Weapon } from "@/services/api";
import {
	getMessageTemplateById,
	getRandomFormulePolitesse,
	getRandomSalutation,
} from "./messageTemplates";

export const calculateSimilarity = (s1: string, s2: string): number => {
	if (!s1 || !s2) return 0;

	const str1 = s1.toLowerCase().trim();
	const str2 = s2.toLowerCase().trim();

	if (str1 === str2) return 1;

	if (str1.includes(str2) || str2.includes(str1)) {
		const lengthRatio =
			Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);

		return 0.7 + lengthRatio * 0.3;
	}

	const set1 = new Set(str1);
	const set2 = new Set(str2);

	const intersection = new Set([...set1].filter((x) => set2.has(x)));

	const jaccardSimilarity =
		intersection.size / (set1.size + set2.size - intersection.size);

	const levenshteinDistance = levenshtein(str1, str2);
	const maxLength = Math.max(str1.length, str2.length);
	const levenshteinSimilarity =
		maxLength === 0 ? 1 : 1 - levenshteinDistance / maxLength;

	const ngramSimilarity = calculateNgramSimilarity(str1, str2, 2);

	const prefixLength = commonPrefixLength(str1, str2);
	const prefixSimilarity = prefixLength / Math.min(str1.length, str2.length);

	let jaroWeight = 0.2;
	let levenWeight = 0.4;
	let ngramWeight = 0.2;
	let prefixWeight = 0.2;

	if (Math.abs(str1.length - str2.length) > 3) {
		jaroWeight = 0.4;
		levenWeight = 0.3;
		ngramWeight = 0.2;
		prefixWeight = 0.1;
	} else if (prefixLength > 2) {
		prefixWeight = 0.3;
		jaroWeight = 0.2;
		levenWeight = 0.3;
		ngramWeight = 0.2;
	}

	const weightedSimilarity =
		jaccardSimilarity * jaroWeight +
		levenshteinSimilarity * levenWeight +
		ngramSimilarity * ngramWeight +
		prefixSimilarity * prefixWeight;

	return adjustSimilarityDistribution(weightedSimilarity);
};

function levenshtein(a: string, b: string): number {
	const matrix: number[][] = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}

	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			const cost = a[j - 1] === b[i - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,
				matrix[i][j - 1] + 1,
				matrix[i - 1][j - 1] + cost,
			);
		}
	}

	return matrix[b.length][a.length];
}

function calculateNgramSimilarity(s1: string, s2: string, n: number): number {
	if (s1.length < n || s2.length < n) return 0;

	const getNgrams = (str: string, n: number) => {
		const ngrams = new Set<string>();
		for (let i = 0; i <= str.length - n; i++) {
			ngrams.add(str.slice(i, i + n));
		}
		return ngrams;
	};

	const ngrams1 = getNgrams(s1, n);
	const ngrams2 = getNgrams(s2, n);

	const intersection = new Set([...ngrams1].filter((x) => ngrams2.has(x)));

	return (2 * intersection.size) / (ngrams1.size + ngrams2.size);
}

function commonPrefixLength(s1: string, s2: string): number {
	let i = 0;
	const minLength = Math.min(s1.length, s2.length);
	while (i < minLength && s1[i] === s2[i]) {
		i++;
	}
	return i;
}

function adjustSimilarityDistribution(similarity: number): number {
	if (similarity > 0.8) {
		return similarity;
	}
	if (similarity > 0.6) {
		return 0.6 + (similarity - 0.6) * 0.8;
	}
	if (similarity > 0.4) {
		return 0.4 + (similarity - 0.4) * 0.7;
	}

	return similarity * 0.8;
}

export const normalizeDetenteur = (name: string): string => {
	if (!name) return "";

	return name
		.toLowerCase()
		.trim()
		.normalize("NFD")
		.replaceAll(/\p{M}/gu, "") // Supprimer les marques combinatoires (accents)
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
	similarityThreshold = 0.8,
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
					normalizeDetenteur(groups[key].primaryName),
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

	return Object.values(groups).sort((a, b) => b.totalSpent - a.totalSpent);
};

const generateSmartRecommendations = (
	group: DetenteurGroup,
): {
	recommendations: string[];
	reasoning: string;
} => {
	const { weapons, totalSpent, purchaseCount } = group;

	const purchases = weapons.map((w) => ({
		name: w.nom_arme,
		price: w.prix,
		date: new Date(w.horodateur),
		type: categorizeWeapon(w.nom_arme),
	}));

	const priceRangeMin = Math.min(...purchases.map((p) => p.price));
	const priceRangeMax = Math.max(...purchases.map((p) => p.price));
	const averagePrice = totalSpent / purchaseCount;

	const categories = purchases.map((p) => p.type);
	const categoryFrequency: Record<string, number> = {};
	for (const cat of categories) {
		categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
	}

	const preferredCategory = Object.entries(categoryFrequency).sort(
		(a, b) => b[1] - a[1],
	)[0][0];

	const purchaseMonths = purchases.map((p) => p.date.getMonth());
	const monthFrequency: Record<number, number> = {};
	for (const month of purchaseMonths) {
		monthFrequency[month] = (monthFrequency[month] || 0) + 1;
	}

	const preferredMonth = Object.entries(monthFrequency)
		.sort((a, b) => b[1] - a[1])
		.map(([month]) => Number(month))[0];

	const recommendations: string[] = [];
	let reasoning = "";

	// Recommandation basée sur la fourchette de prix
	const premiumThreshold = 50_000; // 500$
	if (averagePrice > premiumThreshold) {
		recommendations.push("nos pièces d'exception récemment importées d'Europe");
		reasoning += "Client avec un budget élevé (achats moyens > 500$). ";
	} else {
		const avgPriceDollars = Math.floor(averagePrice / 100);
		const maxPriceDollars = Math.ceil(priceRangeMax / 100);
		const minPriceDollars = Math.floor(priceRangeMin / 100);

		if (minPriceDollars === maxPriceDollars) {
			const lowerBound = Math.max(5, Math.floor(avgPriceDollars * 0.9));
			const upperBound = Math.ceil(avgPriceDollars * 1.1) + 5;

			recommendations.push(
				`nos nouvelles armes dans votre gamme de prix habituelle (${lowerBound}$ - ${upperBound}$)`,
			);
		} else {
			recommendations.push(
				`nos nouvelles armes dans votre gamme de prix habituelle (${minPriceDollars}$ - ${maxPriceDollars}$)`,
			);
		}

		reasoning += `Client sensible au prix, fourchette habituelle ${minPriceDollars}$ - ${maxPriceDollars}$. `;
	}

	if (preferredCategory) {
		const catLower = preferredCategory.toLowerCase();

		const articleAndCategory = getArticle(catLower);
		recommendations.push(`notre nouvelle sélection ${articleAndCategory}`);
		reasoning += `Forte préférence pour les ${catLower} (${categoryFrequency[preferredCategory]} achats). `;
	}

	const currentMonth = new Date().getMonth();
	const isPreferredSeason = Math.abs(currentMonth - preferredMonth) <= 1;

	if (isPreferredSeason) {
		const seasonalEvents = [
			"notre exposition spéciale où vous pourrez admirer des pièces rares venues du monde entier",
			"notre démonstration de tir avec les derniers modèles arrivés d'Europe",
			"notre vente privée réservée à nos clients distingués",
		];
		recommendations.push(
			seasonalEvents[Math.floor(Math.random() * seasonalEvents.length)],
		);
		reasoning +=
			"Client qui achète généralement durant cette période de l'année. ";
	}

	if (Object.keys(categoryFrequency).length > 1) {
		const rareCategories = [
			"armes de collection du conflit de Sécession",
			"armes gravées de notre maître armurier",
			"armes personnalisées sur mesure",
		];
		const rareCat =
			rareCategories[Math.floor(Math.random() * rareCategories.length)];
		recommendations.push(`nos ${rareCat} qui enrichiraient votre collection`);
		reasoning += "Client diversifié qui possède plusieurs catégories d'armes. ";
	} else {
		recommendations.push(
			`des accessoires de qualité pour vos ${preferredCategory.toLowerCase()}`,
		);
		reasoning += "Client focalisé sur une seule catégorie. ";
	}

	const MAX_RECOMMENDATION_LENGTH = 80;
	const finalRecommendations = shuffleArray(recommendations)
		.slice(0, 1)
		.map((rec) => {
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

function categorizeWeapon(weaponName: string): string {
	const lowerName = weaponName.toLowerCase();

	if (lowerName.includes("pistolet") || lowerName.includes("revolver")) {
		return "Armes de poing";
	}
	if (lowerName.includes("fusil") && !lowerName.includes("chasse")) {
		return "Fusils d'assaut";
	}
	if (lowerName.includes("chasse") || lowerName.includes("carabine")) {
		return "Armes de chasse";
	}
	if (lowerName.includes("sniper") || lowerName.includes("précision")) {
		return "Armes de précision";
	}
	if (lowerName.includes("tactique")) {
		return "Équipement tactique";
	}
	return "Autres armes";
}

function getWeaponGender(weaponName: string): "M" | "F" {
	const lowerName = weaponName.toLowerCase();

	const masculins = [
		"revolver",
		"pistolet",
		"fusil",
		"canon",
		"sabre",
		"couteau",
		"poignard",
	];

	const feminins = [
		"carabine",
		"mitraillette",
		"mitrailleuse",
		"épée",
		"dague",
		"arbalète",
	];

	for (const mot of masculins) {
		if (lowerName.includes(mot)) return "M";
	}

	for (const mot of feminins) {
		if (lowerName.includes(mot)) return "F";
	}

	return "M";
}

function capitalizeWeaponName(name: string): string {
	if (/^[A-Z]/.test(name)) return name;

	return name
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function getArticle(mot: string, defini = false): string {
	const cleanedMot = mot.trim().replaceAll(/\s+/g, " ");

	const capitalizedName = capitalizeWeaponName(cleanedMot);

	const premiereLettre = cleanedMot.charAt(0).toLowerCase();
	const voyelles = [
		"a",
		"e",
		"i",
		"o",
		"u",
		"é",
		"è",
		"ê",
		"à",
		"â",
		"î",
		"ô",
		"û",
		"ù",
		"h",
	];
	const commenceParVoyelle = voyelles.includes(premiereLettre);
	const gender = getWeaponGender(cleanedMot);

	const motTrimmed = cleanedMot.toLowerCase();
	const estPlurel = motTrimmed.endsWith("s") || motTrimmed.endsWith("x");

	if (defini) {
		if (commenceParVoyelle) {
			return `l'${capitalizedName}`;
		}

		if (estPlurel) {
			return `les ${capitalizedName}`;
		}

		return gender === "M" ? `le ${capitalizedName}` : `la ${capitalizedName}`;
	}

	if (commenceParVoyelle) {
		return `d'${capitalizedName}`;
	}

	if (estPlurel) {
		return `de ${capitalizedName}`;
	}

	return gender === "M" ? `de ${capitalizedName}` : `de ${capitalizedName}`;
}

function shuffleArray<T>(array: T[]): T[] {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
	}
	return newArray;
}

export const generateClientMessage = (
	group: DetenteurGroup,
	template = "standard",
	vendorName = "Armurier",
): string => {
	const { primaryName, weapons, totalSpent, lastPurchase, purchaseCount } =
		group;

	const uniqueWeapons = [...new Set(weapons.map((w) => w.nom_arme))];

	const formattedTotal = (totalSpent / 100)
		.toLocaleString("en-US", {
			style: "currency",
			currency: "USD",
			currencyDisplay: "narrowSymbol",
		})
		.replace("US$", "$");

	const daysSinceLastPurchase = Math.floor(
		(Date.now() - new Date(lastPurchase).getTime()) / (1000 * 3600 * 24),
	);

	const smartRecommendations = generateSmartRecommendations(group);
	const recommendations = smartRecommendations.recommendations.map((rec) => {
		return rec.replaceAll(/\s+/g, " ").trim();
	});

	const rawSalutation = getRandomSalutation(primaryName);
	const salutation = rawSalutation.endsWith(",")
		? rawSalutation
		: `${rawSalutation}`;

	const formule = getRandomFormulePolitesse();

	const templateData = {
		uniqueWeapons,
		formattedTotal,
		purchaseCount,
		daysSinceLastPurchase:
			daysSinceLastPurchase === 0 ? 1 : daysSinceLastPurchase,
		recommendations,
	};

	const messageTemplate = getMessageTemplateById(template);
	const templateSections = messageTemplate.template(templateData);

	let message = `${salutation}\n\n`;
	message += `${templateSections.intro} ${templateSections.body} ${templateSections.recommendation} ${templateSections.closing}\n\n`;
	message += `${formule}\n${vendorName}`;

	const MAX_LENGTH = 750;
	if (message.length > MAX_LENGTH) {
		const signatureLength = formule.length + vendorName.length + 2;
		const maxContentLength = MAX_LENGTH - signatureLength;

		let contentPart = message.slice(0, Math.max(0, maxContentLength));

		const sentenceEndings = [". ", "! ", "? ", ".\n", "!\n", "?\n"];
		let cutPoint = -1;

		for (const ending of sentenceEndings) {
			const lastIndex = contentPart.lastIndexOf(ending);
			if (lastIndex > cutPoint) {
				cutPoint = lastIndex + ending.length;
			}
		}

		if (cutPoint === -1 || cutPoint < maxContentLength - 200) {
			cutPoint = contentPart.lastIndexOf("\n");
		}

		if (cutPoint === -1 || cutPoint < maxContentLength - 200) {
			cutPoint = maxContentLength;
		}

		contentPart = message.slice(0, Math.max(0, cutPoint)).trim();

		const needsEllipsis = cutPoint < message.length - signatureLength - 10;

		message = contentPart;
		if (needsEllipsis) {
			message += "...";
		}
		message += `\n\n${formule}\n${vendorName}`;
	}

	return message;
};
