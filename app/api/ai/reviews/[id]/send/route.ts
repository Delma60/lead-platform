import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiReviews, leads, sendLog } from '@/lib/db/schema';
import { sendEmail, textToHtml } from '@/lib/mailer';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  let logData: { leadId: number; templateId: number | null; recipientEmail: string; subject: string; body: string } | null = null;
  let delivered = false;
  try {
    const id = Number((await context.params).id);
    const confirmation = await request.json() as Record<string, unknown>;
    if (!Number.isSafeInteger(id)) return NextResponse.json({ error: 'Valid review ID required' }, { status: 400 });
    if (confirmation.approved !== true) return NextResponse.json({ error: 'Explicit send confirmation is required' }, { status: 400 });

    const [review] = await db.select().from(aiReviews).where(eq(aiReviews.id, id)).limit(1);
    if (!review || review.kind !== 'outreach') return NextResponse.json({ error: 'Outreach review not found' }, { status: 404 });
    if (review.status !== 'approved') return NextResponse.json({ error: 'Approve this draft before sending' }, { status: 409 });
    if (!review.subject?.trim() || !review.output.trim()) return NextResponse.json({ error: 'Approved draft is incomplete' }, { status: 400 });

    const [lead] = await db.select().from(leads).where(eq(leads.id, review.leadId)).limit(1);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (lead.contactEmail.endsWith('@invalid.local')) return NextResponse.json({ error: 'Add a verified contact email before sending' }, { status: 400 });

    logData = { leadId: lead.id, templateId: review.templateId, recipientEmail: lead.contactEmail, subject: review.subject.trim(), body: review.output.trim() };
    const info = await sendEmail(lead.contactEmail, logData.subject, textToHtml(logData.body), logData.body);
    delivered = true;
    const now = new Date();
    await Promise.all([
      db.insert(sendLog).values({ ...logData, status: 'sent', sentAt: now }),
      db.update(leads).set({ status: 'Contacted', lastContactedAt: now, updatedAt: now }).where(eq(leads.id, lead.id)),
      db.update(aiReviews).set({ status: 'sent', updatedAt: now }).where(eq(aiReviews.id, review.id)),
    ]);
    return NextResponse.json({ messageId: info.messageId, sentAt: now.toISOString() });
  } catch (error) {
    console.error('POST /api/ai/reviews/[id]/send error:', error);
    if (logData && !delivered) {
      try { await db.insert(sendLog).values({ ...logData, status: 'failed', error: error instanceof Error ? error.message : 'Unknown send error' }); } catch (logError) { console.error('Failed to log approved draft send:', logError); }
    }
    return NextResponse.json({ error: delivered ? 'Email was delivered, but tracking could not be updated. Do not resend.' : error instanceof Error && error.message === 'Gmail SMTP is not configured' ? error.message : 'Failed to send approved draft' }, { status: 500 });
  }
}
