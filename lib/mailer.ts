import nodemailer from 'nodemailer';

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required');
}

/**
 * Nodemailer transport for sending emails via Gmail SMTP
 * Uses App Password (not regular Gmail password)
 * Limit: ~500 emails/day for standard Gmail accounts
 */
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Send an email using the configured transporter
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email body (HTML)
 * @param text - Email body (plain text fallback)
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      html,
      text: text || 'See HTML version',
    });
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

/**
 * Render a template with variable substitution
 * Supports: {{company}}, {{contactName}}, {{pitchDetail}}, etc.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let rendered = template;
  Object.entries(variables).forEach(([key, value]) => {
    rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return rendered;
}
