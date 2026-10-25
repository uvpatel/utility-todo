import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "@/lib/auth-schema";

export * from "@/lib/auth-schema";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    color: varchar("color", { length: 30 }).default("#0075de").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("projects_user_id_idx").on(table.userId)]
);

export const todos = pgTable(
  "todos",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    completed: boolean("completed").default(false).notNull(),
    priority: varchar("priority", { length: 20 }).default("medium").notNull(), // 'low' | 'medium' | 'high' | 'urgent'
    status: varchar("status", { length: 20 }).default("todo").notNull(), // 'todo' | 'in_progress' | 'completed' | 'archived'
    dueDate: timestamp("due_date"),
    myDay: boolean("my_day").default(false).notNull(),
    myDayDate: varchar("my_day_date", { length: 10 }), // YYYY-MM-DD
    recurring: varchar("recurring", { length: 20 }), // 'daily' | 'weekdays' | 'weekly' | 'monthly'
    sortOrder: integer("sort_order").default(0).notNull(),
    sourceEmailId: varchar("source_email_id", { length: 255 }),
    sourceEmailSubject: varchar("source_email_subject", { length: 500 }),
    sourceGithubIssueUrl: text("source_github_issue_url"),
    sourceGithubPrUrl: text("source_github_pr_url"),
    sourceGithubRepo: varchar("source_github_repo", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("todos_user_id_idx").on(table.userId),
    index("todos_project_id_idx").on(table.projectId),
    index("todos_due_date_idx").on(table.dueDate),
    index("todos_completed_idx").on(table.completed),
  ]
);

export const subtasks = pgTable(
  "subtasks",
  {
    id: text("id").primaryKey(),
    todoId: text("todo_id")
      .notNull()
      .references(() => todos.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    completed: boolean("completed").default(false).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("subtasks_todo_id_idx").on(table.todoId),
    index("subtasks_user_id_idx").on(table.userId),
  ]
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(user, {
    fields: [projects.userId],
    references: [user.id],
  }),
  todos: many(todos),
}));

export const todosRelations = relations(todos, ({ one, many }) => ({
  user: one(user, {
    fields: [todos.userId],
    references: [user.id],
  }),
  project: one(projects, {
    fields: [todos.projectId],
    references: [projects.id],
  }),
  subtasks: many(subtasks),
  githubMapping: one(githubIssueMappings, {
    fields: [todos.id],
    references: [githubIssueMappings.todoId],
  }),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  todo: one(todos, {
    fields: [subtasks.todoId],
    references: [todos.id],
  }),
  user: one(user, {
    fields: [subtasks.userId],
    references: [user.id],
  }),
}));

export const gmailConnections = pgTable(
  "gmail_connections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).default("gmail").notNull(),
    providerAccountEmail: varchar("provider_account_email", { length: 255 }).notNull(),
    accessToken: text("access_token").notNull(),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at"),
    scope: text("scope"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("gmail_connections_user_id_idx").on(table.userId),
  ]
);

export const gmailConnectionsRelations = relations(gmailConnections, ({ one }) => ({
  user: one(user, {
    fields: [gmailConnections.userId],
    references: [user.id],
  }),
}));

export const githubInstallations = pgTable(
  "github_installations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    installationId: varchar("installation_id", { length: 100 }).notNull(),
    accountLogin: varchar("account_login", { length: 255 }).notNull(),
    accountType: varchar("account_type", { length: 50 }).notNull(),
    accountAvatarUrl: text("account_avatar_url"),
    targetType: varchar("target_type", { length: 50 }),
    repositorySelection: varchar("repository_selection", { length: 50 }).default("all").notNull(),
    appId: varchar("app_id", { length: 100 }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at"),
    permissions: text("permissions"),
    lastWebhookAt: timestamp("last_webhook_at"),
    lastWebhookEvent: varchar("last_webhook_event", { length: 100 }),
    lastSyncError: text("last_sync_error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("github_installations_user_id_idx").on(table.userId),
    index("github_installations_installation_id_idx").on(table.installationId),
  ]
);

export const githubRepositories = pgTable(
  "github_repositories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    installationId: varchar("installation_id", { length: 100 }).notNull(),
    githubRepoId: varchar("github_repo_id", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 500 }).notNull(),
    owner: varchar("owner", { length: 255 }).notNull(),
    private: boolean("private").default(false).notNull(),
    htmlUrl: text("html_url").notNull(),
    description: text("description"),
    defaultBranch: varchar("default_branch", { length: 100 }).default("main"),
    openIssuesCount: integer("open_issues_count").default(0),
    openPrsCount: integer("open_prs_count").default(0),
    isSelected: boolean("is_selected").default(true).notNull(),
    lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("github_repositories_user_id_idx").on(table.userId),
    index("github_repositories_github_repo_id_idx").on(table.githubRepoId),
    index("github_repositories_installation_id_idx").on(table.installationId),
  ]
);

