import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key";

export async function verifyAuthTokenAndGetUser(authToken: string | undefined) {
	if (!authToken) {
		return { error: "Unauthorized", status: 401 };
	}

	try {
		const decoded = jwt.verify(authToken, JWT_SECRET) as {
			id: number;
			email: string;
			username?: string;
			role: string;
			name: string;
		};

		const user = await prisma.user.findUnique({
			where: { id: decoded.id },
			select: {
				id: true,
				email: true,
				username: true,
				name: true,
				role: true,
				color: true,
				contractUrl: true,
			},
		});

		if (!user) {
			throw new Error("User not found from token");
		}

		return { user: user, status: 200 };
	} catch (error) {
		console.error("Token verification or user lookup failed:", error);

		return { error: "Invalid token", status: 401 };
	}
} 