# Lead Pipeline App â€” TODO

## Phase 1: Foundation
- [x] Scaffold Next.js (App Router) + TypeScript project
- [x] Install and configure shadcn/ui
- [x] Set up Neon (Postgres) database
- [x] Set up Drizzle ORM + schema (`lib/db/schema.ts`) â€” leads, templates, send_log, content tables
- [x] Run initial migration
- [x] Set up Gmail App Password for SMTP
- [x] Install Nodemailer, configure transport (`lib/mailer.ts`)

## Phase 2: Core CRUD
- [x] `/api/leads` â€” GET (list), POST (create)
- [x] `/api/leads/[id]` â€” PATCH (update status/notes), DELETE
- [x] Leads board page (`/app/leads`) â€” columns: New, Contacted, Replied, Won, Lost
- [x] Add/Edit lead modal (accessible dialog + form controls)
- [x] Status change (dropdown or drag-and-drop)
- [x] Follow-up date field + overdue highlighting
- [x] Lead scoring/priority field (1-5: fit + urgency)
- [x] Duplicate detection on add (warn if company/contact already exists)
- [x] Stale lead flag â€” "Contacted" + no reply after 7 days + no follow-up scheduled (separate from overdue)

## Phase 3: Email templates
- [x] `templates` table (name, subject, body, variant tag e.g. "SDK story"/"wallet story"/"lending story")
- [x] `/app/templates` â€” list, create, edit templates page (accessible table-style list + form)
- [x] Variable placeholders in templates (e.g. `{{company}}`, `{{contactName}}`, `{{pitchDetail}}`)
- [x] Template preview (rendered with sample or real lead data) before send
- [x] Follow-up sequence templates â€” initial â†’ day-4 nudge â†’ day-10 final, linked as a set
- [x] Personalization checklist before send (did you reference something specific about them?)
- [x] `/api/send-email` route â€” send via Nodemailer, log to `send_log` with which template was used

## Phase 4: Tracking & insights
- [x] Reply/response time tracking (days from Contacted â†’ Replied)
- [x] Source field + breakdown view (Upwork vs Wellfound vs cold vs referral)
- [x] Referral tracking â€” tag leads that came from a Won client
- [x] Weekly digest (leads added / contacted / replied this week)
- [x] Template performance view (reply rate per template/variant)
- [x] Rejection reason field when a lead goes to "Lost" (budget, agency, timing, no reply, other)
- [x] Funnel view â€” New â†’ Contacted â†’ Replied â†’ Won with conversion % at each stage
- [x] "This week" snapshot on dashboard load (leads added / emails sent / replies)

## Phase 5: Won-lead follow-through
- [x] Rate/scope notes per lead (what was quoted, project size)
- [x] Contract/deposit status flags once "Won" (contract signed, deposit paid)

## Phase 6: AI-assisted outreach (human-approved, not autonomous send)
- [x] AI research step: given a lead's company/URL, summarize what they do + likely pain points (uses web search)
  - [x] Backend research endpoint with OpenAI web search and persisted research summary
  - [x] AI workspace action and research-result UI
- [x] AI draft step: generate a personalized pitch from a chosen template + lead notes + research summary
  - [x] Backend draft endpoint using the selected/recommended template and lead context
  - [x] AI workspace draft action and editor UI
- [x] Draft lands in a "Needs review" queue â€” never sends without a manual approve click
  - [x] Review table plus list and approve/reject endpoints; AI drafts are never auto-sent
  - [x] Human review queue UI and separately confirmed approved-draft send workflow
- [x] AI reply-triage: summarize an inbound reply and suggest next status (Replied/Won/Lost) for you to confirm
  - [x] Manual reply-text triage endpoint and human-confirmed status update
  - [x] Manual reply ingestion; automated Gmail detection remains scoped to Phase 8
  - [x] Reply-triage review UI
- [x] AI suggests best-fit template per lead based on past reply-rate data (Phase 4 data feeds this)
  - [x] Backend recommendation scoring based on lead relevance and historical reply rates
  - [x] Recommendation UI in the AI workspace

