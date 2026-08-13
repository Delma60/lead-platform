import { pgTable, text, serial, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const leadStatuses = ['New', 'Contacted', 'Replied', 'Won', 'Lost'] as const;
export const leadSources = ['Upwork', 'Wellfound', 'Cold', 'Referral', 'RemoteOK', 'GitHub', 'Other'] as const;
export const templateVariants = ['SDK story', 'wallet story', 'lending story', 'general'] as const;
export const rejectionReasons = ['Budget', 'Agency', 'Timing', 'No reply', 'Other'] as const;

/**
 * Leads table: Core lead pipeline data
 */
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  company: varchar('company', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  contactPhone: varchar('contact_phone', { length: 20 }),
  status: varchar('status', {
    enum: leadStatuses,
    length: 20,
  }).default('New').notNull(),
  priority: integer('priority'), // 1-5 scale: fit (1-3) + urgency (1-3)
  source: varchar('source', {
    enum: leadSources,
    length: 50,
  }),
  notes: text('notes'),
  rejectionReason: varchar('rejection_reason', { enum: rejectionReasons, length: 255 }), // when status = Lost
  followUpDate: timestamp('follow_up_date'),
  isOverdue: boolean('is_overdue').default(false),
  isStale: boolean('is_stale').default(false), // Contacted + no reply + no follow-up scheduled
  isDuplicate: boolean('is_duplicate').default(false),
  rateScope: text('rate_scope'), // what was quoted, project size
  contractStatus: varchar('contract_status', { length: 50 }), // contract signed, deposit paid, etc.
  contractSigned: boolean('contract_signed').default(false).notNull(),
  depositPaid: boolean('deposit_paid').default(false).notNull(),
  lastContactedAt: timestamp('last_contacted_at'),
  repliedAt: timestamp('replied_at'),
  replyTimeInDays: integer('reply_time_in_days'), // calculated: repliedAt - lastContactedAt
  referralSourceLead: integer('referral_source_lead'), // FK to leads.id if referral
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Templates table: Email templates with variants
 */
export const templates = pgTable('templates', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  variant: varchar('variant', {
    enum: templateVariants,
    length: 50,
  }).default('general'),
  isFollowUp: boolean('is_follow_up').default(false),
  followUpSequencePosition: integer('follow_up_sequence_position'), // 0=initial, 1=day-4, 2=day-10
  relatedTemplateId: integer('related_template_id'), // FK: links to next template in sequence
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * SendLog table: Track all sent emails with template reference
 */
export const sendLog = pgTable('send_log', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').notNull(), // FK to leads.id
  templateId: integer('template_id'), // FK to templates.id (nullable if custom email)
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body').notNull(),
  status: varchar('status', {
    enum: ['sent', 'failed', 'bounced', 'opened', 'clicked'],
    length: 20,
  }).default('sent'),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  error: text('error'), // if status = failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Content table: Social media & blog post tracking
 */
export const content = pgTable('content', {
  id: serial('id').primaryKey(),
  platform: varchar('platform', {
    enum: ['LinkedIn', 'X', 'Blog'],
    length: 50,
  }).notNull(),
  draftText: text('draft_text').notNull(),
  status: varchar('status', {
    enum: ['draft', 'scheduled', 'posted'],
    length: 20,
  }).default('draft'),
  scheduledAt: timestamp('scheduled_at'),
  postedAt: timestamp('posted_at'),
  relatedRepo: varchar('related_repo', { length: 255 }),
  relatedCaseStudy: varchar('related_case_study', { length: 255 }),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  reposts: integer('reposts').default(0),
  platformId: varchar('platform_id', { length: 255 }), // external ID from platform
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Export types for use in application
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type SendLogEntry = typeof sendLog.$inferSelect;
export type NewSendLogEntry = typeof sendLog.$inferInsert;
export type ContentPost = typeof content.$inferSelect;
export type NewContentPost = typeof content.$inferInsert;
