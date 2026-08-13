import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/leads
 * Fetch all leads or filter by status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');

    let query = db.select().from(leads);

    if (status) {
      query = query.where(eq(leads.status, status as any));
    }

    const allLeads = await query;
    return NextResponse.json(allLeads);
  } catch (error) {
    console.error('GET /api/leads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Create a new lead
 * Body: { company, contactName, contactEmail, contactPhone?, source? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Implement duplicate detection here
    // Check if company/contact already exists

    const result = await db
      .insert(leads)
      .values({
        company: body.company,
        contactName: body.contactName,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        source: body.source || 'Other',
        status: 'New',
      })
      .returning();

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/leads error:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}
