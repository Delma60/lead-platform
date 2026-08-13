import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { openAIJson } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const leadId = Number((await request.json() as { leadId?: unknown }).leadId);
    if (!Number.isSafeInteger(leadId)) return NextResponse.json({ error: 'Valid lead ID required' }, { status: 400 });
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    const result = await openAIJson<{ summary: string; painPoints: string[]; evidence: string[] }>(
      'Research a sales lead using current public web information. Be factual, concise, and do not invent details. Return evidence as short source URLs or source descriptions.',
      `Company: ${lead.company}\nWebsite: ${lead.companyUrl ?? 'unknown'}\nExisting notes: ${lead.notes ?? 'none'}`,
      { name: 'lead_research', schema: { type: 'object', additionalProperties: false, required: ['summary', 'painPoints', 'evidence'], properties: { summary: { type: 'string' }, painPoints: { type: 'array', items: { type: 'string' } }, evidence: { type: 'array', items: { type: 'string' } } } } },
      true,
    );
    const researchSummary = `${result.summary}\n\nLikely pain points:\n${result.painPoints.map((item) => `• ${item}`).join('\n')}\n\nEvidence:\n${result.evidence.map((item) => `• ${item}`).join('\n')}`;
    await db.update(leads).set({ researchSummary, updatedAt: new Date() }).where(eq(leads.id, leadId));
    return NextResponse.json({ researchSummary });
  } catch (error) {
    console.error('POST /api/ai/research error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Research failed' }, { status: 500 });
  }
}
