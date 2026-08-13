/**
 * Application Constants
 */

export const LEAD_STATUSES = ['New', 'Contacted', 'Replied', 'Won', 'Lost'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

export const LEAD_SOURCES = ['Upwork', 'Wellfound', 'Cold', 'Referral', 'RemoteOK', 'GitHub', 'Other'] as const;
export type LeadSource = typeof LEAD_SOURCES[number];

export const PRIORITY_LEVELS = [1, 2, 3, 4, 5] as const;
export type PriorityLevel = typeof PRIORITY_LEVELS[number];

export const TEMPLATE_VARIANTS = ['SDK story', 'wallet story', 'lending story', 'general'] as const;
export type TemplateVariant = typeof TEMPLATE_VARIANTS[number];

export const CONTENT_PLATFORMS = ['LinkedIn', 'X', 'Blog'] as const;
export type ContentPlatform = typeof CONTENT_PLATFORMS[number];

export const CONTENT_STATUSES = ['draft', 'scheduled', 'posted'] as const;
export type ContentStatus = typeof CONTENT_STATUSES[number];

export const REJECTION_REASONS = ['budget', 'agency', 'timing', 'no reply', 'other'] as const;
export type RejectionReason = typeof REJECTION_REASONS[number];

// UI/UX Constants
export const ITEMS_PER_PAGE = 20;
export const GMAIL_DAILY_LIMIT = 500;
export const STALE_LEAD_DAYS = 14; // Contacted + no reply after X days + no follow-up scheduled

// Colors for status badges
export const STATUS_COLORS: Record<LeadStatus, string> = {
  New: 'bg-gray-100 text-gray-800',
  Contacted: 'bg-blue-100 text-blue-800',
  Replied: 'bg-green-100 text-green-800',
  Won: 'bg-emerald-100 text-emerald-800',
  Lost: 'bg-red-100 text-red-800',
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  1: 'Low',
  2: 'Medium-Low',
  3: 'Medium',
  4: 'Medium-High',
  5: 'High',
};
