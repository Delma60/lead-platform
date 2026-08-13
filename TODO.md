# Lead Pipeline App — TODO

## Phase 1: Foundation
- [x] Scaffold Next.js (App Router) + TypeScript project
- [x] Install and configure shadcn/ui
- [ ] Set up Neon (Postgres) database
- [x] Set up Drizzle ORM + schema (`lib/db/schema.ts`) — leads, templates, send_log, content tables
- [ ] Run initial migration
- [ ] Set up Gmail App Password for SMTP
- [x] Install Nodemailer, configure transport (`lib/mailer.ts`)

## Phase 2: Core CRUD
- [x] `/api/leads` — GET (list), POST (create)
- [x] `/api/leads/[id]` — PATCH (update status/notes), DELETE
- [x] Leads board page (`/app/leads`) — columns: New, Contacted, Replied, Won, Lost
- [x] Add/Edit lead modal (accessible dialog + form controls)
- [x] Status change (dropdown or drag-and-drop)
- [x] Follow-up date field + overdue highlighting
- [x] Lead scoring/priority field (1-5: fit + urgency)
- [x] Duplicate detection on add (warn if company/contact already exists)
- [x] Stale lead flag — "Contacted" + no reply after 7 days + no follow-up scheduled (separate from overdue)

## Phase 3: Email templates
- [x] `templates` table (name, subject, body, variant tag e.g. "SDK story"/"wallet story"/"lending story")
- [x] `/app/templates` — list, create, edit templates page (accessible table-style list + form)
- [x] Variable placeholders in templates (e.g. `{{company}}`, `{{contactName}}`, `{{pitchDetail}}`)
- [x] Template preview (rendered with sample or real lead data) before send
- [x] Follow-up sequence templates — initial → day-4 nudge → day-10 final, linked as a set
- [x] Personalization checklist before send (did you reference something specific about them?)
- [x] `/api/send-email` route — send via Nodemailer, log to `send_log` with which template was used

## Phase 4: Tracking & insights
- [ ] Reply/response time tracking (days from Contacted → Replied)
- [ ] Source field + breakdown view (Upwork vs Wellfound vs cold vs referral)
- [ ] Referral tracking — tag leads that came from a Won client
- [ ] Weekly digest (leads added / contacted / replied this week)
- [ ] Template performance view (reply rate per template/variant)
- [ ] Rejection reason field when a lead goes to "Lost" (budget, agency, timing, no reply, other)
- [ ] Funnel view — New → Contacted → Replied → Won with conversion % at each stage
- [ ] "This week" snapshot on dashboard load (leads added / emails sent / replies)

## Phase 5: Won-lead follow-through
- [ ] Rate/scope notes per lead (what was quoted, project size)
- [ ] Contract/deposit status flags once "Won" (contract signed, deposit paid)

## Phase 6: AI-assisted outreach (human-approved, not autonomous send)
- [ ] AI research step: given a lead's company/URL, summarize what they do + likely pain points (uses web search)
- [ ] AI draft step: generate a personalized pitch from a chosen template + lead notes + research summary
- [ ] Draft lands in a "Needs review" queue — never sends without a manual approve click
- [ ] AI reply-triage: when Gmail API detects a reply, summarize it and suggest next status (Replied/Won/Lost) for you to confirm
- [ ] AI suggests best-fit template per lead based on past reply-rate data (Phase 4 data feeds this)

## Phase 6.5: Lead Finder (automated sourcing, human-reviewed import)
- [ ] RemoteOK API integration (`remoteok.com/api`, free, no auth) — required attribution: link back to listing + credit RemoteOK
- [ ] Keyword filter layer — match on fintech/payments/wallet/banking/lending terms in title+description (raw feed is noisy — most postings are irrelevant, filtering is essential not optional)
- [ ] GitHub Search API — issues/repos tagged "help wanted" + fintech/payments keywords
- [ ] Dedup against existing `leads` table before import (reuse Phase 2 dedup logic)
- [ ] Matches land in board as "New" with source tagged (e.g. "RemoteOK auto-match") — never auto-contacted
- [ ] Manual "Import as lead" action per match, not bulk auto-import
- [ ] Note: Upwork/Toptal/Wellfound have no accessible public API — stay manual (browse + paste link) for these

## Phase 7: Marketing / content tool
- [ ] `content` table (platform, draft text, status: draft/scheduled/posted, scheduled_at, posted_at, related_repo/case_study)
- [ ] `/app/content` — content calendar view (list or calendar grid) of drafts and scheduled posts
- [ ] AI draft step: generate post drafts (LinkedIn/X) from your repo work, case studies, or a topic prompt
- [ ] Manual review/edit step before anything goes out — same "needs review" pattern as email
- [ ] Platform connections: LinkedIn API and X/Twitter API for posting (each requires its own developer app + OAuth — proper registered access, not a workaround)
- [ ] Scheduling: queue a reviewed post for a future date/time (cron job publishes at the scheduled time)
- [ ] Post performance tracking (likes/comments/reposts where the platform API provides it) to see what content actually lands
- [ ] Content ideas backlog — running list of case-study angles, technical write-up topics, "build in public" updates from current project work

## Phase 8: Automation infrastructure (still human-gated)
- [ ] Gmail API (OAuth2) integration — read replies, auto-update status
- [ ] Cron job (Vercel Cron) — daily overdue follow-up check
- [ ] Cron job — publish scheduled content posts at their scheduled time
- [ ] Daily/weekly digest email to self (leads needing action, replies pending review, content due for review)

## Phase 9: Polish
- [ ] Auth (so it's not wide open if deployed) — NextAuth or simple password gate
- [ ] Basic analytics dashboard (`/app/dashboard`) — lead funnel, source breakdown, template performance, content performance
- [ ] Deploy (Vercel) + connect Neon production branch
- [ ] Mobile-responsive board view

## Content to prep (not code)
- [ ] Deploy a small live demo (wallet or VTU flow) to link in pitches
- [ ] Gather real numbers/metrics from VendPro work for case studies
- [ ] Finalize Upwork/Toptal profile copy
- [ ] Write first 2-3 real email templates (SDK story / wallet story / lending story)
- [ ] Register LinkedIn/X developer apps ahead of Phase 7 (approval can take time)

## Notes
- Gmail SMTP daily limit ~500 emails — fine for curated outreach, not for bulk
- Keep sends and posts manual/reviewed — AI drafts and suggests, never auto-sends or auto-posts to unvetted lists or without approval
- Social platform APIs require registered developer apps and OAuth — this is the legitimate path to posting programmatically, not a way around platform limits
- Neon branching is useful here: spin up a preview DB branch per feature without touching prod data
