import { verifyAuthTokenAndGetUser } from "@/features/auth/services/authUtils";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key";

export async function POST(request: Request) {
	try {
		const { email, username, password } = await request.json();

		const user = await prisma.user.findFirst({
			where: {
				OR: [{ email: email || "" }, { username: username || "" }],
			},
		});

		if (!user) {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401 },
			);
		}

		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			return NextResponse.json(
				{ error: "Invalid credentials" },
				{ status: 401 },
			);
		}

		await prisma.user.update({
			where: { id: user.id },
			data: { lastLogin: new Date() },
		});

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				username: user.username,
				role: user.role,
				name: user.name,
			},
			JWT_SECRET,
			{ expiresIn: "24h" },
		);

		const response = NextResponse.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				name: user.name,
				role: user.role,
				color: user.color,
				contractUrl: user.contractUrl,
			},
		});

		response.cookies.set("auth_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 86_400,
		});

		return response;
	} catch (error) {
		console.error("Authentication error:", error);
		return NextResponse.json(
			{ error: "Authentication failed" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const cookiesStore = await cookies();
		const authToken = cookiesStore.get("auth_token")?.value;

		const result = await verifyAuthTokenAndGetUser(authToken);

		if (result.error) {
			return NextResponse.json(
				{ error: result.error },
				{ status: result.status },
			);
		}

		return NextResponse.json({ user: result.user }, { status: result.status });
	} catch (error) {
		console.error("Error reading cookies or during auth check:", error);
		return NextResponse.json(
			{ error: "Authentication failed due to server error" },
			{ status: 500 },
		);
	}
}
