import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiReviews } from '@/lib/db/schema';

export async function GET() {
  try { return NextResponse.json(await db.select().from(aiReviews).orderBy(desc(aiReviews.createdAt))); }
  catch (error) { console.error('GET /api/ai/reviews error:', error); return NextResponse.json({ error: 'Failed to load review queue' }, { status: 500 }); }
}
