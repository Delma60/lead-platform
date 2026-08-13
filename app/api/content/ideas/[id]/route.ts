import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentIdeas } from '@/lib/db/schema';
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  try { const id = Number((await context.params).id); const body = await request.json() as Record<string, unknown>; if (!Number.isSafeInteger(id) || !['idea', 'drafted', 'archived'].includes(String(body.status))) return NextResponse.json({ error: 'Valid idea and status required' }, { status: 400 }); const [updated] = await db.update(contentIdeas).set({ status: body.status as 'idea' | 'drafted' | 'archived', updatedAt: new Date() }).where(eq(contentIdeas.id, id)).returning(); return updated ? NextResponse.json(updated) : NextResponse.json({ error: 'Idea not found' }, { status: 404 }); }
  catch (error) { console.error('PATCH /api/content/ideas/[id] error:', error); return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 }); }
}

