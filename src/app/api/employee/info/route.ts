import { authOptions } from "@/features/auth/services/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return new NextResponse("Non autorisé", { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: {
				email: session.user.email,
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				contractUrl: true,
			},
		});

		if (!user) {
			return new NextResponse("Utilisateur non trouvé", { status: 404 });
		}

		return NextResponse.json(user);
	} catch (error) {
		console.error("Error in employee info route:", error);
		return new NextResponse("Erreur interne du serveur", { status: 500 });
	}
}
