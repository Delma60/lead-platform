import { templateVariants } from '@/lib/db/schema';

export type TemplateInput = {
  name?: string;
  subject?: string;
  body?: string;
  variant?: (typeof templateVariants)[number];
  isFollowUp?: boolean;
  followUpSequencePosition?: number | null;
  relatedTemplateId?: number | null;
  notes?: string | null;
};

const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

export function parseTemplateInput(value: unknown, partial: boolean): { ok: true; data: TemplateInput } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'A JSON object is required' };
  const body = value as Record<string, unknown>;
  const data: TemplateInput = {};
  for (const key of ['name', 'subject', 'body'] as const) {
    if (own(body, key)) {
      if (typeof body[key] !== 'string') return { ok: false, error: `${key} must be text` };
      data[key] = body[key].trim();
    }
    if ((!partial || own(body, key)) && !data[key]) return { ok: false, error: `${key} is required` };
  }
  if (own(body, 'variant')) {
    if (typeof body.variant !== 'string' || !templateVariants.includes(body.variant as never)) return { ok: false, error: 'Invalid template variant' };
    data.variant = body.variant as TemplateInput['variant'];
  }
  if (own(body, 'isFollowUp')) {
    if (typeof body.isFollowUp !== 'boolean') return { ok: false, error: 'isFollowUp must be a boolean' };
    data.isFollowUp = body.isFollowUp;
  }
  for (const key of ['followUpSequencePosition', 'relatedTemplateId'] as const) {
    if (own(body, key)) {
      if (body[key] !== null && (!Number.isInteger(body[key]) || Number(body[key]) < 0)) return { ok: false, error: `${key} must be a positive integer or null` };
      data[key] = body[key] as number | null;
    }
  }
  if (data.followUpSequencePosition !== undefined && data.followUpSequencePosition !== null && data.followUpSequencePosition > 2) return { ok: false, error: 'Sequence position must be 0, 1, or 2' };
  if (own(body, 'notes')) {
    if (typeof body.notes !== 'string' && body.notes !== null) return { ok: false, error: 'notes must be text or null' };
    data.notes = typeof body.notes === 'string' ? body.notes.trim() || null : null;
  }
  if (partial && !Object.keys(data).length) return { ok: false, error: 'No supported fields supplied' };
  return { ok: true, data };
}
