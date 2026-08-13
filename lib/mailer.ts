import nodemailer from 'nodemailer';

/**
 * Nodemailer transport for sending emails via Gmail SMTP
 * Uses App Password (not regular Gmail password)
 * Limit: ~500 emails/day for standard Gmail accounts
 */
function createTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error('Gmail SMTP is not configured');
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

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
    const info = await createTransporter().sendMail({
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
    const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    rendered = rendered.replace(new RegExp(`{{\\s*${safeKey}\\s*}}`, 'g'), value);
  });
  return rendered;
}

export function unresolvedVariables(value: string) {
  return [...value.matchAll(/{{\s*([a-zA-Z][\w]*)\s*}}/g)].map((match) => match[1]);
}

export function textToHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
    .replaceAll('\n', '<br>');
}
