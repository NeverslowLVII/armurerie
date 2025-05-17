import { authOptions } from "@/features/auth/services/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/services/api";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || session.user.role !== "PATRON") {
			return NextResponse.json(
				{ error: "Unauthorized - Only PATRON can create user accounts" },
				{ status: 403 },
			);
		}

		const { name, email, password, color, contractUrl, commission } =
			await request.json();

		if (!name || !email || !password) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "Email already exists" },
				{ status: 400 },
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				color,
				contractUrl,
				commission: commission || 0,
				role: Role.EMPLOYEE,
			},
		});

		return NextResponse.json({
			success: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				contractUrl: user.contractUrl,
				commission: user.commission,
			},
		});
	} catch (error) {
		console.error("Create user error:", error);
		return NextResponse.json(
			{ error: "Failed to create user account" },
			{ status: 500 },
		);
	}
}
