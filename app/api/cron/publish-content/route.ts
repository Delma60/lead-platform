import { and, eq, lte } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { publishPost } from '@/lib/social-publishing';
import { rejectUnauthorizedCron } from '@/lib/cron';
export async function GET(request: NextRequest) {
  const unauthorized = rejectUnauthorizedCron(request);
  if (unauthorized) return unauthorized;
  const due = await db.select().from(content).where(and(eq(content.status, 'scheduled'), eq(content.reviewStatus, 'approved'), lte(content.scheduledAt, new Date())));
  const results = [];
  for (const post of due) {
    const [claimed] = await db.update(content).set({ status: 'publishing', updatedAt: new Date() }).where(and(eq(content.id, post.id), eq(content.status, 'scheduled'))).returning({ id: content.id });
    if (!claimed) continue;
    try { const published = await publishPost(post); const now = new Date(); await db.update(content).set({ ...published, status: 'posted', postedAt: now, scheduledAt: null, updatedAt: now }).where(eq(content.id, post.id)); results.push({ id: post.id, status: 'posted' }); }
    catch (error) { await db.update(content).set({ status: 'scheduled', updatedAt: new Date() }).where(and(eq(content.id, post.id), eq(content.status, 'publishing'))); console.error(`Scheduled content ${post.id} failed:`, error); results.push({ id: post.id, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' }); }
  }
  return NextResponse.json({ processed: results.length, results });
}
