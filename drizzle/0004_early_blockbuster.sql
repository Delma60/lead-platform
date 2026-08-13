CREATE TABLE IF NOT EXISTS "inbound_messages" (
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
