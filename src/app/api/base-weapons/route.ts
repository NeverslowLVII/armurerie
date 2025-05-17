import { verifyAuthTokenAndGetUser } from "@/features/auth/services/authUtils";
import { prisma } from "@/lib/prisma";
import type { Role, User } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

type MinimalUser = Pick<User, "id" | "email" | "name" | "role">;
type AuthResult = { status: number; user: MinimalUser | null };

export async function GET(request: NextRequest) {
	try {
		let _authResult: AuthResult = {
			status: 200,
			user: null,
		};
		let _isAuthenticated = false;

		try {
			const secret = process.env.NEXTAUTH_SECRET;
			const token = await getToken({ req: request, secret });

			if (token) {
				_authResult = {
					user: {
						id: Number(token.id),
						email: token.email as string,
						name: token.name as string,
						role: token.role as Role,
					},
					status: 200,
				};
				_isAuthenticated = true;
			} else {
				const cookieStore = await cookies();
				const authToken = cookieStore.get("auth_token")?.value;

				if (authToken) {
					const tokenAuthResult = await verifyAuthTokenAndGetUser(authToken);
					if (!("error" in tokenAuthResult)) {
						_authResult = tokenAuthResult;
						_isAuthenticated = true;
					} else {
					}
				} else {
				}
			}
		} catch (authError) {
			console.error("Authentication error:", authError);
		}

		const searchParams = request.nextUrl.searchParams;
		const page = Number.parseInt(searchParams.get("page") || "1");
		const pageSize = Number.parseInt(searchParams.get("pageSize") || "50");

		if (Number.isNaN(page) || page < 1) {
			return NextResponse.json(
				{ error: "Invalid page number" },
				{ status: 400 },
			);
		}
		if (Number.isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
			return NextResponse.json(
				{ error: "Invalid page size (must be between 1 and 100)" },
				{ status: 400 },
			);
		}

		const skip = (page - 1) * pageSize;
		const take = pageSize;

		try {
			const [baseWeapons, totalCount] = await prisma.$transaction([
				prisma.baseWeapon.findMany({
					skip: skip,
					take: take,
					orderBy: {
						nom: "asc",
					},
				}),
				prisma.baseWeapon.count(),
			]);

			return NextResponse.json({
				baseWeapons: baseWeapons,
				totalCount: totalCount,
				page: page,
				pageSize: pageSize,
			});
		} catch (error) {
			console.error("Error fetching base weapons:", error);
			return NextResponse.json(
				{ error: "Error fetching base weapons" },
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Error in base weapons GET route:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const nextRequest = request as unknown as NextRequest;
		const secret = process.env.NEXTAUTH_SECRET;
		const token = await getToken({ req: nextRequest, secret });

		let authResult: AuthResult = {
			status: 401,
			user: null,
		};
		let isAuthenticated = false;

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
			isAuthenticated = true;
		} else {
			const cookieStore = await cookies();
			const authToken = cookieStore.get("auth_token")?.value;

			if (authToken) {
				const tokenAuthResult = await verifyAuthTokenAndGetUser(authToken);
				if (!("error" in tokenAuthResult)) {
					authResult = tokenAuthResult;
					isAuthenticated = true;
				} else {
				}
			} else {
			}
		}

		if (!isAuthenticated) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		if (!authResult.user) {
			return NextResponse.json({ error: "User not found" }, { status: 401 });
		}

		const isAdmin = ["PATRON", "CO_PATRON", "DEVELOPER"].includes(
			authResult.user.role,
		);

		if (!isAdmin) {
			return NextResponse.json(
				{ error: "Only admins can create base weapons" },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const baseWeapon = await prisma.baseWeapon.create({
			data: {
				nom: body.nom,
				prix_defaut: body.prix_defaut,
				cout_production_defaut: body.cout_production_defaut || 0,
			},
		});
		return NextResponse.json(baseWeapon);
	} catch (error) {
		console.error("Error creating base weapon:", error);
		return NextResponse.json(
			{ error: "Error creating base weapon" },
			{ status: 500 },
		);
	}
}
