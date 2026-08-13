import { and, eq, inArray, ne } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { rejectUnauthorizedCron } from '@/lib/cron';
import { db } from '@/lib/db';
import { aiReviews, inboundMessages, leads } from '@/lib/db/schema';
import { listRecentInboxMessages } from '@/lib/gmail';
import { openAIJson } from '@/lib/openai';

export async function GET(request: NextRequest) {
  const unauthorized = rejectUnauthorizedCron(request);
  if (unauthorized) return unauthorized;
  try {
    const leadRows = await db.select().from(leads).where(ne(leads.status, 'Lost'));
    const leadByEmail = new Map(leadRows.map((lead) => [lead.contactEmail.toLowerCase(), lead]));
    const messages = await listRecentInboxMessages(Math.floor(Date.now() / 1000) - 7 * 86_400);
    const existing = messages.length ? await db.select({ id: inboundMessages.gmailMessageId }).from(inboundMessages).where(inArray(inboundMessages.gmailMessageId, messages.map((message) => message.gmailMessageId))) : [];
    const seen = new Set(existing.map((message) => message.id));
    const results: Array<{ messageId: string; status: string; leadId?: number }> = [];
    for (const message of messages) {
      if (seen.has(message.gmailMessageId)) continue;
      const lead = leadByEmail.get(message.senderEmail);
      if (!lead || lead.status === 'New') { results.push({ messageId: message.gmailMessageId, status: 'unmatched' }); continue; }
      let triage = { summary: `Reply received from ${message.senderEmail}: ${message.body.slice(0, 500)}`, suggestedStatus: 'Replied' as const };
      try {
        triage = await openAIJson<typeof triage>('Summarize this inbound sales reply and suggest exactly one pipeline status. Use Won only for clear acceptance, Lost only for clear rejection, otherwise Replied. This is advisory and a human will confirm.', message.body, { name: 'reply_triage', schema: { type: 'object', additionalProperties: false, required: ['summary', 'suggestedStatus'], properties: { summary: { type: 'string' }, suggestedStatus: { type: 'string', enum: ['Replied', 'Won', 'Lost'] } } } });
      } catch (error) { console.error(`AI triage failed for Gmail message ${message.gmailMessageId}:`, error); }
      const [review] = await db.insert(aiReviews).values({ leadId: lead.id, kind: 'reply_triage', output: triage.summary, sourceText: message.body, suggestedStatus: triage.suggestedStatus, status: 'needs_review' }).returning({ id: aiReviews.id });
      await db.insert(inboundMessages).values({ ...message, leadId: lead.id, reviewId: review.id });
      const repliedAt = lead.repliedAt && lead.repliedAt < message.receivedAt ? lead.repliedAt : message.receivedAt;
      const replyTimeInDays = lead.lastContactedAt ? Math.max(0, Math.floor((repliedAt.getTime() - lead.lastContactedAt.getTime()) / 86_400_000)) : null;
      await db.update(leads).set({ status: 'Replied', repliedAt, replyTimeInDays, isOverdue: false, isStale: false, updatedAt: new Date() }).where(and(eq(leads.id, lead.id), ne(leads.status, 'Won')));
      results.push({ messageId: message.gmailMessageId, status: 'ingested', leadId: lead.id });
    }
    return NextResponse.json({ scanned: messages.length, results });
  } catch (error) {
    console.error('Gmail sync failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gmail sync failed' }, { status: 500 });
  }
}
