import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { publishPost } from '@/lib/social-publishing';
type Context = { params: Promise<{ id: string }> };
export async function POST(_request: Request, context: Context) {
  const id = Number((await context.params).id);
  if (!Number.isSafeInteger(id)) return NextResponse.json({ error: 'Valid content ID required' }, { status: 400 });
  let previousStatus: 'draft' | 'scheduled' = 'draft';
  try {
    const [post] = await db.select().from(content).where(eq(content.id, id)).limit(1);
    if (!post) return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    if (post.reviewStatus !== 'approved') return NextResponse.json({ error: 'Approve content before publishing' }, { status: 409 });
    if (['posted', 'publishing'].includes(post.status ?? '')) return NextResponse.json({ error: 'Content was already posted or is being published' }, { status: 409 });
    previousStatus = post.status === 'scheduled' ? 'scheduled' : 'draft';
    const [claimed] = await db.update(content).set({ status: 'publishing', updatedAt: new Date() }).where(and(eq(content.id, id), eq(content.status, post.status ?? 'draft'))).returning({ id: content.id });
    if (!claimed) return NextResponse.json({ error: 'Content state changed; refresh before publishing' }, { status: 409 });
    const published = await publishPost(post);
    const now = new Date();
    const [updated] = await db.update(content).set({ ...published, status: 'posted', postedAt: now, scheduledAt: null, updatedAt: now }).where(eq(content.id, id)).returning();
    return NextResponse.json(updated);
  } catch (error) {
    await db.update(content).set({ status: previousStatus, updatedAt: new Date() }).where(and(eq(content.id, id), eq(content.status, 'publishing'))).catch((resetError) => console.error('Failed to reset content publish state:', resetError));
    console.error('POST /api/content/[id]/publish error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Publishing failed' }, { status: 500 });
  }
}
