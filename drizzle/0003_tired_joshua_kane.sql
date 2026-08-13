CREATE TABLE IF NOT EXISTS "content_ideas" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"angle" text,
	"source" varchar(100),
	"status" varchar(20) DEFAULT 'idea' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "review_status" varchar(30) DEFAULT 'needs_review' NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "source_prompt" text;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "platform_url" varchar(1000);--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "clicks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "performance_updated_at" timestamp;