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

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;

		const numericId = Number.parseInt(paramId, 10);
		if (!Number.isNaN(numericId)) {
			const baseWeapon = await prisma.baseWeapon.findUnique({
				where: { id: numericId },
			});
			if (baseWeapon) {
				return NextResponse.json(baseWeapon);
			}
		}

		const baseWeaponByName = await prisma.baseWeapon.findUnique({
			where: { nom: paramId },
		});

		if (!baseWeaponByName) {
			return NextResponse.json(
				{ error: "Base weapon not found", id: paramId },
				{ status: 404 },
			);
		}

		return NextResponse.json(baseWeaponByName);
	} catch (error) {
		console.error("Get base weapon error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch base weapon" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		let isAdmin = false;

		const secret = process.env.NEXTAUTH_SECRET;
		const token = await getToken({ req: request, secret });

		let authResult: AuthResult | ErrorResult = {
			error: "Unauthorized",
			status: 401,
		};

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
			isAdmin = ["PATRON", "CO_PATRON", "DEVELOPER"].includes(
				token.role as Role,
			);
		} else {
			const cookieStore = await cookies();
			const authToken = cookieStore.get("auth_token")?.value;
			authResult = await verifyAuthTokenAndGetUser(authToken);

			if (!("error" in authResult)) {
				isAdmin = ["PATRON", "CO_PATRON", "DEVELOPER"].includes(
					authResult.user.role,
				);
			}
		}

		if ("error" in authResult) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status },
			);
		}

		if (!isAdmin) {
			return NextResponse.json(
				{ error: "Only admins can update base weapons" },
				{ status: 403 },
			);
		}

		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;

		const numericId = Number.parseInt(paramId, 10);
		if (!Number.isNaN(numericId)) {
			const baseWeapon = await prisma.baseWeapon.findUnique({
				where: { id: numericId },
			});
			if (baseWeapon) {
				const data = await request.json();
				const updated = await prisma.baseWeapon.update({
					where: { id: numericId },
					data: {
						nom: data.nom,
						prix_defaut: data.prix_defaut,
						cout_production_defaut: data.cout_production_defaut,
					},
				});
				return NextResponse.json(updated);
			}
		}

		const baseWeaponByName = await prisma.baseWeapon.findUnique({
			where: { nom: paramId },
		});

		if (!baseWeaponByName) {
			return NextResponse.json(
				{ error: "Base weapon not found", id: paramId },
				{ status: 404 },
			);
		}

		const data = await request.json();
		const updatedByName = await prisma.baseWeapon.update({
			where: { id: baseWeaponByName.id },
			data: {
				nom: data.nom,
				prix_defaut: data.prix_defaut,
				cout_production_defaut: data.cout_production_defaut,
			},
		});

		return NextResponse.json(updatedByName);
	} catch (error) {
		console.error("Update base weapon error:", error);
		return NextResponse.json(
			{ error: "Failed to update base weapon" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		let isAdmin = false;

		const secret = process.env.NEXTAUTH_SECRET;
		const token = await getToken({ req: request, secret });

		let authResult: AuthResult | ErrorResult = {
			error: "Unauthorized",
			status: 401,
		};

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
			isAdmin = ["PATRON", "CO_PATRON", "DEVELOPER"].includes(
				token.role as Role,
			);
		} else {
			const cookieStore = await cookies();
			const authToken = cookieStore.get("auth_token")?.value;
			authResult = await verifyAuthTokenAndGetUser(authToken);

			if (!("error" in authResult)) {
				isAdmin = ["PATRON", "CO_PATRON", "DEVELOPER"].includes(
					authResult.user.role,
				);
			}
		}

		if ("error" in authResult) {
			return NextResponse.json(
				{ error: authResult.error },
				{ status: authResult.status },
			);
		}

		if (!isAdmin) {
			return NextResponse.json(
				{ error: "Only admins can delete base weapons" },
				{ status: 403 },
			);
		}

		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;

		console.info("Deleting base weapon with ID/name:", paramId);

		const numericId = Number.parseInt(paramId, 10);
		if (!Number.isNaN(numericId)) {
			const baseWeapon = await prisma.baseWeapon.findUnique({
				where: { id: numericId },
			});
			if (baseWeapon) {
				const relatedWeaponsCount = await prisma.weapon.count({
					where: { nom_arme: baseWeapon.nom },
				});

				if (relatedWeaponsCount > 0) {
					return NextResponse.json(
						{
							error: "Cannot delete base weapon that is in use",
							details: `Foreign key constraint violated on the constraint: Weapon_nom_arme_fkey. This base weapon is used by ${relatedWeaponsCount} weapons.`,
						},
						{ status: 409 },
					);
				}

				await prisma.baseWeapon.delete({
					where: { id: numericId },
				});
				console.info("Base weapon deleted by ID:", numericId);
				return NextResponse.json({ success: true });
			}
		}

		const baseWeaponByName = await prisma.baseWeapon.findUnique({
			where: { nom: paramId },
		});

		if (!baseWeaponByName) {
			return NextResponse.json(
				{ error: "Base weapon not found", id: paramId },
				{ status: 404 },
			);
		}

		const relatedWeaponsCount = await prisma.weapon.count({
			where: { nom_arme: baseWeaponByName.nom },
		});

		if (relatedWeaponsCount > 0) {
			return NextResponse.json(
				{
					error: "Cannot delete base weapon that is in use",
					details: `Foreign key constraint violated on the constraint: Weapon_nom_arme_fkey. This base weapon is used by ${relatedWeaponsCount} weapons.`,
				},
				{ status: 409 },
			);
		}

		await prisma.baseWeapon.delete({
			where: { id: baseWeaponByName.id },
		});

		console.info("Base weapon deleted by name:", paramId);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Delete base weapon error:", error);
		return NextResponse.json(
			{
				error: "Failed to delete base weapon",
				details: error instanceof Error ? error.message : String(error),
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
