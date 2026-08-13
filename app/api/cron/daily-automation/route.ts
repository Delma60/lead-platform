import { and, asc, eq, lte } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { rejectUnauthorizedCron } from '@/lib/cron';
import { db } from '@/lib/db';
import { aiReviews, content, leads } from '@/lib/db/schema';
import { leadFlags } from '@/lib/leads';
import { sendEmail, textToHtml } from '@/lib/mailer';

export async function GET(request: NextRequest) {
  const unauthorized = rejectUnauthorizedCron(request);
  if (unauthorized) return unauthorized;
  try {
    const now = new Date();
    const [leadRows, pendingReplies, contentDue] = await Promise.all([
      db.select().from(leads).orderBy(asc(leads.followUpDate)),
      db.select({ id: aiReviews.id }).from(aiReviews).where(and(eq(aiReviews.kind, 'reply_triage'), eq(aiReviews.status, 'needs_review'))),
      db.select({ id: content.id }).from(content).where(and(eq(content.reviewStatus, 'needs_review'), lte(content.scheduledAt, new Date(now.getTime() + 86_400_000)))),
    ]);
    let flagsUpdated = 0;
    const flagged = leadRows.map((lead) => ({ lead, flags: leadFlags(lead) }));
    for (const { lead, flags } of flagged) {
      if (lead.isOverdue !== flags.isOverdue || lead.isStale !== flags.isStale) {
        await db.update(leads).set({ ...flags, updatedAt: now }).where(eq(leads.id, lead.id));
        flagsUpdated += 1;
      }
    }
    const overdue = flagged.filter(({ flags }) => flags.isOverdue).map(({ lead }) => lead);
    const stale = flagged.filter(({ flags }) => flags.isStale).map(({ lead }) => lead);
    const body = [`Lead Platform digest — ${now.toLocaleDateString()}`, '', `${overdue.length} overdue follow-up(s)`, ...overdue.slice(0, 20).map((lead) => `- ${lead.company}: ${lead.followUpDate?.toLocaleDateString()}`), '', `${stale.length} stale contacted lead(s)`, ...stale.slice(0, 20).map((lead) => `- ${lead.company}`), '', `${pendingReplies.length} repl${pendingReplies.length === 1 ? 'y' : 'ies'} pending human review`, `${contentDue.length} content item(s) due for review`].join('\n');
    const recipient = process.env.DIGEST_EMAIL ?? process.env.GMAIL_USER;
    let digestSent = false;
    if (recipient) { await sendEmail(recipient, `Lead Platform daily digest — ${overdue.length + stale.length + pendingReplies.length} action(s)`, textToHtml(body), body); digestSent = true; }
    return NextResponse.json({ flagsUpdated, overdue: overdue.length, stale: stale.length, pendingReplies: pendingReplies.length, contentDue: contentDue.length, digestSent });
  } catch (error) {
    console.error('Daily automation failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Daily automation failed' }, { status: 500 });
  }
}
