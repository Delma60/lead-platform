import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templates } from '@/lib/db/schema';
import { parseTemplateInput } from '@/lib/templates';

type Context = { params: Promise<{ id: string }> };
async function getId(context: Context) { const id = Number((await context.params).id); return Number.isSafeInteger(id) && id > 0 ? id : null; }

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const id = await getId(context);
    if (!id) return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    const parsed = parseTemplateInput(await request.json(), true);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    if (parsed.data.relatedTemplateId === id) return NextResponse.json({ error: 'A template cannot link to itself' }, { status: 400 });
    const [updated] = await db.update(templates).set({ ...parsed.data, updatedAt: new Date() }).where(eq(templates.id, id)).returning();
    return updated ? NextResponse.json(updated) : NextResponse.json({ error: 'Template not found' }, { status: 404 });
  } catch (error) {
    console.error('PATCH /api/templates/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const id = await getId(context);
    if (!id) return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    await db.update(templates).set({ relatedTemplateId: null }).where(eq(templates.relatedTemplateId, id));
    const [deleted] = await db.delete(templates).where(eq(templates.id, id)).returning({ id: templates.id });
    return deleted ? new NextResponse(null, { status: 204 }) : NextResponse.json({ error: 'Template not found' }, { status: 404 });
  } catch (error) {
    console.error('DELETE /api/templates/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
