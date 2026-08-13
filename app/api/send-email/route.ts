import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendLog, leads } from '@/lib/db/schema';
import { sendEmail, renderTemplate } from '@/lib/mailer';

/**
 * POST /api/send-email
 * Send an email from a template to a lead
 * Body: { leadId, templateId, variables? }
 * - Never auto-sends, only via manual approval
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, templateId, variables = {} } = body;

    // TODO: Fetch template from database
    // TODO: Render template with variables
    // TODO: Send email via nodemailer
    // TODO: Log send_log entry

    return NextResponse.json(
      { message: 'Email send route - to be implemented' },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/send-email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
