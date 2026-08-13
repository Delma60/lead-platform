import { and, asc, eq, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads, leadSources, leadStatuses } from '@/lib/db/schema';
import { leadFlags, normalizeOptionalText, parseLeadInput } from '@/lib/leads';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status');
    if (status && !leadStatuses.includes(status as (typeof leadStatuses)[number])) {
      return NextResponse.json({ error: 'Invalid lead status' }, { status: 400 });
    }

    const rows = status
      ? await db.select().from(leads).where(eq(leads.status, status as (typeof leadStatuses)[number])).orderBy(asc(leads.createdAt))
      : await db.select().from(leads).orderBy(asc(leads.createdAt));

    return NextResponse.json(rows.map((lead) => ({ ...lead, ...leadFlags(lead) })));
  } catch (error) {
    console.error('GET /api/leads error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = parseLeadInput(await request.json(), false);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const company = parsed.data.company!;
    const contactEmail = parsed.data.contactEmail!;
    const contactName = parsed.data.contactName!;
    if (parsed.data.status === 'Lost' && !parsed.data.rejectionReason) return NextResponse.json({ error: 'A rejection reason is required when a lead is Lost' }, { status: 400 });
    if (parsed.data.referralSourceLead) {
      const [referrer] = await db.select({ id: leads.id }).from(leads).where(and(eq(leads.id, parsed.data.referralSourceLead), eq(leads.status, 'Won'))).limit(1);
      if (!referrer) return NextResponse.json({ error: 'Referral source must be a Won lead' }, { status: 400 });
    }
    const duplicates = await db.select().from(leads).where(
      or(
        sql`lower(${leads.contactEmail}) = lower(${contactEmail})`,
        and(
          sql`lower(${leads.company}) = lower(${company})`,
          sql`lower(${leads.contactName}) = lower(${contactName})`,
        ),
      ),
    ).limit(5);

    if (duplicates.length && !parsed.data.confirmDuplicate) {
      return NextResponse.json(
        { error: 'Possible duplicate lead', code: 'DUPLICATE_LEAD', duplicates },
        { status: 409 },
      );
    }

    const [created] = await db.insert(leads).values({
      company,
      contactName,
      contactEmail,
      contactPhone: normalizeOptionalText(parsed.data.contactPhone),
      whatsappOptInAt: parsed.data.whatsappOptInAt ?? null,
      companyUrl: normalizeOptionalText(parsed.data.companyUrl),
      source: parsed.data.source ?? leadSources.at(-1),
      status: parsed.data.status ?? 'New',
      priority: parsed.data.priority ?? null,
      notes: normalizeOptionalText(parsed.data.notes),
      followUpDate: parsed.data.followUpDate ?? null,
      rejectionReason: parsed.data.rejectionReason ?? null,
      referralSourceLead: parsed.data.referralSourceLead ?? null,
      rateScope: normalizeOptionalText(parsed.data.rateScope ?? undefined),
      contractSigned: parsed.data.contractSigned ?? false,
      depositPaid: parsed.data.depositPaid ?? false,
      isDuplicate: duplicates.length > 0,
    }).returning();

    return NextResponse.json({ ...created, ...leadFlags(created) }, { status: 201 });
  } catch (error) {
    console.error('POST /api/leads error:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
