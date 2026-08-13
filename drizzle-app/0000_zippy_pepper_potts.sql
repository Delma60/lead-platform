CREATE SCHEMA IF NOT EXISTS "lead_platform_app";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_platform_app"."ai_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"template_id" integer,
	"kind" varchar(30) NOT NULL,
	"subject" varchar(500),
	"output" text NOT NULL,
	"source_text" text,
	"suggested_status" varchar(20),
	"status" varchar(30) DEFAULT 'needs_review' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_platform_app"."content" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" varchar(50) NOT NULL,
	"draft_text" text NOT NULL,
	"status" varchar(20) DEFAULT 'draft',
	"review_status" varchar(30) DEFAULT 'needs_review' NOT NULL,
	"source_prompt" text,
	"scheduled_at" timestamp,
	"posted_at" timestamp,
	"related_repo" varchar(255),
	"related_case_study" varchar(255),
	"likes" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"reposts" integer DEFAULT 0,
	"platform_id" varchar(255),
	"platform_url" varchar(1000),
	"clicks" integer DEFAULT 0 NOT NULL,
	"performance_updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_platform_app"."content_ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"angle" text,
	"source" varchar(100),
	"status" varchar(20) DEFAULT 'idea' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_platform_app"."inbound_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"gmail_message_id" varchar(255) NOT NULL,
	"gmail_thread_id" varchar(255) NOT NULL,
	"lead_id" integer NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"subject" varchar(500),
	"body" text NOT NULL,
	"received_at" timestamp NOT NULL,
	"review_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inbound_messages_gmail_message_id_unique" UNIQUE("gmail_message_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_platform_app"."leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" varchar(255) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(20),
	"company_url" varchar(1000),
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
	"contract_signed" boolean DEFAULT false NOT NULL,
	"deposit_paid" boolean DEFAULT false NOT NULL,
	"last_contacted_at" timestamp,
	"replied_at" timestamp,
	"reply_time_in_days" integer,
	"referral_source_lead" integer,
	"research_summary" text,
	"recommended_template_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_platform_app"."send_log" (
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
CREATE TABLE IF NOT EXISTS "lead_platform_app"."templates" (
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
