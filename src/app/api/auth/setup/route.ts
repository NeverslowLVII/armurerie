import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/tokens";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		console.info("Setup API called");
		const { token, password } = await request.json();
		console.info("Received token and password");

		const payload = verifyToken(token);
		console.info("Token verification result:", payload);

		if (!payload || payload.type !== "setup") {
			console.info("Invalid token or wrong type");
			return NextResponse.json(
				{ error: "Token invalide ou expiré" },
				{ status: 401 },
			);
		}

		const user = await prisma.user.findUnique({
			where: { id: payload.userId },
		});
		console.info("User found:", !!user);

		if (!user) {
			return NextResponse.json(
				{ error: "Utilisateur non trouvé" },
				{ status: 404 },
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		console.info("Password hashed");

		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashedPassword,
				lastLogin: new Date(),
			},
		});
		console.info("User updated successfully");

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Setup error:", error);
		return NextResponse.json(
			{ error: "Erreur lors de la configuration du compte" },
			{ status: 500 },
		);
	}
}
