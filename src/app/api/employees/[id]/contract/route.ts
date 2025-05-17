import { authOptions } from "@/features/auth/services/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { del, put } from "@vercel/blob";
import { getServerSession } from "next-auth";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return new NextResponse("Non autorisé", { status: 401 });
		}

		const currentUser = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (
			!currentUser ||
			(currentUser.role !== Role.PATRON &&
				currentUser.role !== Role.CO_PATRON &&
				currentUser.role !== Role.DEVELOPER)
		) {
			return new NextResponse(
				"Non autorisé - Accès réservé aux administrateurs",
				{
					status: 403,
				},
			);
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return new NextResponse("Fichier manquant", { status: 400 });
		}

		const resolvedParams = await context.params;
		const userId = Number.parseInt(resolvedParams.id);
		if (Number.isNaN(userId)) {
			console.error("Invalid user ID format:", resolvedParams.id);
			return new NextResponse("Invalid user ID format", { status: 400 });
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, name: true },
		});

		if (!user) {
			return new NextResponse("Utilisateur non trouvé", { status: 404 });
		}

		const fileName = `contracts/${user.id}_${user.name.replaceAll(/\s+/g, "_")}_${Date.now()}.${file.name.split(".").pop()}`;

		const { url } = await put(fileName, file, { access: "public" });

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { contractUrl: url },
		});

		return NextResponse.json({
			success: true,
			contractUrl: updatedUser.contractUrl,
		});
	} catch (error) {
		console.error("Error uploading contract:", error);
		return new NextResponse("Erreur interne du serveur", { status: 500 });
	}
}

export async function GET(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return new NextResponse("Non autorisé", { status: 401 });
		}

		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;
		const userId = Number.parseInt(paramId);
		if (Number.isNaN(userId)) {
			console.error("Invalid user ID format:", paramId);
			return new NextResponse("Invalid user ID format", { status: 400 });
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { contractUrl: true },
		});

		if (!user?.contractUrl) {
			return new NextResponse("Contrat non trouvé", { status: 404 });
		}

		return NextResponse.json({ contractUrl: user.contractUrl });
	} catch (error) {
		console.error("Error fetching contract:", error);
		return new NextResponse("Erreur interne du serveur", { status: 500 });
	}
}

export async function DELETE(
	_request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.email) {
			return new NextResponse("Non autorisé", { status: 401 });
		}

		const currentUser = await prisma.user.findUnique({
			where: { email: session.user.email },
		});

		if (
			!currentUser ||
			(currentUser.role !== Role.PATRON &&
				currentUser.role !== Role.CO_PATRON &&
				currentUser.role !== Role.DEVELOPER)
		) {
			return new NextResponse(
				"Non autorisé - Accès réservé aux administrateurs",
				{
					status: 403,
				},
			);
		}
		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;
		const userId = Number.parseInt(paramId);
		if (Number.isNaN(userId)) {
			console.error("Invalid user ID format:", paramId);
			return new NextResponse("Invalid user ID format", { status: 400 });
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { contractUrl: true },
		});

		if (!user?.contractUrl) {
			return new NextResponse("Contrat non trouvé", { status: 404 });
		}

		const blobUrl = user.contractUrl;

		try {
			await del(blobUrl);
		} catch (error) {
			console.error(
				"Erreur lors de la suppression du fichier dans Vercel Blob:",
				error,
			);
		}

		await prisma.user.update({
			where: { id: userId },
			data: { contractUrl: null },
		});

		return NextResponse.json({
			success: true,
			message: "Contrat supprimé avec succès",
		});
	} catch (error) {
		console.error("Error deleting contract:", error);
		return new NextResponse("Erreur interne du serveur", { status: 500 });
	}
}
