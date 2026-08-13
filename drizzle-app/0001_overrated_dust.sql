CREATE TABLE IF NOT EXISTS "lead_platform_app"."app_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"encrypted_value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
