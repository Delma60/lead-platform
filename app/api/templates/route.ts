import { asc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templates } from '@/lib/db/schema';
import { parseTemplateInput } from '@/lib/templates';

export async function GET() {
  try {
    return NextResponse.json(await db.select().from(templates).orderBy(asc(templates.variant), asc(templates.followUpSequencePosition), asc(templates.name)));
  } catch (error) {
    console.error('GET /api/templates error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = parseTemplateInput(await request.json(), false);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const [created] = await db.insert(templates).values({
      ...parsed.data,
      name: parsed.data.name!,
      subject: parsed.data.subject!,
      body: parsed.data.body!,
      variant: parsed.data.variant ?? 'general',
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /api/templates error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
