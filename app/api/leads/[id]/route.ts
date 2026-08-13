import { eq } from 'drizzle-orm';
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
      ...(update.status === 'Contacted' && { lastContactedAt: new Date() }),
      ...(update.status === 'Replied' && { repliedAt: new Date() }),
      updatedAt: new Date(),
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
