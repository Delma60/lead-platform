import { NextRequest, NextResponse } from 'next/server';
import { aiReviews } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { openAIJson } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { leadId?: unknown; replyText?: unknown };
    const leadId = Number(body.leadId);
    if (!Number.isSafeInteger(leadId) || typeof body.replyText !== 'string' || !body.replyText.trim()) return NextResponse.json({ error: 'Lead and reply text are required' }, { status: 400 });
    const result = await openAIJson<{ summary: string; suggestedStatus: 'Replied' | 'Won' | 'Lost' }>(
      'Summarize this inbound sales reply and suggest exactly one pipeline status. Use Won only for clear acceptance, Lost only for clear rejection, otherwise Replied. This is advisory and a human will confirm.',
      body.replyText,
      { name: 'reply_triage', schema: { type: 'object', additionalProperties: false, required: ['summary', 'suggestedStatus'], properties: { summary: { type: 'string' }, suggestedStatus: { type: 'string', enum: ['Replied', 'Won', 'Lost'] } } } },
    );
    const [review] = await db.insert(aiReviews).values({ leadId, kind: 'reply_triage', output: result.summary, sourceText: body.replyText, suggestedStatus: result.suggestedStatus, status: 'needs_review' }).returning();
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('POST /api/ai/triage error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Triage failed' }, { status: 500 });
  }
}
