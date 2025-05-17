interface Quote {
	text: string;
	author: string;
	year?: string;
}

const quotes: Quote[] = [
	{
		text: "La meilleure armurerie de Saint-Denis, en même temps c'est la seule",
		author: "Theodore Roosevelt",
		year: "1899",
	},
	{
		text: "Une arme bien entretenue est une arme qui ne vous trahira jamais",
		author: "Samuel Colt",
		year: "1852",
	},
	{
		text: "Quand on me demande pourquoi j'ai besoin d'une arme, je réponds : pourquoi un pompier a-t-il besoin d'un extincteur ?",
		author: "Wyatt Earp",
		year: "1881",
	},
	{
		text: "Si les armes sont hors-la-loi, seuls les hors-la-loi auront des armes",
		author: "Jesse James",
		year: "1882",
	},
	{
		text: "Une armurerie sans armes, c'est comme un saloon sans whisky",
		author: "Calamity Jane",
		year: "1885",
	},
	{
		text: "La meilleure façon de résoudre un problème est parfois de le viser correctement",
		author: "Annie Oakley",
		year: "1890",
	},
	{
		text: "Un bon revolver dans la main vaut mieux que deux shérifs en ville",
		author: "Billy the Kid",
		year: "1880",
	},
	{
		text: "Quand on entre dans une armurerie, on laisse ses problèmes à la porte",
		author: "Doc Holliday",
		year: "1887",
	},
	{
		text: "La différence entre un amateur et un professionnel ? L'entretien de son arme",
		author: "Buffalo Bill Cody",
		year: "1885",
	},
	{
		text: "Une bonne armurerie ne vend pas seulement des armes, elle vend de la confiance",
		author: "John Wesley Hardin",
		year: "1895",
	},
	{
		text: "Le meilleur moment pour acheter une arme était hier, le deuxième meilleur moment c'est aujourd'hui",
		author: "Pat Garrett",
		year: "1881",
	},
	{
		text: "Si vous cherchez la qualité, vous êtes au bon endroit",
		author: "Bass Reeves",
		year: "1889",
	},
	{
		text: "Une armurerie est comme une bibliothèque, sauf que les livres font plus de bruit",
		author: "Wild Bill Hickok",
		year: "1876",
	},
	{
		text: "La sécurité d'abord, le style ensuite, mais ici vous aurez les deux",
		author: "Belle Starr",
		year: "1886",
	},
	{
		text: "Entrez comme un client, sortez comme un ami",
		author: "Sitting Bull",
		year: "1883",
	},
];

export const getQuoteByStableId = (id: string): Quote => {
	let sum = 0;
	for (let i = 0; i < id.length; i++) {
		sum += id.codePointAt(i) || 0;
	}

	const index = sum % quotes.length;
	return quotes[index];
};
