import { or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const company = typeof body.company === 'string' ? body.company.trim() : '';
    const url = typeof body.url === 'string' ? body.url.trim() : '';
    if (!['RemoteOK', 'GitHub', 'Facebook'].includes(String(body.source)) || !company || company.length > 255 || url.length > 1000 || !/^https:\/\//.test(url)) return NextResponse.json({ error: 'Valid finder match required' }, { status: 400 });
    const externalId = typeof body.externalId === 'string' ? body.externalId.trim() : '';
    const duplicate = await db.select({ id: leads.id }).from(leads).where(or(sql`lower(${leads.company}) = lower(${company})`, sql`position(${externalId || url} in coalesce(${leads.notes}, '')) > 0`)).limit(1);
    if (duplicate.length) return NextResponse.json({ error: 'This match is already in the pipeline', code: 'DUPLICATE_LEAD' }, { status: 409 });
    const source = body.source as 'RemoteOK' | 'GitHub' | 'Facebook';
    const suppliedEmail = typeof body.contactEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contactEmail.trim()) ? body.contactEmail.trim() : '';
    const contactEmail = suppliedEmail || `research+${source.toLowerCase()}-${Date.now()}@invalid.local`;
    const contactName = typeof body.contactName === 'string' && body.contactName.trim() ? body.contactName.trim().slice(0, 255) : 'Hiring team';
    const notes = `${String(body.attribution ?? source)}\n${url}\n\n${String(body.title ?? '')}\n${String(body.summary ?? '')}`.trim().slice(0, 10_000);
    const contactPhone = typeof body.contactPhone === 'string' ? body.contactPhone.trim().slice(0, 20) || null : null;
    const [created] = await db.insert(leads).values({ company, contactName, contactEmail, contactPhone, source, status: 'New', companyUrl: url, notes }).returning();
    return NextResponse.json({ ...created, needsContactEmail: !suppliedEmail }, { status: 201 });
  } catch (error) { console.error('POST /api/finder/import error:', error); return NextResponse.json({ error: 'Could not import match' }, { status: 500 }); }
}
