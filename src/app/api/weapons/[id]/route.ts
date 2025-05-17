import { prisma } from "@/lib/prisma";
import {
	createCorsOptionsResponse,
	handleGetById,
	parseRequestBody,
	validateId,
	withErrorHandling,
} from "@/utils/api/crud-handlers";
import { type NextRequest, NextResponse } from "next/server";

interface WeaponUpdateData {
	horodateur?: string;
	detenteur?: string;
	bp?: boolean;
	serigraphie?: string;
	prix?: number;
	user_id?: string;
	nom_arme: string;
}

interface WeaponData {
	name: string;
	model: string;
	price: number;
	cost: number;
	description: string;
}

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;

		return withErrorHandling(async () => {
			const [isValid, id, errorResponse] = validateId(paramId);
			if (!isValid || id === null) {
				return (
					errorResponse ||
					NextResponse.json({ error: "Invalid ID" }, { status: 400 })
				);
			}

			const weapon = await prisma.weapon.findUnique({
				where: { id },
				include: {
					user: true,
					base_weapon: true,
				},
			});

			if (!weapon) {
				return NextResponse.json(
					{ error: "Weapon not found", id },
					{ status: 404 },
				);
			}

			return NextResponse.json(weapon);
		}) as Promise<NextResponse>;
	} catch (error) {
		console.error("Error in GET:", error);
		return NextResponse.json(
			{
				error: "Failed to retrieve weapon",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;

		return withErrorHandling(async () => {
			const [isValid, id, errorResponse] = validateId(paramId);
			if (!isValid || id === null) {
				return (
					errorResponse ||
					NextResponse.json({ error: "Invalid ID" }, { status: 400 })
				);
			}

			const [data, parseError] =
				await parseRequestBody<WeaponUpdateData>(request);
			if (parseError) return parseError;
			if (!data) {
				return NextResponse.json(
					{ error: "Invalid request body" },
					{ status: 400 },
				);
			}

			console.log("Update weapon data received:", data);

			try {
				const baseWeapon = await prisma.baseWeapon.findUnique({
					where: { nom: data.nom_arme },
				});

				if (!baseWeapon) {
					return NextResponse.json(
						{ error: "Base weapon not found", nom_arme: data.nom_arme },
						{ status: 404 },
					);
				}

				const updateData = {
					...(data.horodateur && { horodateur: new Date(data.horodateur) }),
					...(data.detenteur && { detenteur: data.detenteur }),
					...(typeof data.bp !== "undefined" && { bp: String(data.bp) }),
					...(data.serigraphie && { serigraphie: data.serigraphie }),
					...(data.prix && { prix: data.prix }),
					...(data.user_id && {
						user: {
							connect: { id: Number.parseInt(data.user_id) },
						},
					}),
					base_weapon: {
						connect: { nom: data.nom_arme },
					},
				};

				const weapon = await prisma.weapon.update({
					where: { id },
					data: updateData,
					include: {
						user: true,
						base_weapon: true,
					},
				});

				return NextResponse.json(weapon);
			} catch (error) {
				console.error("Prisma update error:", error);
				if (error instanceof Error) {
					console.error("Error details:", {
						name: error.name,
						message: error.message,
						stack: error.stack,
					});
				}
				return NextResponse.json(
					{
						error: "Failed to update weapon",
						details: error instanceof Error ? error.message : String(error),
					},
					{ status: 500 },
				);
			}
		});
	} catch (error) {
		console.error("Error in PUT:", error);
		return NextResponse.json(
			{
				error: "Failed to update weapon",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;

		return withErrorHandling(async () => {
			const [isValid, id, errorResponse] = validateId(paramId);
			if (!isValid || id === null) {
				return (
					errorResponse ||
					NextResponse.json({ error: "Invalid ID" }, { status: 400 })
				);
			}

			console.log("Deleting weapon with ID:", id);

			let bodyData: { username?: string; weaponData?: WeaponData } = {};
			try {
				bodyData = await request.json();
			} catch {}

			const weapon = await prisma.weapon.findUnique({
				where: { id },
				include: {
					user: true,
				},
			});

			if (!weapon) {
				return NextResponse.json(
					{ error: "Weapon not found", id },
					{ status: 404 },
				);
			}

			await prisma.weapon.delete({
				where: { id },
			});

			console.log("Weapon deleted successfully:", id);

			if (bodyData.weaponData && bodyData.username) {
				try {
					const { logWeaponModification } = await import("@/utils/discord");

					await logWeaponModification(
						bodyData.weaponData,
						bodyData.username,
						"delete",
					);

					console.log("Discord notification sent for weapon deletion");
				} catch (discordError) {
					console.error("Failed to send Discord notification:", discordError);
				}
			} else if (weapon) {
				try {
					const { logWeaponModification } = await import("@/utils/discord");

					await logWeaponModification(
						{
							name: weapon.nom_arme,
							model: weapon.nom_arme,
							price: weapon.prix,
							cost: weapon.cout_production,
							description: weapon.serigraphie,
						},
						weapon.user?.name || "Utilisateur inconnu",
						"delete",
					);

					console.log(
						"Discord notification sent for weapon deletion (fallback data)",
					);
				} catch (discordError) {
					console.error(
						"Failed to send Discord notification with fallback data:",
						discordError,
					);
				}
			}

			return NextResponse.json({ success: true });
		});
	} catch (error) {
		console.error("Error in DELETE:", error);
		return NextResponse.json(
			{
				error: "Failed to delete weapon",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}

export const dynamic = "force-dynamic";

export async function OPTIONS() {
	return createCorsOptionsResponse();
}