## Phase 6.5: Lead Finder (automated sourcing, human-reviewed import)
- [x] RemoteOK API integration (`remoteok.com/api`, free, no auth) â€” required attribution: link back to listing + credit RemoteOK
  - [x] Backend RemoteOK feed integration with listing URL and attribution data
  - [x] Finder UI displaying the required listing link and RemoteOK credit
- [x] Keyword filter layer â€” match on fintech/payments/wallet/banking/lending terms in title+description (raw feed is noisy â€” most postings are irrelevant, filtering is essential not optional)
- [x] GitHub Search API â€” issues/repos tagged "help wanted" + fintech/payments keywords
  - [x] Backend search for matching public `help wanted` issues and relevant repositories
  - [x] Finder results UI, progressive pagination, and source/rate-limit feedback
- [x] Dedup against existing `leads` table before import using company and source-listing URL
- [x] Matches land in board as "New" with source tagged (e.g. "RemoteOK auto-match") â€” never auto-contacted
  - [x] Imported matches use `New` status and RemoteOK/GitHub source tags
  - [x] Explicit auto-match labeling and protection against sending to placeholder contact emails
- [x] Manual "Import as lead" action per match, not bulk auto-import
  - [x] Single-match import endpoint; no bulk or automatic import path exists
  - [x] Per-match import button and finder UI
- [x] Note: Upwork/Toptal/Wellfound have no accessible public API â€” stay manual (browse + paste link) for these

## Phase 7: Marketing / content tool
- [x] `content` table (platform, draft text, status: draft/scheduled/posted, scheduled_at, posted_at, related_repo/case_study)
- [x] `/app/content` â€” content calendar view (list or calendar grid) of drafts and scheduled posts
- [x] AI draft step: generate post drafts (LinkedIn/X) from your repo work, case studies, or a topic prompt
- [x] Manual review/edit step before anything goes out â€” same "needs review" pattern as email
- [x] Platform connections: LinkedIn API and X/Twitter API posting adapters using registered-app OAuth access tokens
- [x] Scheduling: queue a reviewed post for a future date/time (protected Vercel Cron publishes scheduled content)
- [x] Post performance tracking (automatic X public metrics plus manual fallback where platform access is restricted)
- [x] Content ideas backlog â€” running list of case-study angles, technical write-up topics, "build in public" updates from current project work

## Phase 8: Automation infrastructure (still human-gated)
- [x] Gmail API (OAuth2) integration â€” read replies, auto-update status
- [x] Cron job (Vercel Cron) â€” daily overdue follow-up check
- [x] Cron job â€” publish scheduled content posts at their scheduled time
- [x] Daily digest email to self (leads needing action, replies pending review, content due for review)

## Phase 9: Polish
- [x] Auth (signed, HTTP-only single-admin session with protected pages and APIs)
- [x] Basic analytics dashboard (`/app/dashboard`) â€” lead funnel, source breakdown, template performance, content performance
- [ ] Deploy (Vercel) + connect Neon production branch
- [x] Mobile-responsive board view

## Content to prep (not code)
- [ ] Deploy a small live demo (wallet or VTU flow) to link in pitches
- [ ] Gather real numbers/metrics from VendPro work for case studies
- [ ] Finalize Upwork/Toptal profile copy
- [ ] Write first 2-3 real email templates (SDK story / wallet story / lending story)
- [ ] Register LinkedIn/X developer apps ahead of Phase 7 (approval can take time)

## Notes
- Gmail SMTP daily limit ~500 emails â€” fine for curated outreach, not for bulk
- Keep sends and posts manual/reviewed â€” AI drafts and suggests, never auto-sends or auto-posts to unvetted lists or without approval
- Social platform APIs require registered developer apps and OAuth â€” this is the legitimate path to posting programmatically, not a way around platform limits
- Neon branching is useful here: spin up a preview DB branch per feature without touching prod data
