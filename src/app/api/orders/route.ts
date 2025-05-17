import { verifyAuthTokenAndGetUser } from "@/features/auth/services/authUtils";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

interface AuthResult {
	user: {
		id: number;
		email: string;
		name: string;
		role: Role;
	};
	status: number;
}

interface ErrorResult {
	error: string;
	status: number;
}

interface OrderBody {
	userId: number;
	items: Array<{
		baseWeaponId?: number;
		catalogEntryId?: number;
		quantity: number;
	}>;
}

export async function GET(request: NextRequest) {
	try {
		const secret = process.env.NEXTAUTH_SECRET;
		const token = await getToken({ req: request, secret });

		let authResult: AuthResult | ErrorResult;
		if (token) {
			authResult = {
				user: {
					id: Number(token.id),
					email: token.email as string,
					name: token.name as string,
					role: token.role as Role,
				},
				status: 200,
			};
		} else {
			const cookieStore = await cookies();
			const authToken = cookieStore.get("auth_token")?.value;
			authResult = await verifyAuthTokenAndGetUser(authToken);
		}

		if ("error" in authResult) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status },
			);
		}

		const { searchParams } = request.nextUrl;
		const page = Number(searchParams.get("page")) || 1;
		const pageSize = Number(searchParams.get("pageSize")) || 10;
		const skip = (page - 1) * pageSize;

		const isAdmin = ["PATRON", "CO_PATRON", "DEVELOPER"].includes(
			authResult.user.role,
		);

		const whereClause = isAdmin ? {} : { userId: authResult.user.id };

		const [orders, totalCount] = await prisma.$transaction([
			prisma.order.findMany({
				where: whereClause,
				include: {
					user: {
						select: {
							id: true,
							name: true,
							role: true,
						},
					},
					items: {
						include: {
							baseWeapon: {
								select: {
									id: true,
									nom: true,
									prix_defaut: true,
									cout_production_defaut: true,
								},
							},
						},
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				skip,
				take: pageSize,
			}),
			prisma.order.count({
				where: whereClause,
			}),
		]);

		return NextResponse.json({
			orders,
			pagination: {
				totalCount,
				totalPages: Math.ceil(totalCount / pageSize),
				currentPage: page,
				pageSize,
			},
		});
	} catch (error) {
		console.error("Error fetching orders:", error);
		return NextResponse.json(
			{ error: "An error occurred while fetching orders" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const headers = request.headers;

		const _cookieHeader = headers.get("cookie");

		const secret = process.env.NEXTAUTH_SECRET;

		const token = await getToken({ req: request, secret });

		let authResult: AuthResult | ErrorResult;

		if (token) {
			authResult = {
				user: {
					id: Number(token.id),
					email: token.email as string,
					name: token.name as string,
					role: token.role as Role,
				},
				status: 200,
			};
		} else {
			const cookieStore = await cookies();
			const authToken = cookieStore.get("auth_token")?.value;
			authResult = await verifyAuthTokenAndGetUser(authToken);
		}

		if ("error" in authResult) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status },
			);
		}

		let body: OrderBody;
		try {
			body = await request.json();
		} catch (error) {
			console.error("Error parsing request body:", error);
			return NextResponse.json(
				{ error: "Invalid request body format" },
				{ status: 400 },
			);
		}

		const { items } = body;

		if (!items || !Array.isArray(items) || items.length === 0) {
			return NextResponse.json(
				{ error: "Invalid order: items array is required" },
				{ status: 400 },
			);
		}

		let totalPrice = 0;
		const orderItems = [];

		for (const item of items) {
			if (!item.baseWeaponId && !item.catalogEntryId) {
				return NextResponse.json(
					{
						error:
							"Each item must have either a baseWeaponId or a catalogEntryId",
					},
					{ status: 400 },
				);
			}

			if (item.baseWeaponId) {
				const baseWeapon = await prisma.baseWeapon.findUnique({
					where: { id: item.baseWeaponId },
				});

				if (!baseWeapon) {
					return NextResponse.json(
						{ error: `Base weapon with ID ${item.baseWeaponId} not found` },
						{ status: 404 },
					);
				}

				const itemTotal = baseWeapon.prix_defaut * item.quantity;
				totalPrice += itemTotal;

				orderItems.push({
					baseWeaponId: item.baseWeaponId,
					quantity: item.quantity,
					pricePerItem: baseWeapon.prix_defaut,
					costPerItem: baseWeapon.cout_production_defaut,
				});
			} else if (item.catalogEntryId) {
				const catalogEntry = await prisma.weaponCatalog.findUnique({
					where: { id: item.catalogEntryId },
				});

				if (!catalogEntry) {
					return NextResponse.json(
						{ error: `Catalog entry with ID ${item.catalogEntryId} not found` },
						{ status: 404 },
					);
				}

				let baseWeapon = await prisma.baseWeapon.findUnique({
					where: { nom: catalogEntry.name },
				});

				if (!baseWeapon) {
					baseWeapon = await prisma.baseWeapon.create({
						data: {
							nom: catalogEntry.name,
							prix_defaut: catalogEntry.vente,
							cout_production_defaut: catalogEntry.cout,
						},
					});
				}

				const itemTotal = catalogEntry.vente * item.quantity;
				totalPrice += itemTotal;

				orderItems.push({
					baseWeaponId: baseWeapon.id,
					quantity: item.quantity,
					pricePerItem: catalogEntry.vente,
					costPerItem: catalogEntry.cout,
				});
			}
		}

		const newOrder = await prisma.order.create({
			data: {
				userId: authResult.user.id,
				totalPrice,
				items: {
					create: orderItems,
				},
			},
			include: {
				user: {
					select: {
						id: true,
						name: true,
						role: true,
					},
				},
				items: {
					include: {
						baseWeapon: {
							select: {
								id: true,
								nom: true,
								prix_defaut: true,
								cout_production_defaut: true,
							},
						},
					},
				},
			},
		});

		return NextResponse.json(newOrder, { status: 201 });
	} catch (error) {
		console.error("Error creating order:", error);
		return NextResponse.json(
			{ error: "An error occurred while creating the order" },
			{ status: 500 },
		);
	}
}
