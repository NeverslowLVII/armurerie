import { authOptions } from "@/features/auth/services/auth";
import { prisma } from "@/lib/prisma";
import { endOfWeek, startOfWeek } from "date-fns";
import { getServerSession } from "next-auth";
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
		});

		if (!user) {
			return new NextResponse("Utilisateur non trouvé", { status: 404 });
		}

		const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
		const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });

		const sales = await prisma.weapon.findMany({
			where: {
				user_id: user.id,
				horodateur: {
					gte: startDate,
					lte: endDate,
				},
			},
			orderBy: {
				horodateur: "desc",
			},
		});

		const totalAmount = sales.reduce((sum, sale) => sum + sale.prix, 0);

		return NextResponse.json({
			sales,
			totalAmount,
		});
	} catch (error) {
		console.error("Error in weekly sales route:", error);
		return new NextResponse("Erreur interne du serveur", { status: 500 });
	}
}
