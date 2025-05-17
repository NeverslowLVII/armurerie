import { generateSetupEmailHtml, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { generateSetupLink } from "@/lib/tokens";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const users = await prisma.user.findMany({
			where: {
				role: {
					in: ["EMPLOYEE", "PATRON", "CO_PATRON"],
				},
				deleted: false,
			},
		});
		return NextResponse.json(users);
	} catch (error) {
		console.error("Error fetching employees:", error);
		return NextResponse.json(
			{ error: "Error fetching employees" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const data = await request.json();
		if (!data.name || !data.email || !data.username) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const existingEmail = await prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existingEmail) {
			return NextResponse.json(
				{ error: "Cet email est déjà utilisé" },
				{ status: 400 },
			);
		}

		const existingUsername = await prisma.user.findUnique({
			where: { username: data.username },
		});

		if (existingUsername) {
			return NextResponse.json(
				{ error: "Ce nom d'utilisateur est déjà utilisé" },
				{ status: 400 },
			);
		}

		const tempPassword = Math.random().toString(36).slice(-10);
		const user = await prisma.user.create({
			data: {
				name: data.name,
				username: data.username,
				email: data.email,
				password: tempPassword,
				color: data.color,
				commission: data.commission || 0,
				role: data.role || "EMPLOYEE",
			},
		});

		const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
		const host =
			request.headers.get("host") ||
			process.env.NEXTAUTH_URL ||
			"localhost:3000";
		const baseUrl = `${protocol}://${host}`;
		const setupLink = generateSetupLink(user.id, user.email, baseUrl);

		await sendEmail({
			to: user.email,
			subject: "Configuration de votre compte Armurerie",
			html: generateSetupEmailHtml(setupLink, user.name),
		});

		const { password: _password, ...userWithoutPassword } = user;

		return NextResponse.json({
			success: true,
			user: userWithoutPassword,
			setupLink,
		});
	} catch (error) {
		console.error("Create employee error:", error);
		return NextResponse.json(
			{ error: "Failed to create employee" },
			{ status: 500 },
		);
	}
}
