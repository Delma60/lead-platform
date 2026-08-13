import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { aiReviews, leads, templates } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { openAIJson } from '@/lib/openai';
import { recommendTemplate } from '@/lib/template-recommendation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { leadId?: unknown; templateId?: unknown };
    const leadId = Number(body.leadId);
    if (!Number.isSafeInteger(leadId)) return NextResponse.json({ error: 'Valid lead ID required' }, { status: 400 });
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    let templateId = Number(body.templateId);
    if (!Number.isSafeInteger(templateId)) templateId = (await recommendTemplate(leadId))?.template.id ?? 0;
    const [template] = await db.select().from(templates).where(eq(templates.id, templateId)).limit(1);
    if (!template) return NextResponse.json({ error: 'Create or choose an email template first' }, { status: 400 });
    const result = await openAIJson<{ subject: string; body: string }>(
      'Draft a concise, personalized B2B outreach email. Use only supplied facts. Preserve the template intent, avoid hype, and never claim research that is not present. The output is a draft for human review and must not imply it was sent.',
      `LEAD\nCompany: ${lead.company}\nContact: ${lead.contactName}\nNotes: ${lead.notes ?? 'none'}\nResearch: ${lead.researchSummary ?? 'none'}\n\nTEMPLATE\nSubject: ${template.subject}\nBody: ${template.body}`,
      { name: 'outreach_draft', schema: { type: 'object', additionalProperties: false, required: ['subject', 'body'], properties: { subject: { type: 'string' }, body: { type: 'string' } } } },
    );
    const [review] = await db.insert(aiReviews).values({ leadId, templateId, kind: 'outreach', subject: result.subject, output: result.body, status: 'needs_review' }).returning();
    await db.update(leads).set({ recommendedTemplateId: templateId, updatedAt: new Date() }).where(eq(leads.id, leadId));
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('POST /api/ai/draft error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Draft failed' }, { status: 500 });
  }
}
