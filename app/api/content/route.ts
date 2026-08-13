import { asc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { content } from '@/lib/db/schema';
import { parseContentInput } from '@/lib/content';

export async function GET() {
  try { return NextResponse.json(await db.select().from(content).orderBy(asc(content.scheduledAt), asc(content.createdAt))); }
  catch (error) { console.error('GET /api/content error:', error); return NextResponse.json({ error: 'Failed to load content' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = parseContentInput(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const [created] = await db.insert(content).values({ ...parsed.data, platform: parsed.data.platform!, draftText: parsed.data.draftText!, status: 'draft', reviewStatus: 'needs_review' }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) { console.error('POST /api/content error:', error); return NextResponse.json({ error: 'Failed to create content' }, { status: 500 }); }
}

