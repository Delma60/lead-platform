import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { content, contentIdeas } from '@/lib/db/schema';
import { openAIJson } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const platform = String(body.platform);
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!['LinkedIn', 'X', 'Facebook'].includes(platform) || !prompt || prompt.length > 10_000) return NextResponse.json({ error: 'Platform and a prompt of 10,000 characters or fewer are required' }, { status: 400 });
    const result = await openAIJson<{ draft: string }>('Write a credible social post for a senior software consultancy. Use only supplied facts, favor specific lessons over hype, do not invent results, and do not include markdown formatting. For X stay concise; for LinkedIn use short readable paragraphs. Return a draft for human review, never claim it was published.', `Platform: ${platform}\nTopic/source material: ${prompt}`, { name: 'content_draft', schema: { type: 'object', additionalProperties: false, required: ['draft'], properties: { draft: { type: 'string' } } } });
    const [created] = await db.insert(content).values({ platform: platform as 'LinkedIn' | 'X' | 'Facebook', draftText: result.draft.trim().slice(0, 20_000), sourcePrompt: prompt, status: 'draft', reviewStatus: 'needs_review' }).returning();
    if (Number.isSafeInteger(Number(body.ideaId))) await db.update(contentIdeas).set({ status: 'drafted', updatedAt: new Date() }).where(eq(contentIdeas.id, Number(body.ideaId)));
    return NextResponse.json(created, { status: 201 });
  } catch (error) { console.error('POST /api/content/generate error:', error); return NextResponse.json({ error: error instanceof Error ? error.message : 'Content generation failed' }, { status: 500 }); }
}