export const githubWebhookEvents = pgTable(
  "github_webhook_events",
  {
    id: text("id").primaryKey(),
    deliveryId: varchar("delivery_id", { length: 255 }).notNull().unique(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    action: varchar("action", { length: 100 }),
    payload: text("payload").notNull(),
    status: varchar("status", { length: 50 }).default("processed").notNull(),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("github_webhook_delivery_id_idx").on(table.deliveryId),
  ]
);

export const githubInstallationsRelations = relations(githubInstallations, ({ one, many }) => ({
  user: one(user, {
    fields: [githubInstallations.userId],
    references: [user.id],
  }),
  repositories: many(githubRepositories),
}));

export const githubRepositoriesRelations = relations(githubRepositories, ({ one }) => ({
  user: one(user, {
    fields: [githubRepositories.userId],
    references: [user.id],
  }),
}));

export const githubIssueMappings = pgTable(
  "github_issue_mappings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    todoId: text("todo_id")
      .notNull()
      .references(() => todos.id, { onDelete: "cascade" }),
    repositoryFullName: varchar("repository_full_name", { length: 255 }).notNull(),
    githubIssueId: varchar("github_issue_id", { length: 100 }).notNull(),
    issueNumber: integer("issue_number").notNull(),
    issueUrl: text("issue_url").notNull(),
    issueState: varchar("issue_state", { length: 20 }).default("open").notNull(), // 'open' | 'closed'
    issueTitle: text("issue_title").notNull(),
    issueBody: text("issue_body"),
    issueAuthor: varchar("issue_author", { length: 255 }),
    issueAssignee: varchar("issue_assignee", { length: 255 }),
    issueLabels: text("issue_labels"), // JSON string array of labels
    syncDirection: varchar("sync_direction", { length: 30 }).default("bidirectional").notNull(),
    lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
    lastRemoteUpdatedAt: timestamp("last_remote_updated_at"),
    lastLocalUpdatedAt: timestamp("last_local_updated_at"),
    syncStatus: varchar("sync_status", { length: 30 }).default("synced").notNull(), // 'synced' | 'pending' | 'conflict' | 'error'
    lastSyncError: text("last_sync_error"),
    syncOrigin: varchar("sync_origin", { length: 50 }), // 'webhook' | 'user' | 'reconcile'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("github_issue_mappings_user_id_idx").on(table.userId),
    index("github_issue_mappings_todo_id_idx").on(table.todoId),
    index("github_issue_mappings_repo_issue_idx").on(table.repositoryFullName, table.issueNumber),
    uniqueIndex("github_issue_mappings_user_repo_issue_uq").on(table.userId, table.repositoryFullName, table.issueNumber),
    uniqueIndex("github_issue_mappings_user_todo_uq").on(table.userId, table.todoId),
  ]
);

export const githubSyncSettings = pgTable(
  "github_sync_settings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    autoSyncOnWebhook: boolean("auto_sync_on_webhook").default(true).notNull(),
    syncStatusChanges: boolean("sync_status_changes").default(true).notNull(),
    syncTitleChanges: boolean("sync_title_changes").default(true).notNull(),
    syncDescriptionChanges: boolean("sync_description_changes").default(true).notNull(),
    syncLabels: boolean("sync_labels").default(true).notNull(),
    syncAssignees: boolean("sync_assignees").default(true).notNull(),
    conflictStrategy: varchar("conflict_strategy", { length: 30 }).default("newer_wins").notNull(), // 'newer_wins' | 'github_wins' | 'local_wins'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("github_sync_settings_user_id_idx").on(table.userId),
    uniqueIndex("github_sync_settings_user_id_uq").on(table.userId),
  ]
);

export const githubIssueMappingsRelations = relations(githubIssueMappings, ({ one }) => ({
  user: one(user, {
    fields: [githubIssueMappings.userId],
    references: [user.id],
  }),
  todo: one(todos, {
    fields: [githubIssueMappings.todoId],
    references: [todos.id],
  }),
}));

export const githubSyncSettingsRelations = relations(githubSyncSettings, ({ one }) => ({
  user: one(user, {
    fields: [githubSyncSettings.userId],
    references: [user.id],
  }),
}));
