const WEAPON_LOGS_WEBHOOK_URL =
	"https://discordapp.com/api/webhooks/1358560402925162617/9AjQcFgVWsX3f4CxBhMDSTZ9Ys0b8yIuFfoxUwgBhzKvXUjp7PaXqfTZRyFb5lNO_zhJ";

interface DiscordWeaponData {
	name: string;
	model?: string;
	price: number;
	cost?: number;
	description?: string;
}

export async function logWeaponModification(
	weaponData: DiscordWeaponData,
	username: string,
	action: "create" | "update" | "delete",
	previousData?: DiscordWeaponData,
): Promise<boolean> {
	try {
		const colorMap = {
			create: 3_066_993,
			update: 15_970_322,
			delete: 15_158_332,
		};

		const titleMap = {
			create: "Nouvelle arme créée",
			update: "Arme modifiée",
			delete: "Arme supprimée",
		};

		const formatPrice = (priceInCents: number | undefined): string => {
			if (priceInCents === undefined) return "Non spécifié";
			return new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			}).format(priceInCents / 100);
		};

		const fields = [
			{
				name: "Nom",
				value: weaponData.name || "Non spécifié",
				inline: true,
			},
			{
				name: "Modèle",
				value: weaponData.model || "Non spécifié",
				inline: true,
			},
		];

		if (weaponData.price !== undefined) {
			fields.push({
				name: "Prix",
				value: formatPrice(weaponData.price),
				inline: true,
			});
		}

		if (weaponData.cost !== undefined && weaponData.price !== undefined) {
			const profit = weaponData.price - weaponData.cost;
			fields.push({
				name: "Bénéfice",
				value: formatPrice(profit),
				inline: true,
			});
		}

		if (action === "update" && previousData) {
			const changes = [];

			if (weaponData.name !== previousData.name) {
				changes.push(
					`**Nom**: ${previousData.name || "N/A"} → ${weaponData.name || "N/A"}`,
				);
			}
			if (weaponData.model !== previousData.model) {
				changes.push(
					`**Modèle**: ${previousData.model || "N/A"} → ${weaponData.model || "N/A"}`,
				);
			}
			if (weaponData.description !== previousData.description) {
				changes.push("**Description**: Changée");
			}
			if (weaponData.price !== previousData.price) {
				changes.push(
					`**Prix**: ${formatPrice(previousData.price)} → ${formatPrice(weaponData.price)}`,
				);
			}
			if (weaponData.cost !== previousData.cost) {
				changes.push(
					`**Coût**: ${formatPrice(previousData.cost)} → ${formatPrice(weaponData.cost)}`,
				);
			}

			if (changes.length > 0) {
				fields.push({
					name: "Modifications",
					value: changes.join("\n"),
					inline: false,
				});
			}
		}

		const webhookData = {
			username: "Système d'Armurerie",
			embeds: [
				{
					title: titleMap[action],
					description: `Action effectuée par ${username}`,
					color: colorMap[action],
					timestamp: new Date().toISOString(),
					fields,
					footer: {
						text: "Système de logs d'armes",
					},
				},
			],
		};

		const response = await fetch(WEAPON_LOGS_WEBHOOK_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(webhookData),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Erreur lors de l'envoi du log d'arme:", errorText);
			return false;
		}

		return true;
	} catch (error) {
		console.error("Exception lors de l'envoi du log d'arme:", error);
		return false;
	}
}
