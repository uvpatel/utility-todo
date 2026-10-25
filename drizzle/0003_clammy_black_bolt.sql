CREATE TABLE "github_installations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"installation_id" varchar(100) NOT NULL,
	"account_login" varchar(255) NOT NULL,
	"account_type" varchar(50) NOT NULL,
	"account_avatar_url" text,
	"target_type" varchar(50),
	"repository_selection" varchar(50) DEFAULT 'all' NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"permissions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_repositories" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"installation_id" varchar(100) NOT NULL,
	"github_repo_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"full_name" varchar(500) NOT NULL,
	"owner" varchar(255) NOT NULL,
	"private" boolean DEFAULT false NOT NULL,
	"html_url" text NOT NULL,
	"description" text,
	"default_branch" varchar(100) DEFAULT 'main',
	"open_issues_count" integer DEFAULT 0,
	"is_selected" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"action" varchar(100),
	"payload" text NOT NULL,
	"status" varchar(50) DEFAULT 'processed' NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "github_webhook_events_delivery_id_unique" UNIQUE("delivery_id")
);
--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "source_github_issue_url" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "source_github_pr_url" text;--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "source_github_repo" varchar(255);--> statement-breakpoint
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "github_installations_user_id_idx" ON "github_installations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "github_installations_installation_id_idx" ON "github_installations" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX "github_repositories_user_id_idx" ON "github_repositories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "github_repositories_github_repo_id_idx" ON "github_repositories" USING btree ("github_repo_id");--> statement-breakpoint
CREATE INDEX "github_repositories_installation_id_idx" ON "github_repositories" USING btree ("installation_id");--> statement-breakpoint
CREATE INDEX "github_webhook_delivery_id_idx" ON "github_webhook_events" USING btree ("delivery_id");