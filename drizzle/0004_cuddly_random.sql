CREATE TABLE "github_issue_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"todo_id" text NOT NULL,
	"repository_full_name" varchar(255) NOT NULL,
	"github_issue_id" varchar(100) NOT NULL,
	"issue_number" integer NOT NULL,
	"issue_url" text NOT NULL,
	"issue_state" varchar(20) DEFAULT 'open' NOT NULL,
	"issue_title" text NOT NULL,
	"issue_body" text,
	"issue_author" varchar(255),
	"issue_assignee" varchar(255),
	"issue_labels" text,
	"sync_direction" varchar(30) DEFAULT 'bidirectional' NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL,
	"last_remote_updated_at" timestamp,
	"last_local_updated_at" timestamp,
	"sync_status" varchar(30) DEFAULT 'synced' NOT NULL,
	"last_sync_error" text,
	"sync_origin" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_sync_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"auto_sync_on_webhook" boolean DEFAULT true NOT NULL,
	"sync_status_changes" boolean DEFAULT true NOT NULL,
	"sync_title_changes" boolean DEFAULT true NOT NULL,
	"sync_description_changes" boolean DEFAULT true NOT NULL,
	"sync_labels" boolean DEFAULT true NOT NULL,
	"sync_assignees" boolean DEFAULT true NOT NULL,
	"conflict_strategy" varchar(30) DEFAULT 'newer_wins' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "github_issue_mappings" ADD CONSTRAINT "github_issue_mappings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_issue_mappings" ADD CONSTRAINT "github_issue_mappings_todo_id_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_sync_settings" ADD CONSTRAINT "github_sync_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "github_issue_mappings_user_id_idx" ON "github_issue_mappings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "github_issue_mappings_todo_id_idx" ON "github_issue_mappings" USING btree ("todo_id");--> statement-breakpoint
CREATE INDEX "github_issue_mappings_repo_issue_idx" ON "github_issue_mappings" USING btree ("repository_full_name","issue_number");--> statement-breakpoint
CREATE UNIQUE INDEX "github_issue_mappings_user_repo_issue_uq" ON "github_issue_mappings" USING btree ("user_id","repository_full_name","issue_number");--> statement-breakpoint
CREATE UNIQUE INDEX "github_issue_mappings_user_todo_uq" ON "github_issue_mappings" USING btree ("user_id","todo_id");--> statement-breakpoint
CREATE INDEX "github_sync_settings_user_id_idx" ON "github_sync_settings" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_sync_settings_user_id_uq" ON "github_sync_settings" USING btree ("user_id");