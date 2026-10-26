ALTER TABLE "github_installations" ADD COLUMN IF NOT EXISTS "app_id" varchar(100);--> statement-breakpoint
ALTER TABLE "github_installations" ADD COLUMN IF NOT EXISTS "last_webhook_at" timestamp;--> statement-breakpoint
ALTER TABLE "github_installations" ADD COLUMN IF NOT EXISTS "last_webhook_event" varchar(100);--> statement-breakpoint
ALTER TABLE "github_installations" ADD COLUMN IF NOT EXISTS "last_sync_error" text;--> statement-breakpoint
ALTER TABLE "github_repositories" ADD COLUMN IF NOT EXISTS "open_prs_count" integer DEFAULT 0;
