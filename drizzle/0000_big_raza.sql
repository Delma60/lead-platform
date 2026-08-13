CREATE TABLE IF NOT EXISTS "content" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" varchar(50) NOT NULL,
	"draft_text" text NOT NULL,
	"status" varchar(20) DEFAULT 'draft',
	"scheduled_at" timestamp,
	"posted_at" timestamp,
	"related_repo" varchar(255),
	"related_case_study" varchar(255),
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"reposts" integer DEFAULT 0,
	"platform_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" varchar(255) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(20),
	"status" varchar(20) DEFAULT 'New' NOT NULL,
	"priority" integer,
	"source" varchar(50),
	"notes" text,
	"rejection_reason" varchar(255),
	"follow_up_date" timestamp,
	"is_overdue" boolean DEFAULT false,
	"is_stale" boolean DEFAULT false,
	"is_duplicate" boolean DEFAULT false,
	"rate_scope" text,
	"contract_status" varchar(50),
	"last_contacted_at" timestamp,
	"replied_at" timestamp,
	"reply_time_in_days" integer,
	"referral_source_lead" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "send_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"template_id" integer,
	"recipient_email" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"status" varchar(20) DEFAULT 'sent',
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"variant" varchar(50) DEFAULT 'general',
	"is_follow_up" boolean DEFAULT false,
	"follow_up_sequence_position" integer,
	"related_template_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
