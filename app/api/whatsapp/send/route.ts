import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads, whatsappMessages } from '@/lib/db/schema';
import { getSettings } from '@/lib/settings';

const templatePattern = /^[a-z0-9_]{1,512}$/;
const languagePattern = /^[a-z]{2,3}(?:_[A-Z]{2})?$/;

export async function POST(request: NextRequest) {
  let log: { leadId: number; recipientPhone: string; templateName: string; languageCode: string } | null = null;
  try {
    const body = await request.json() as Record<string, unknown>;
    const leadId = Number(body.leadId); const templateName = String(body.templateName ?? '').trim(); const languageCode = String(body.languageCode ?? '').trim();
    if (!Number.isSafeInteger(leadId) || !templatePattern.test(templateName) || !languagePattern.test(languageCode)) return NextResponse.json({ error: 'Valid lead, approved template name, and language code are required' }, { status: 400 });
    if (body.approved !== true) return NextResponse.json({ error: 'Manual send confirmation is required' }, { status: 400 });
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (!lead.contactPhone || !lead.whatsappOptInAt) return NextResponse.json({ error: 'A phone number and recorded WhatsApp opt-in are required' }, { status: 409 });
    const phone = lead.contactPhone.replace(/[^\d]/g, '');
    if (phone.length < 8 || phone.length > 15) return NextResponse.json({ error: 'Use an international phone number with country code' }, { status: 400 });
    const settings = await getSettings(['metaGraphVersion', 'whatsappPhoneNumberId', 'whatsappAccessToken']);
    if (!settings.whatsappPhoneNumberId || !settings.whatsappAccessToken) return NextResponse.json({ error: 'WhatsApp Cloud API is not configured in Settings' }, { status: 503 });
    log = { leadId, recipientPhone: phone, templateName, languageCode };
    const response = await fetch(`https://graph.facebook.com/${settings.metaGraphVersion || 'v23.0'}/${settings.whatsappPhoneNumberId}/messages`, { method: 'POST', headers: { Authorization: `Bearer ${settings.whatsappAccessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: phone, type: 'template', template: { name: templateName, language: { code: languageCode } } }) });
    const result = await response.json() as { messages?: Array<{ id?: string }>; error?: { message?: string } };
    if (!response.ok || !result.messages?.[0]?.id) throw new Error(result.error?.message || `Meta returned ${response.status}`);
    await db.insert(whatsappMessages).values({ ...log, metaMessageId: result.messages[0].id, status: 'sent' });
    return NextResponse.json({ messageId: result.messages[0].id });
  } catch (error) {
    console.error('POST /api/whatsapp/send error:', error);
    if (log) await db.insert(whatsappMessages).values({ ...log, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' }).catch(() => undefined);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'WhatsApp send failed' }, { status: 500 });
  }
}
