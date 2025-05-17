import { authOptions } from "@/lib/auth";
import { generateSetupEmailHtml, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { generateSetupLink } from "@/lib/tokens";
import { getServerSession } from "next-auth/next";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const session = await getServerSession(authOptions);
		if (
			!session ||
			!["PATRON", "CO_PATRON", "DEVELOPER"].includes(session.user.role)
		) {
			return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
		}

		const resolvedParams = await context.params;
		const paramId = resolvedParams.id;
		const employeeId = Number.parseInt(paramId);
		if (Number.isNaN(employeeId)) {
			return NextResponse.json(
				{ error: "ID d'employé invalide" },
				{ status: 400 },
			);
		}

		const employee = await prisma.user.findUnique({
			where: { id: employeeId },
		});

		if (!employee) {
			return NextResponse.json(
				{ error: "Employé non trouvé" },
				{ status: 404 },
			);
		}

		const requestData = await request.json().catch(() => ({}));
		const generateLinkOnly = requestData.generateLinkOnly === true;

		const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
		const setupLink = generateSetupLink(employee.id, employee.email, baseUrl);

		if (generateLinkOnly) {
			return NextResponse.json({
				success: true,
				message: `Lien de configuration généré pour ${employee.name}`,
				setupLink,
			});
		}

		await sendEmail({
			to: employee.email,
			subject: "Configuration de votre compte Armurerie",
			html: generateSetupEmailHtml(setupLink, employee.name),
		});

		return NextResponse.json({
			success: true,
			message: `Email de configuration envoyé à ${employee.email}`,
			setupLink,
		});
	} catch (error) {
		console.error("Error sending setup email:", error);
		return NextResponse.json(
			{ error: "Erreur lors de l'envoi de l'email de configuration" },
			{ status: 500 },
		);
	}
}
