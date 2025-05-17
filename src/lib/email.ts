import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: Number(process.env.SMTP_PORT),
	secure: true,
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASS,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

const senderEmail = process.env.NOTIFICATION_EMAIL;
if (!senderEmail) {
	console.error("NOTIFICATION_EMAIL is not set in environment variables");
}

interface EmailOptions {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
	try {
		const info = await transporter.sendMail({
			from: process.env.SMTP_USER,
			to,
			subject,
			html,
		});
		return { success: true, data: info };
	} catch (error) {
		console.error("Error sending email with Nodemailer:", error);
		return { success: false, error };
	}
}

export function generateSetupEmailHtml(setupLink: string, name: string) {
	return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bienvenue sur Armurerie !</h2>
      <p>Bonjour ${name},</p>
      <p>Votre compte a été créé avec succès. Pour finaliser votre inscription, veuillez cliquer sur le lien ci-dessous pour définir votre mot de passe :</p>
      <p style="margin: 20px 0;">
        <a href="${setupLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Configurer mon compte
        </a>
      </p>
      <p>Ce lien est valable pendant 24 heures.</p>
      <p>Si vous n'avez pas demandé la création de ce compte, veuillez ignorer cet email.</p>
      <p>Cordialement,<br>L'équipe Armurerie</p>
    </div>
  `;
}

export function generateResetPasswordEmailHtml(resetLink: string) {
	return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
      <p style="margin: 20px 0;">
        <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p>Ce lien est valable pendant 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
      <p>Cordialement,<br>L'équipe Armurerie</p>
    </div>
  `;
}
