import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { parseContentInput } from '@/lib/content';

type Context = { params: Promise<{ id: string }> };
async function idFrom(context: Context) { const id = Number((await context.params).id); return Number.isSafeInteger(id) && id > 0 ? id : null; }

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const id = await idFrom(context); if (!id) return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 });
    const parsed = parseContentInput(await request.json(), true); if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const [existing] = await db.select().from(content).where(eq(content.id, id)).limit(1); if (!existing) return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    const scheduling = parsed.data.scheduledAt !== undefined;
    if (scheduling && parsed.data.scheduledAt && (parsed.data.reviewStatus ?? existing.reviewStatus) !== 'approved') return NextResponse.json({ error: 'Approve content before scheduling' }, { status: 409 });
    const [updated] = await db.update(content).set({ ...parsed.data, ...(scheduling && { status: parsed.data.scheduledAt ? 'scheduled' as const : 'draft' as const }), updatedAt: new Date() }).where(eq(content.id, id)).returning();
    return NextResponse.json(updated);
  } catch (error) { console.error('PATCH /api/content/[id] error:', error); return NextResponse.json({ error: 'Failed to update content' }, { status: 500 }); }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try { const id = await idFrom(context); if (!id) return NextResponse.json({ error: 'Invalid content ID' }, { status: 400 }); const [deleted] = await db.delete(content).where(eq(content.id, id)).returning({ id: content.id }); return deleted ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: 'Content not found' }, { status: 404 }); }
  catch (error) { console.error('DELETE /api/content/[id] error:', error); return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 }); }
}

