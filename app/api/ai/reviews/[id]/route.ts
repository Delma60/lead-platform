import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiReviews, leads, rejectionReasons } from '@/lib/db/schema';

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  try {
    const id = Number((await context.params).id);
    const body = await request.json() as Record<string, unknown>;
    if (!Number.isSafeInteger(id) || !['approved', 'rejected'].includes(String(body.status))) return NextResponse.json({ error: 'Valid review ID and decision required' }, { status: 400 });
    const [review] = await db.select().from(aiReviews).where(eq(aiReviews.id, id)).limit(1);
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    if (review.status !== 'needs_review') return NextResponse.json({ error: 'Review has already been decided', code: 'REVIEW_ALREADY_DECIDED' }, { status: 409 });
    const status = body.status as 'approved' | 'rejected';
    if (typeof body.subject === 'string' && body.subject.trim().length > 500) return NextResponse.json({ error: 'Subject must be 500 characters or fewer' }, { status: 400 });
    if (typeof body.output === 'string' && !body.output.trim()) return NextResponse.json({ error: 'Review output cannot be empty' }, { status: 400 });
    if (status === 'approved' && review.kind === 'reply_triage' && review.suggestedStatus) {
      const rejectionReason = body.rejectionReason;
      if (review.suggestedStatus === 'Lost' && (typeof rejectionReason !== 'string' || !rejectionReasons.includes(rejectionReason as never))) return NextResponse.json({ error: 'Choose a rejection reason before confirming Lost' }, { status: 400 });
      const now = new Date();
      const [lead] = await db.select().from(leads).where(eq(leads.id, review.leadId)).limit(1);
      if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      const repliedAt = lead.repliedAt ?? now;
      const replyTimeInDays = lead.lastContactedAt ? Math.max(0, Math.ceil((repliedAt.getTime() - lead.lastContactedAt.getTime()) / 86_400_000)) : null;
      await db.update(leads).set({ status: review.suggestedStatus, repliedAt, replyTimeInDays, ...(review.suggestedStatus === 'Lost' && { rejectionReason: rejectionReason as (typeof rejectionReasons)[number] }), updatedAt: now }).where(eq(leads.id, review.leadId));
    }
    const [updated] = await db.update(aiReviews).set({ status, ...(typeof body.subject === 'string' && { subject: body.subject.trim() }), ...(typeof body.output === 'string' && body.output.trim() && { output: body.output.trim() }), updatedAt: new Date() }).where(eq(aiReviews.id, id)).returning();
    return NextResponse.json(updated);
  } catch (error) { console.error('PATCH /api/ai/reviews/[id] error:', error); return NextResponse.json({ error: 'Failed to update review' }, { status: 500 }); }
}
