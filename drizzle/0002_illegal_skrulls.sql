CREATE TABLE IF NOT EXISTS "ai_reviews" (
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
ALTER TABLE "leads" ADD COLUMN "company_url" varchar(1000);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "research_summary" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "recommended_template_id" integer;