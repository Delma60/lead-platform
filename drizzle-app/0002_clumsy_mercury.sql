CREATE TABLE IF NOT EXISTS "lead_platform_app"."whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"recipient_phone" varchar(30) NOT NULL,
	"template_name" varchar(512) NOT NULL,
	"language_code" varchar(20) NOT NULL,
	"meta_message_id" varchar(255),
	"status" varchar(20) NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lead_platform_app"."leads" ADD COLUMN "whatsapp_opt_in_at" timestamp;