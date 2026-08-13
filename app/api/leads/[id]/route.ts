import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { leadFlags, normalizeOptionalText, parseLeadInput } from '@/lib/leads';

type RouteContext = { params: Promise<{ id: string }> };

async function leadIdFrom(context: RouteContext) {
  const id = Number((await context.params).id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const id = await leadIdFrom(context);
    if (!id) return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    const parsed = parseLeadInput(await request.json(), true);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const update = parsed.data;
    const [existing] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
    if (!existing) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (update.status === 'Lost' && !update.rejectionReason && !existing.rejectionReason) return NextResponse.json({ error: 'A rejection reason is required when a lead is Lost' }, { status: 400 });
    if (update.referralSourceLead === id) return NextResponse.json({ error: 'A lead cannot refer itself' }, { status: 400 });
    if (update.referralSourceLead) {
      const [referrer] = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.id, update.referralSourceLead), eq(leads.status, 'Won'))).limit(1);
      if (!referrer) return NextResponse.json({ error: 'Referral source must be a Won lead' }, { status: 400 });
    }
    const now = new Date();
    const repliedAt = update.status === 'Replied' && !existing.repliedAt ? now : existing.repliedAt;
    const replyTimeInDays = repliedAt && existing.lastContactedAt
      ? Math.max(0, Math.ceil((repliedAt.getTime() - existing.lastContactedAt.getTime()) / 86_400_000))
      : existing.replyTimeInDays;
    const [updated] = await db.update(leads).set({
      ...(update.company !== undefined && { company: update.company }),
      ...(update.contactName !== undefined && { contactName: update.contactName }),
      ...(update.contactEmail !== undefined && { contactEmail: update.contactEmail }),
      ...(update.contactPhone !== undefined && { contactPhone: normalizeOptionalText(update.contactPhone) }),
      ...(update.status !== undefined && { status: update.status }),
      ...(update.source !== undefined && { source: update.source }),
      ...(update.priority !== undefined && { priority: update.priority }),
      ...(update.notes !== undefined && { notes: normalizeOptionalText(update.notes) }),
      ...(update.followUpDate !== undefined && { followUpDate: update.followUpDate }),
      ...(update.rejectionReason !== undefined && { rejectionReason: update.rejectionReason }),
      ...(update.referralSourceLead !== undefined && { referralSourceLead: update.referralSourceLead }),
      ...(update.status && update.status !== 'Lost' && { rejectionReason: null }),
      ...(update.status === 'Contacted' && !existing.lastContactedAt && { lastContactedAt: now }),
      ...(update.status === 'Replied' && { repliedAt, replyTimeInDays }),
      updatedAt: now,
    }).where(eq(leads.id, id)).returning();

    if (!updated) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    return NextResponse.json({ ...updated, ...leadFlags(updated) });
  } catch (error) {
    console.error('PATCH /api/leads/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const id = await leadIdFrom(context);
    if (!id) return NextResponse.json({ error: 'Invalid lead ID' }, { status: 400 });
    const [deleted] = await db.delete(leads).where(eq(leads.id, id)).returning({ id: leads.id });
    if (!deleted) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/leads/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
