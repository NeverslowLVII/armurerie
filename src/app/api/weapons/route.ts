import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

interface WeaponPostBody {
	user_id: string | number;
	nom_arme: string;
	serigraphie: string;
	horodateur?: string;
	detenteur?: string;
	bp?: string;
	prix?: number;
	cout_production?: number;
}

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const page = Number.parseInt(searchParams.get("page") || "1");
	const pageSize = Number.parseInt(searchParams.get("pageSize") || "10");

	if (Number.isNaN(page) || page < 1) {
		return NextResponse.json({ error: "Invalid page number" }, { status: 400 });
	}
	if (Number.isNaN(pageSize) || pageSize < 1 || pageSize > 1000) {
		return NextResponse.json(
			{ error: "Invalid page size (must be between 1 and 1000)" },
			{ status: 400 },
		);
	}

	const skip = (page - 1) * pageSize;
	const take = pageSize;

	try {
		const [weapons, totalCount] = await prisma.$transaction([
			prisma.weapon.findMany({
				select: {
					id: true,
					horodateur: true,
					detenteur: true,
					bp: true,
					serigraphie: true,
					prix: true,
					cout_production: true,
					user_id: true,
					user: {
						select: {
							name: true,
							color: true,
							role: true,
							commission: true,
						},
					},
					base_weapon: {
						select: {
							nom: true,
						},
					},
				},
				orderBy: {
					horodateur: "desc",
				},
				skip: skip,
				take: take,
			}),
			prisma.weapon.count(),
		]);

		const weaponsWithNomArme = weapons.map((weapon) => ({
			...weapon,
			nom_arme: weapon.base_weapon?.nom || "N/A",
			base_weapon: undefined,
		}));

		return NextResponse.json({
			weapons: weaponsWithNomArme,
			totalCount: totalCount,
			page: page,
			pageSize: pageSize,
		});
	} catch (error) {
		console.error("Get weapons error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch weapons" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	let data: WeaponPostBody;
	let userId: number;
	let baseWeapon: {
		prix_defaut: number;
		cout_production_defaut: number;
	} | null;

	let createWeaponData: Prisma.WeaponCreateInput | null = null;

	try {
		data = await request.json();
		console.info("Creating weapon with data:", JSON.stringify(data, null, 2));

		if (!data.user_id || !data.nom_arme || !data.serigraphie) {
			const missing = [];
			if (!data.user_id) missing.push("user_id");
			if (!data.nom_arme) missing.push("nom_arme");
			if (!data.serigraphie) missing.push("serigraphie");

			console.error("Missing required fields:", missing);
			return NextResponse.json(
				{ error: "Missing required fields", missing, data },
				{ status: 400 },
			);
		}

		const userIdString = String(data.user_id);
		userId = Number.parseInt(userIdString);
		if (Number.isNaN(userId)) {
			console.error("Invalid user ID:", data.user_id);
			return NextResponse.json(
				{ error: "Invalid user ID", user_id: data.user_id },
				{ status: 400 },
			);
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});
		if (!user) {
			console.error("User not found:", userId);
			return NextResponse.json(
				{ error: "User not found", user_id: userId },
				{ status: 404 },
			);
		}

		baseWeapon = await prisma.baseWeapon.findUnique({
			where: { nom: data.nom_arme },
		});
		if (!baseWeapon) {
			console.error("Base weapon not found:", data.nom_arme);
			return NextResponse.json(
				{ error: "Base weapon not found", nom_arme: data.nom_arme },
				{ status: 404 },
			);
		}

		createWeaponData = {
			horodateur: data.horodateur ? new Date(data.horodateur) : new Date(),
			user: { connect: { id: userId } },
			detenteur: data.detenteur || "",
			bp: data.bp || null,
			// Connect base weapon by name
			base_weapon: { connect: { nom: data.nom_arme } },
			serigraphie: data.serigraphie,
			prix: data.prix ?? baseWeapon.prix_defaut,
			cout_production:
				data.cout_production ?? baseWeapon.cout_production_defaut,
		};

		// Create weapon
		const weapon = await prisma.weapon.create({
			data: createWeaponData,
			include: {
				user: true,
				base_weapon: true,
			},
		});

		console.info(
			"Weapon created successfully:",
			JSON.stringify(weapon, null, 2),
		);
		return NextResponse.json(weapon);
	} catch (error) {
		console.error("Create weapon error:", error);
		if (error instanceof Error) {
			console.error("Error details:", {
				name: error.name,
				message: error.message,
				stack: error.stack,
			});

			// Handle unique constraint for serigraphie
			if (
				error.name === "PrismaClientKnownRequestError" &&
				error.message.includes(
					"Unique constraint failed on the fields: (`serigraphie`)",
				)
			) {
				return NextResponse.json(
					{
						error: "Ce numéro de série est déjà utilisé par une autre arme",
						code: "P2002",
						field: "serigraphie",
						details: error.message,
					},
					{ status: 409 },
				);
			}

			if (
				error.message.includes(
					"Unique constraint failed on the fields: (`id`)",
				) &&
				createWeaponData
			) {
				try {
					const maxId = await prisma.weapon.findFirst({
						orderBy: { id: "desc" },
						select: { id: true },
					});

					await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"Weapon"', 'id'), ${maxId ? maxId.id + 1 : 1}, false);`;

					if (!createWeaponData) {
						throw new Error(
							"Create weapon data is undefined after sequence reset",
						);
					}

					const weapon = await prisma.weapon.create({
						data: createWeaponData,
						include: {
							user: true,
							base_weapon: true,
						},
					});
					return NextResponse.json(weapon);
				} catch (retryError) {
					console.error("Failed to reset sequence and retry:", retryError);
				}
			}
		}
		return NextResponse.json(
			{
				error: "Failed to create weapon",
				details: error instanceof Error ? error.message : String(error),
				type: error instanceof Error ? error.name : typeof error,
			},
			{ status: 500 },
		);
	}
}

export const dynamic = "force-dynamic";

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Max-Age": "86400",
		},
	});
}
