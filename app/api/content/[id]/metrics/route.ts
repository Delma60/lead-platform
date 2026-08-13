import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { fetchPostMetrics } from '@/lib/social-publishing';
type Context = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, context: Context) {
  try { const id = Number((await context.params).id); if (!Number.isSafeInteger(id)) return NextResponse.json({ error: 'Valid content ID required' }, { status: 400 }); const [post] = await db.select().from(content).where(eq(content.id, id)).limit(1); if (!post) return NextResponse.json({ error: 'Content not found' }, { status: 404 }); const body = await request.json().catch(() => ({})) as Record<string, unknown>; let metrics; if (body.manual === true) { const values = ['likes', 'comments', 'reposts', 'clicks'].map((key) => Number(body[key] ?? 0)); if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) return NextResponse.json({ error: 'Metrics must be non-negative integers' }, { status: 400 }); metrics = { likes: values[0], comments: values[1], reposts: values[2], clicks: values[3] }; } else metrics = await fetchPostMetrics(post); const [updated] = await db.update(content).set({ ...metrics, performanceUpdatedAt: new Date(), updatedAt: new Date() }).where(eq(content.id, id)).returning(); return NextResponse.json(updated); }
  catch (error) { console.error('POST /api/content/[id]/metrics error:', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Metrics refresh failed' }, { status: 500 }); }
}

