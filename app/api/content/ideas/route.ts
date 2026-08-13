import { desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contentIdeas } from '@/lib/db/schema';

export async function GET() {
  try { return NextResponse.json(await db.select().from(contentIdeas).orderBy(desc(contentIdeas.createdAt))); }
  catch (error) { console.error('GET /api/content/ideas error:', error); return NextResponse.json({ error: 'Failed to load ideas' }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  try { const body = await request.json() as Record<string, unknown>; const title = typeof body.title === 'string' ? body.title.trim() : ''; if (!title || title.length > 255) return NextResponse.json({ error: 'Idea title is required and must be 255 characters or fewer' }, { status: 400 }); const [created] = await db.insert(contentIdeas).values({ title, angle: typeof body.angle === 'string' ? body.angle.trim().slice(0, 5000) || null : null, source: typeof body.source === 'string' ? body.source.trim().slice(0, 100) || null : null }).returning(); return NextResponse.json(created, { status: 201 }); }
  catch (error) { console.error('POST /api/content/ideas error:', error); return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 }); }
}

