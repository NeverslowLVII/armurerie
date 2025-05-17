import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { id: Number.parseInt(session.user.id) },
			select: { contractUrl: true },
		});

		if (!user || !user.contractUrl) {
			return NextResponse.json(
				{ error: "Contract URL not found" },
				{ status: 404 },
			);
		}

		return NextResponse.redirect(user.contractUrl);
	} catch (error) {
		console.error("Get contract error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch contract" },
			{ status: 500 },
		);
	}
}
