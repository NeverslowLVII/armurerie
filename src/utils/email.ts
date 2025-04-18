import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendFeedbackNotification(feedback: {
  type: string;
  title: string;
  description: string;
  status: string;
  employee?: { name: string } | null;
}) {
  const submittedBy = feedback.employee ? `by ${feedback.employee.name}` : 'anonymously';

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `New Feedback: ${feedback.title}`,
    html: `
      <h2>New Feedback Submitted</h2>
      <p><strong>Title:</strong> ${feedback.title}</p>
      <p><strong>Type:</strong> ${feedback.type}</p>
      <p><strong>Status:</strong> ${feedback.status}</p>
      <p><strong>Submitted:</strong> ${submittedBy}</p>
      <p><strong>Description:</strong></p>
      <p>${feedback.description}</p>
    `,
  });
}
