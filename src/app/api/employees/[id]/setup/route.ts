import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSetupLink } from '@/lib/tokens';
import { sendEmail, generateSetupEmailHtml } from '@/lib/email';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Endpoint pour envoyer un email de configuration à un employé existant
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification et les permissions
    const session = await getServerSession(authOptions);
    if (!session || !['PATRON', 'CO_PATRON', 'DEVELOPER'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer l'ID de l'employé
    const employeeId = parseInt(params.id);
    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'ID d\'employé invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'employé existe
    const employee = await prisma.user.findUnique({
      where: { id: employeeId }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employé non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si on veut juste générer le lien sans envoyer d'email
    const requestData = await _request.json().catch(() => ({}));
    const generateLinkOnly = requestData.generateLinkOnly === true;

    // Générer le lien de configuration
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const setupLink = generateSetupLink(employee.id, employee.email, baseUrl);

    // Si on veut juste le lien, on n'envoie pas d'email
    if (!generateLinkOnly) {
      // Envoyer l'email de configuration
      await sendEmail({
        to: employee.email,
        subject: 'Configuration de votre compte Armurerie',
        html: generateSetupEmailHtml(setupLink, employee.name)
      });

      return NextResponse.json({
        success: true,
        message: `Email de configuration envoyé à ${employee.email}`,
        setupLink // Pour les tests ou pour permettre à l'admin de copier le lien
      });
    } else {
      // Retourner juste le lien sans envoyer d'email
      return NextResponse.json({
        success: true,
        message: `Lien de configuration généré pour ${employee.name}`,
        setupLink
      });
    }
  } catch (error) {
    console.error('Error sending setup email:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de l\'email de configuration' },
      { status: 500 }
    );
  }
} 