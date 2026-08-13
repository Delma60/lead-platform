ALTER TABLE "leads" ADD COLUMN "contract_signed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "deposit_paid" boolean DEFAULT false NOT NULL;