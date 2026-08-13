import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads, sendLog, templates } from '@/lib/db/schema';
import { renderTemplate, sendEmail, textToHtml, unresolvedVariables } from '@/lib/mailer';

export async function POST(request: NextRequest) {
  let logData: { leadId: number; templateId: number; recipientEmail: string; subject: string; body: string } | null = null;
  let delivered = false;
  try {
    const body = await request.json() as Record<string, unknown>;
    const leadId = Number(body.leadId);
    const templateId = Number(body.templateId);
    if (!Number.isSafeInteger(leadId) || !Number.isSafeInteger(templateId)) return NextResponse.json({ error: 'Valid lead and template IDs are required' }, { status: 400 });
    if (body.approved !== true || body.personalized !== true) return NextResponse.json({ error: 'Review and personalization approval are required before sending' }, { status: 400 });
    const variables = body.variables && typeof body.variables === 'object' && !Array.isArray(body.variables)
      ? Object.fromEntries(Object.entries(body.variables).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) : {};
    const [[lead], [template]] = await Promise.all([
      db.select().from(leads).where(eq(leads.id, leadId)).limit(1),
      db.select().from(templates).where(eq(templates.id, templateId)).limit(1),
    ]);
    if (!lead || !template) return NextResponse.json({ error: 'Lead or template not found' }, { status: 404 });
    if (lead.contactEmail.endsWith('@invalid.local')) return NextResponse.json({ error: 'Add a verified contact email before sending' }, { status: 400 });
    const merged = { company: lead.company, contactName: lead.contactName, contactEmail: lead.contactEmail, ...variables };
    const subject = renderTemplate(template.subject, merged);
    const renderedBody = renderTemplate(template.body, merged);
    const unresolved = [...new Set([...unresolvedVariables(subject), ...unresolvedVariables(renderedBody)])];
    if (unresolved.length) return NextResponse.json({ error: `Fill in missing variables: ${unresolved.join(', ')}`, unresolved }, { status: 400 });
    logData = { leadId, templateId, recipientEmail: lead.contactEmail, subject, body: renderedBody };
    const info = await sendEmail(lead.contactEmail, subject, textToHtml(renderedBody), renderedBody);
    delivered = true;
    const now = new Date();
    await Promise.all([
      db.insert(sendLog).values({ ...logData, status: 'sent', sentAt: now }),
      db.update(leads).set({ status: 'Contacted', lastContactedAt: now, updatedAt: now }).where(eq(leads.id, leadId)),
    ]);
    return NextResponse.json({ messageId: info.messageId, sentAt: now.toISOString() });
  } catch (error) {
    console.error('POST /api/send-email error:', error);
    if (logData && !delivered) {
      try { await db.insert(sendLog).values({ ...logData, status: 'failed', error: error instanceof Error ? error.message : 'Unknown send error' }); } catch (logError) { console.error('Failed to log email error:', logError); }
    }
    const message = delivered
      ? 'Email was delivered, but tracking could not be updated. Do not resend.'
      : error instanceof Error && error.message === 'Gmail SMTP is not configured' ? error.message : 'Failed to send email';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
