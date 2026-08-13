import { leadSources, leadStatuses, rejectionReasons, type Lead } from '@/lib/db/schema';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

export type LeadInput = {
  company?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappOptInAt?: Date | null;
  companyUrl?: string;
  status?: (typeof leadStatuses)[number];
  source?: (typeof leadSources)[number];
  priority?: number | null;
  notes?: string;
  followUpDate?: Date | null;
  rejectionReason?: (typeof rejectionReasons)[number] | null;
  referralSourceLead?: number | null;
  rateScope?: string | null;
  contractSigned?: boolean;
  depositPaid?: boolean;
  confirmDuplicate?: boolean;
};

export function normalizeOptionalText(value: string | undefined) {
  return value?.trim() || null;
}

export function parseLeadInput(value: unknown, partial: boolean): { ok: true; data: LeadInput } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'A JSON object is required' };
  const body = value as Record<string, unknown>;
  const data: LeadInput = {};

  for (const key of ['company', 'contactName', 'contactEmail', 'contactPhone', 'companyUrl', 'notes', 'rateScope'] as const) {
    if (hasOwn(body, key)) {
      if (typeof body[key] !== 'string') return { ok: false, error: `${key} must be text` };
      data[key] = body[key].trim();
    }
  }
  for (const key of ['company', 'contactName', 'contactEmail'] as const) {
    if ((!partial || hasOwn(body, key)) && !data[key]) return { ok: false, error: `${key} is required` };
  }
  if (data.contactEmail && !emailPattern.test(data.contactEmail)) return { ok: false, error: 'Enter a valid email address' };
  if (hasOwn(body, 'status')) {
    if (typeof body.status !== 'string' || !leadStatuses.includes(body.status as never)) return { ok: false, error: 'Invalid lead status' };
    data.status = body.status as LeadInput['status'];
  }
  if (hasOwn(body, 'source')) {
    if (typeof body.source !== 'string' || !leadSources.includes(body.source as never)) return { ok: false, error: 'Invalid lead source' };
    data.source = body.source as LeadInput['source'];
  }
  if (hasOwn(body, 'priority')) {
    if (body.priority !== null && (!Number.isInteger(body.priority) || Number(body.priority) < 1 || Number(body.priority) > 5)) return { ok: false, error: 'Priority must be between 1 and 5' };
    data.priority = body.priority as number | null;
  }
  if (hasOwn(body, 'followUpDate')) {
    if (body.followUpDate === null || body.followUpDate === '') data.followUpDate = null;
    else if (typeof body.followUpDate === 'string' && !Number.isNaN(Date.parse(body.followUpDate))) data.followUpDate = new Date(body.followUpDate);
    else return { ok: false, error: 'Invalid follow-up date' };
  }
  if (hasOwn(body, 'whatsappOptInAt')) {
    if (body.whatsappOptInAt === null || body.whatsappOptInAt === '') data.whatsappOptInAt = null;
    else if (typeof body.whatsappOptInAt === 'string' && !Number.isNaN(Date.parse(body.whatsappOptInAt))) data.whatsappOptInAt = new Date(body.whatsappOptInAt);
    else return { ok: false, error: 'Invalid WhatsApp opt-in date' };
  }
  if (hasOwn(body, 'rejectionReason')) {
    if (body.rejectionReason === null || body.rejectionReason === '') data.rejectionReason = null;
    else if (typeof body.rejectionReason === 'string' && rejectionReasons.includes(body.rejectionReason as never)) data.rejectionReason = body.rejectionReason as LeadInput['rejectionReason'];
    else return { ok: false, error: 'Invalid rejection reason' };
  }
  if (hasOwn(body, 'referralSourceLead')) {
    if (body.referralSourceLead === null || body.referralSourceLead === '') data.referralSourceLead = null;
    else if (Number.isSafeInteger(Number(body.referralSourceLead)) && Number(body.referralSourceLead) > 0) data.referralSourceLead = Number(body.referralSourceLead);
    else return { ok: false, error: 'Invalid referral source lead' };
  }
  for (const key of ['contractSigned', 'depositPaid'] as const) {
    if (hasOwn(body, key)) {
      if (typeof body[key] !== 'boolean') return { ok: false, error: `${key} must be a boolean` };
      data[key] = body[key];
    }
  }
  data.confirmDuplicate = body.confirmDuplicate === true;
  if (partial && !Object.keys(data).some((key) => key !== 'confirmDuplicate')) return { ok: false, error: 'No supported fields supplied' };
  return { ok: true, data };
}

export function leadFlags(lead: Pick<Lead, 'status' | 'followUpDate' | 'lastContactedAt'>, at = new Date()) {
  const now = at.getTime();
  const overdue = !!lead.followUpDate && lead.followUpDate.getTime() < now && !['Won', 'Lost'].includes(lead.status);
  const staleCutoff = now - 7 * 24 * 60 * 60 * 1000;
  const stale = lead.status === 'Contacted' && !lead.followUpDate && !!lead.lastContactedAt && lead.lastContactedAt.getTime() < staleCutoff;
  return { isOverdue: overdue, isStale: stale };
}
