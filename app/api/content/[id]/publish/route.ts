import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { publishPost } from '@/lib/social-publishing';
type Context = { params: Promise<{ id: string }> };
export async function POST(_request: Request, context: Context) {
  try { const id = Number((await context.params).id); if (!Number.isSafeInteger(id)) return NextResponse.json({ error: 'Valid content ID required' }, { status: 400 }); const [post] = await db.select().from(content).where(eq(content.id, id)).limit(1); if (!post) return NextResponse.json({ error: 'Content not found' }, { status: 404 }); if (post.reviewStatus !== 'approved') return NextResponse.json({ error: 'Approve content before publishing' }, { status: 409 }); if (post.status === 'posted') return NextResponse.json({ error: 'Content was already posted' }, { status: 409 }); const published = await publishPost(post); const now = new Date(); const [updated] = await db.update(content).set({ ...published, status: 'posted', postedAt: now, scheduledAt: null, updatedAt: now }).where(eq(content.id, id)).returning(); return NextResponse.json(updated); }
  catch (error) { console.error('POST /api/content/[id]/publish error:', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Publishing failed' }, { status: 500 }); }
}

