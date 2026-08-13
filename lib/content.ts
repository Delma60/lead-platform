import { content } from '@/lib/db/schema';

export type ContentInput = Partial<typeof content.$inferInsert>;

export function parseContentInput(value: unknown, partial = false): { ok: true; data: ContentInput } | { ok: false; error: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'A JSON object is required' };
  const body = value as Record<string, unknown>;
  const data: ContentInput = {};
  if ('platform' in body) {
    if (!['LinkedIn', 'X', 'Blog'].includes(String(body.platform))) return { ok: false, error: 'Invalid platform' };
    data.platform = body.platform as ContentInput['platform'];
  }
  for (const [key, limit] of [['draftText', 20_000], ['sourcePrompt', 10_000], ['relatedRepo', 255], ['relatedCaseStudy', 255], ['platformUrl', 1000]] as const) {
    if (key in body) {
      if (typeof body[key] !== 'string' || body[key].length > limit) return { ok: false, error: `${key} must be text no longer than ${limit} characters` };
      data[key] = body[key].trim() || null as never;
    }
  }
  if ('reviewStatus' in body) {
    if (!['needs_review', 'approved', 'rejected'].includes(String(body.reviewStatus))) return { ok: false, error: 'Invalid review status' };
    data.reviewStatus = body.reviewStatus as ContentInput['reviewStatus'];
  }
  if ('scheduledAt' in body) {
    if (body.scheduledAt === null || body.scheduledAt === '') data.scheduledAt = null;
    else if (typeof body.scheduledAt === 'string' && !Number.isNaN(Date.parse(body.scheduledAt))) data.scheduledAt = new Date(body.scheduledAt);
    else return { ok: false, error: 'Invalid schedule date' };
  }
  if (!partial && (!data.platform || !data.draftText)) return { ok: false, error: 'Platform and draft text are required' };
  if (partial && !Object.keys(data).length) return { ok: false, error: 'No supported fields supplied' };
  return { ok: true, data };
}

