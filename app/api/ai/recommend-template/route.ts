import { NextRequest, NextResponse } from 'next/server';
import { recommendTemplate } from '@/lib/template-recommendation';

export async function GET(request: NextRequest) {
  try {
    const leadId = Number(request.nextUrl.searchParams.get('leadId'));
    if (!Number.isSafeInteger(leadId)) return NextResponse.json({ error: 'Valid lead ID required' }, { status: 400 });
    const recommendation = await recommendTemplate(leadId);
    return recommendation ? NextResponse.json(recommendation) : NextResponse.json({ error: 'Lead or templates not found' }, { status: 404 });
  } catch (error) {
    console.error('GET /api/ai/recommend-template error:', error);
    return NextResponse.json({ error: 'Recommendation failed' }, { status: 500 });
  }
}
