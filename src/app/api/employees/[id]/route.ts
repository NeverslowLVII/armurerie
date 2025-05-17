import { authOptions } from "@/features/auth/services/auth";
import { prisma } from "@/lib/prisma";
import { isValidRole } from "@/utils/roles";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;
		const id = Number.parseInt(paramId);
		if (Number.isNaN(id)) {
			console.error("Invalid user ID format:", paramId);
			return NextResponse.json(
				{ error: "Invalid user ID format" },
				{ status: 400 },
			);
		}

		const user = await prisma.user.findUnique({
			where: { id },
			include: { weapons: true },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json(user);
	} catch (error) {
		console.error("Get user error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch user" },
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
		const id = Number.parseInt(paramId);
		if (Number.isNaN(id)) {
			console.error("Invalid user ID:", paramId);
			return NextResponse.json(
				{ error: "Invalid user ID format" },
				{ status: 400 },
			);
		}

		const data = await request.json();

		console.info("PUT /api/employees/[id] - Request data:", {
			id,
			data,
			params: resolvedParams,
		});

		const session = await getServerSession(authOptions);

		if (!session) {
			console.info("No session found, user is not authenticated");
			return NextResponse.json(
				{ error: "Vous devez être connecté pour effectuer cette action" },
				{ status: 401 },
			);
		}

		if (
			session.user.role !== Role.PATRON &&
			session.user.role !== Role.CO_PATRON &&
			session.user.role !== Role.DEVELOPER
		) {
			console.info(
				"User does not have permission to update users:",
				session.user.role,
			);
			return NextResponse.json(
				{
					error:
						"Vous n'avez pas les droits nécessaires pour effectuer cette action",
				},
				{ status: 403 },
			);
		}

		if (data.role && !isValidRole(data.role)) {
			console.info("Invalid role:", data.role);
			return NextResponse.json(
				{ error: "Invalid role. Must be EMPLOYEE, CO_PATRON, or PATRON" },
				{ status: 400 },
			);
		}

		if (data.role && data.role !== "PATRON") {
			const currentUser = await prisma.user.findUnique({ where: { id } });
			console.info("Current user:", currentUser);

			if (currentUser?.role === "PATRON") {
				const session = await getServerSession(authOptions);
				console.info("User session:", session);

				if (data.role === "DEVELOPER") {
					console.info("Allowing change from PATRON to DEVELOPER");
				} else if (session?.user.role !== Role.DEVELOPER) {
					const patronCount = await prisma.user.count({
						where: { role: "PATRON" },
					});
					console.info("Patron count:", patronCount);

					if (patronCount <= 1) {
						console.info("Cannot demote the last PATRON");
						return NextResponse.json(
							{ error: "Cannot demote the last PATRON" },
							{ status: 400 },
						);
					}
				}
			}
		}

		if (data.username) {
			const existingUser = await prisma.user.findFirst({
				where: {
					username: data.username,
					NOT: {
						id: id,
					},
				},
			});

			console.info("Username check:", {
				requested: data.username,
				existing: existingUser,
			});

			if (existingUser) {
				console.info("Username already exists:", data.username);
				return NextResponse.json(
					{ error: "Ce nom d'utilisateur est déjà utilisé" },
					{ status: 400 },
				);
			}
		}

		if (data.email) {
			const existingUser = await prisma.user.findFirst({
				where: {
					email: data.email,
					NOT: {
						id: id,
					},
				},
			});

			console.info("Email check:", {
				requested: data.email,
				existing: existingUser,
			});

			if (existingUser) {
				console.info("Email already exists:", data.email);
				return NextResponse.json(
					{ error: "Cet email est déjà utilisé" },
					{ status: 400 },
				);
			}
		}

		const existingUserCheck = await prisma.user.findUnique({
			where: { id },
		});

		if (!existingUserCheck) {
			console.info("User not found:", id);
			return NextResponse.json(
				{ error: "Utilisateur non trouvé" },
				{ status: 404 },
			);
		}

		const updateData: {
			name?: string;
			username?: string;
			email?: string;
			color?: string | null;
			role?: Role;
			commission?: number;
		} = {
			name: data.name,
			username: data.username,
			email: data.email,
			color: data.color,
			role: data.role,
			commission: data.commission,
		};

		for (const key of Object.keys(updateData)) {
			if (updateData[key as keyof typeof updateData] === undefined) {
				delete updateData[key as keyof typeof updateData];
			}
		}

		console.info("Final update data:", updateData);

		try {
			const user = await prisma.user.update({
				where: { id },
				data: updateData,
				include: { weapons: true },
			});

			console.info("Updated user:", user);
			return NextResponse.json(user);
		} catch (prismaError) {
			console.error("Prisma update error:", prismaError);
			return NextResponse.json(
				{
					error:
						"Erreur lors de la mise à jour de l'utilisateur dans la base de données",
					details: String(prismaError),
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Update user error:", error);
		if (error instanceof Error && error.message.includes("Invalid user ID")) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}
		return NextResponse.json(
			{ error: "Failed to update user" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;
		const userId = Number.parseInt(paramId);
		if (Number.isNaN(userId)) {
			console.error("Invalid user ID:", paramId);
			return NextResponse.json(
				{ error: "Invalid user ID", user_id: paramId },
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

		await prisma.user.update({
			where: { id: userId },
			data: {
				deleted: true,
				deletedAt: new Date(),
			},
		});
		return NextResponse.json({
			success: true,
			message: `User ${userId} soft deleted successfully`,
		});
	} catch (error) {
		console.error("Delete user error:", error);
		return NextResponse.json(
			{ error: "Failed to delete user" },
			{ status: 500 },
		);
	}
}

export const dynamic = "force-dynamic";

export async function OPTIONS() {
	return new NextResponse(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type, Authorization",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Max-Age": "86400",
		},
	});
}
