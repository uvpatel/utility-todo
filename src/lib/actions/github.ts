"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth-guard";
import {
  githubInstallations,
  githubIssueMappings,
  githubRepositories,
  githubSyncSettings,
  githubWebhookEvents,
  subtasks,
  todos,
} from "@/schema/schema";
import {
  fetchCommitChecks,
  fetchInstallationRepositories,
  fetchRepositoryActivity,
  fetchRepositoryIssues,
  fetchRepositoryPullRequests,
  fetchUserRepositories,
  getGitHubAppConfigStatus,
  type GitHubActivityEventDTO,
  type GitHubAppConfigStatus,
  type GitHubCheckRunDTO,
  type GitHubIssueDTO,
  type GitHubPullRequestDTO,
  type GitHubRepoDTO,
} from "@/lib/integrations/github";
import {
  createGitHubIssueFromTask,
  getUserGitHubToken,
  getUserSyncSettings,
  linkTaskToGitHubIssue,
  reconcileAllUserMappings,
  syncTaskToIssue,
  unlinkTaskFromGitHubIssue,
  updateUserSyncSettings,
} from "@/lib/integrations/github-sync";
import type { Priority } from "@/lib/validations/todo";

export interface GitHubConnectionStatus {
  isConnected: boolean;
  accountLogin?: string;
  accountType?: string;
  accountAvatarUrl?: string | null;
  installationId?: string;
  repositorySelection?: string;
  connectedAt?: Date;
  lastSyncedAt?: Date;
  totalReposCount?: number;
  selectedReposCount?: number;
  lastWebhookAt?: Date | null;
  lastWebhookEvent?: string | null;
  lastSyncError?: string | null;
  isAppConfigured: boolean;
  appConfig: GitHubAppConfigStatus;
}

/**
 * Get the current user's GitHub connection status and repository counts
 */
export async function getGitHubConnection(): Promise<GitHubConnectionStatus> {
  const session = await requireAuth();
  const userId = session.user.id;

  const appConfig = getGitHubAppConfigStatus();

  const [installation] = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.userId, userId))
    .limit(1);

  if (!installation) {
    return {
      isConnected: false,
      isAppConfigured: appConfig.isAppConfigured,
      appConfig,
    };
  }

  const userRepos = await db
    .select()
    .from(githubRepositories)
    .where(eq(githubRepositories.userId, userId));

  const totalReposCount = userRepos.length;
  const selectedReposCount = userRepos.filter((r) => r.isSelected).length;

  // Retrieve latest webhook delivery timestamp if recorded
  const [latestWebhook] = await db
    .select()
    .from(githubWebhookEvents)
    .orderBy(desc(githubWebhookEvents.createdAt))
    .limit(1);

  return {
    isConnected: true,
    accountLogin: installation.accountLogin,
    accountType: installation.accountType,
    accountAvatarUrl: installation.accountAvatarUrl,
    installationId: installation.installationId,
    repositorySelection: installation.repositorySelection,
    connectedAt: installation.createdAt,
    lastSyncedAt: installation.updatedAt,
    totalReposCount,
    selectedReposCount,
    lastWebhookAt: installation.lastWebhookAt || (latestWebhook?.createdAt ?? null),
    lastWebhookEvent: installation.lastWebhookEvent || (latestWebhook?.eventType ?? null),
    lastSyncError: installation.lastSyncError,
    isAppConfigured: appConfig.isAppConfigured,
    appConfig,
  };
}

/**
 * Get all repositories discovered for the authenticated user
 */
export async function getGitHubRepositories(): Promise<typeof githubRepositories.$inferSelect[]> {
  const session = await requireAuth();
  const userId = session.user.id;

  return await db
    .select()
    .from(githubRepositories)
    .where(eq(githubRepositories.userId, userId))
    .orderBy(desc(githubRepositories.lastSyncedAt));
}

/**
 * Toggle whether a repository is actively selected / synchronized
 */
export async function toggleRepositorySelection(
  repoId: string,
  isSelected: boolean
): Promise<{ success: boolean }> {
  const session = await requireAuth();
  const userId = session.user.id;

  await db
    .update(githubRepositories)
    .set({
      isSelected,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(githubRepositories.id, repoId),
        eq(githubRepositories.userId, userId)
      )
    );

  revalidatePath("/settings/integrations");
  revalidatePath("/github");
  return { success: true };
}

/**
 * Synchronize repositories from the GitHub API using App Installation or OAuth token
 */
export async function syncGitHubRepositories(): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  const session = await requireAuth();
  const userId = session.user.id;

  const [installation] = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.userId, userId))
    .limit(1);

  if (!installation) {
    throw new Error("GitHub is not connected.");
  }

  const { token, installationId } = await getUserGitHubToken(userId);

  if (!token && !installationId) {
    throw new Error("GitHub authorization token is missing or expired. Please reconnect.");
  }

  let remoteRepos: GitHubRepoDTO[] = [];

  try {
    const appConfig = getGitHubAppConfigStatus();
    if (appConfig.isAppConfigured && installation.installationId) {
      remoteRepos = await fetchInstallationRepositories(installation.installationId);
    } else if (token) {
      remoteRepos = await fetchUserRepositories(token);
    } else {
      throw new Error("GitHub credentials not configured.");
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "GitHub API synchronization failed";
    await db
      .update(githubInstallations)
      .set({ lastSyncError: errMsg, updatedAt: new Date() })
      .where(eq(githubInstallations.id, installation.id));
    throw new Error(`Failed to synchronize repositories: ${errMsg}`);
  }

  // Upsert repositories into PostgreSQL
  for (const repo of remoteRepos) {
    const [existing] = await db
      .select()
      .from(githubRepositories)
      .where(
        and(
          eq(githubRepositories.userId, userId),
          eq(githubRepositories.githubRepoId, repo.id)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(githubRepositories)
        .set({
          name: repo.name,
          fullName: repo.fullName,
          owner: repo.owner,
          private: repo.private,
          htmlUrl: repo.htmlUrl,
          description: repo.description,
          defaultBranch: repo.defaultBranch,
          openIssuesCount: repo.openIssuesCount,
          openPrsCount: repo.openPrsCount || 0,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(githubRepositories.id, existing.id));
    } else {
      await db.insert(githubRepositories).values({
        id: crypto.randomUUID(),
        userId,
        installationId: installation.installationId,
        githubRepoId: repo.id,
        name: repo.name,
        fullName: repo.fullName,
        owner: repo.owner,
        private: repo.private,
        htmlUrl: repo.htmlUrl,
        description: repo.description,
        defaultBranch: repo.defaultBranch,
        openIssuesCount: repo.openIssuesCount,
        openPrsCount: repo.openPrsCount || 0,
        isSelected: true,
        lastSyncedAt: new Date(),
      });
    }
  }

  await db
    .update(githubInstallations)
    .set({
      lastSyncError: null,
      updatedAt: new Date(),
    })
    .where(eq(githubInstallations.id, installation.id));

  revalidatePath("/settings/integrations");
  revalidatePath("/github");
  return {
    success: true,
    count: remoteRepos.length,
    message: `Synchronized ${remoteRepos.length} repositories from GitHub.`,
  };
}

/**
 * Fetch issues for a repository from GitHub
 */
export async function getRepositoryIssues(
  repoFullName: string,
  options?: { state?: "open" | "closed" | "all"; per_page?: number; page?: number }
): Promise<GitHubIssueDTO[]> {
  const session = await requireAuth();
  const userId = session.user.id;

  const { token } = await getUserGitHubToken(userId);
  if (!token) return [];

  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) return [];

  try {
    return await fetchRepositoryIssues(token, owner, repo, options);
  } catch (err) {
    console.error(`Error fetching issues for ${repoFullName}:`, err);
    return [];
  }
}

/**
 * Fetch pull requests for a repository from GitHub
 */
export async function getRepositoryPullRequests(
  repoFullName: string,
  options?: { state?: "open" | "closed" | "all"; per_page?: number; page?: number }
): Promise<GitHubPullRequestDTO[]> {
  const session = await requireAuth();
  const userId = session.user.id;

  const { token } = await getUserGitHubToken(userId);
  if (!token) return [];

  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) return [];

  try {
    return await fetchRepositoryPullRequests(token, owner, repo, options);
  } catch (err) {
    console.error(`Error fetching PRs for ${repoFullName}:`, err);
    return [];
  }
}

/**
 * Fetch recent activity events for a repository
 */
export async function getRepositoryActivity(
  repoFullName: string
): Promise<GitHubActivityEventDTO[]> {
  const session = await requireAuth();
  const userId = session.user.id;

  const { token } = await getUserGitHubToken(userId);
  if (!token) return [];

  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) return [];

  try {
    return await fetchRepositoryActivity(token, owner, repo);
  } catch (err) {
    console.error(`Error fetching activity for ${repoFullName}:`, err);
    return [];
  }
}

/**
 * Fetch commit/branch checks for a repository
 */
export async function getRepositoryChecks(
  repoFullName: string,
  ref = "main"
): Promise<GitHubCheckRunDTO[]> {
  const session = await requireAuth();
  const userId = session.user.id;

  const { token } = await getUserGitHubToken(userId);
  if (!token) return [];

  const [owner, repo] = repoFullName.split("/");
  if (!owner || !repo) return [];

  try {
    return await fetchCommitChecks(token, owner, repo, ref);
  } catch (err) {
    console.error(`Error fetching checks for ${repoFullName}@${ref}:`, err);
    return [];
  }
}

/**
 * Detailed repository bundle for the details view
 */
export async function getRepositoryDetails(repoFullName: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const [repoRecord] = await db
    .select()
    .from(githubRepositories)
    .where(
      and(
        eq(githubRepositories.userId, userId),
        eq(githubRepositories.fullName, repoFullName)
      )
    )
    .limit(1);

  if (!repoRecord) {
    throw new Error(`Repository ${repoFullName} not found or access unauthorized.`);
  }

  const [issues, pullRequests, activity, checks] = await Promise.all([
    getRepositoryIssues(repoFullName, { state: "all", per_page: 50 }),
    getRepositoryPullRequests(repoFullName, { state: "all", per_page: 30 }),
    getRepositoryActivity(repoFullName),
    getRepositoryChecks(repoFullName, repoRecord.defaultBranch || "main"),
  ]);

  return {
    repository: repoRecord,
    issues,
    pullRequests,
    activity,
    checks,
  };
}

/**
 * Disconnect GitHub integration for the user
 */
export async function disconnectGitHub(): Promise<{ success: boolean }> {
  const session = await requireAuth();
  const userId = session.user.id;

  await db
    .delete(githubRepositories)
    .where(eq(githubRepositories.userId, userId));

  await db
    .delete(githubInstallations)
    .where(eq(githubInstallations.userId, userId));

  revalidatePath("/settings/integrations");
  revalidatePath("/github");
  return { success: true };
}

/**
 * Convert a GitHub Issue into a Task with direct links and bidirectional mapping.
 * Enforces uniqueness to prevent one GitHub issue from creating duplicate tasks for the same user.
 */
export async function convertGitHubIssueToTask(input: {
  repoFullName: string;
  issueNumber: number;
  title: string;
  body?: string | null;
  htmlUrl: string;
  priority?: Priority;
  dueDate?: string | null;
}): Promise<{ id: string; alreadyExisted?: boolean }> {
  const session = await requireAuth();
  const userId = session.user.id;

  // Enforce uniqueness: check if this issue is already mapped to an existing task
  const [existingMapping] = await db
    .select()
    .from(githubIssueMappings)
    .where(
      and(
        eq(githubIssueMappings.userId, userId),
        eq(githubIssueMappings.repositoryFullName, input.repoFullName),
        eq(githubIssueMappings.issueNumber, input.issueNumber)
      )
    )
    .limit(1);

  if (existingMapping) {
    return { id: existingMapping.todoId, alreadyExisted: true };
  }

  const newId = crypto.randomUUID();
  const taskTitle = `[#${input.issueNumber}] ${input.title}`;

  const [task] = await db
    .insert(todos)
    .values({
      id: newId,
      userId,
      title: taskTitle,
      description: input.body || `Imported from ${input.repoFullName} #${input.issueNumber}`,
      priority: input.priority || "high",
      status: "todo",
      completed: false,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      sourceGithubIssueUrl: input.htmlUrl,
      sourceGithubRepo: input.repoFullName,
    })
    .returning();

  // Create persistent mapping record for bidirectional sync
  const mappingId = crypto.randomUUID();
  await db.insert(githubIssueMappings).values({
    id: mappingId,
    userId,
    todoId: task.id,
    repositoryFullName: input.repoFullName,
    githubIssueId: `issue_${input.issueNumber}`,
    issueNumber: input.issueNumber,
    issueUrl: input.htmlUrl,
    issueState: "open",
    issueTitle: input.title,
    issueBody: input.body || null,
    syncDirection: "bidirectional",
    lastSyncedAt: new Date(),
    lastRemoteUpdatedAt: new Date(),
    lastLocalUpdatedAt: new Date(),
    syncStatus: "synced",
    syncOrigin: "user",
  });

  // Create default checklist steps
  const steps = [
    `Inspect problem context in ${input.repoFullName} #${input.issueNumber}`,
    "Create feature or fix branch locally",
    "Implement changes and write automated tests",
    "Open PR and reference issue number",
  ];

  for (let i = 0; i < steps.length; i++) {
    await db.insert(subtasks).values({
      id: crypto.randomUUID(),
      todoId: task.id,
      userId,
      title: steps[i],
      completed: false,
      sortOrder: i,
    });
  }

  revalidatePath("/todo");
  revalidatePath("/github");
  revalidatePath("/settings/integrations");
  return { id: task.id };
}

/**
 * Fetch all mapped tasks and their sync states for the authenticated user
 */
export async function getAllUserMappedTasks() {
  const session = await requireAuth();
  const userId = session.user.id;

  const mappings = await db
    .select({
      mapping: githubIssueMappings,
      todo: todos,
    })
    .from(githubIssueMappings)
    .innerJoin(todos, eq(githubIssueMappings.todoId, todos.id))
    .where(eq(githubIssueMappings.userId, userId))
    .orderBy(desc(githubIssueMappings.lastSyncedAt));

  return mappings;
}

/**
 * Link an existing Todo task to a GitHub issue
 */
export async function linkExistingTaskAction(input: {
  todoId: string;
  repoFullName: string;
  issueNumber: number;
}) {
  const session = await requireAuth();
  const userId = session.user.id;

  const mapping = await linkTaskToGitHubIssue({
    userId,
    todoId: input.todoId,
    repoFullName: input.repoFullName,
    issueNumber: input.issueNumber,
  });

  revalidatePath("/todo");
  revalidatePath("/github");
  revalidatePath("/settings/integrations");
  return mapping;
}

/**
 * Safely unlink a Todo task from its GitHub issue (preserves the local task!)
 */
export async function unlinkTaskAction(mappingId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const res = await unlinkTaskFromGitHubIssue({ userId, mappingId });

  revalidatePath("/todo");
  revalidatePath("/github");
  revalidatePath("/settings/integrations");
  return res;
}

/**
 * Create a new GitHub issue from a task with permission checks and confirmation
 */
export async function createGitHubIssueFromTaskAction(input: {
  todoId: string;
  repoFullName: string;
  title: string;
  body?: string | null;
  labels?: string[];
  assignees?: string[];
}) {
  const session = await requireAuth();
  const userId = session.user.id;

  const mapping = await createGitHubIssueFromTask({
    userId,
    todoId: input.todoId,
    repoFullName: input.repoFullName,
    title: input.title,
    body: input.body,
    labels: input.labels,
    assignees: input.assignees,
  });

  revalidatePath("/todo");
  revalidatePath("/github");
  revalidatePath("/settings/integrations");
  return mapping;
}

/**
 * Reconcile all mapped tasks for the authenticated user
 */
export async function reconcileAllMappingsAction() {
  const session = await requireAuth();
  const userId = session.user.id;

  const result = await reconcileAllUserMappings(userId);

  revalidatePath("/todo");
  revalidatePath("/github");
  revalidatePath("/settings/integrations");
  return result;
}

/**
 * Get user sync preferences
 */
export async function getGitHubSyncSettingsAction() {
  const session = await requireAuth();
  const userId = session.user.id;

  return await getUserSyncSettings(userId);
}

/**
 * Update user sync preferences
 */
export async function updateGitHubSyncSettingsAction(
  updates: Partial<typeof githubSyncSettings.$inferInsert>
) {
  const session = await requireAuth();
  const userId = session.user.id;

  const updated = await updateUserSyncSettings(userId, updates);

  revalidatePath("/github");
  revalidatePath("/settings/integrations");
  return updated;
}

/**
 * Retry synchronization on a failed mapping
 */
export async function retryTaskSyncAction(mappingId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const [mapping] = await db
    .select()
    .from(githubIssueMappings)
    .where(
      and(
        eq(githubIssueMappings.id, mappingId),
        eq(githubIssueMappings.userId, userId)
      )
    )
    .limit(1);

  if (!mapping) throw new Error("Mapping not found");

  const [task] = await db
    .select()
    .from(todos)
    .where(eq(todos.id, mapping.todoId))
    .limit(1);

  if (!task) throw new Error("Task not found");

  const result = await syncTaskToIssue(mappingId, task, { origin: "retry" });

  revalidatePath("/todo");
  revalidatePath("/github");
  revalidatePath("/settings/integrations");
  return result;
}

/**
 * Aggregate summary for the comprehensive GitHub productivity dashboard
 */
export async function getGitHubDashboardData() {
  const session = await requireAuth();
  const userId = session.user.id;

  const connection = await getGitHubConnection();
  if (!connection.isConnected) {
    return {
      connection,
      repositories: [],
      openIssues: [],
      pullRequests: [],
      mappedTasks: [],
      syncSettings: null,
    };
  }

  const [repos, mappedTasks, syncSettings] = await Promise.all([
    getGitHubRepositories(),
    getAllUserMappedTasks(),
    getUserSyncSettings(userId),
  ]);

  const selectedRepos = repos.filter((r) => r.isSelected);
  const primaryRepo = selectedRepos[0] || repos[0];

  let openIssues: GitHubIssueDTO[] = [];
  let pullRequests: GitHubPullRequestDTO[] = [];

  if (primaryRepo) {
    const [issues, prs] = await Promise.all([
      getRepositoryIssues(primaryRepo.fullName),
      getRepositoryPullRequests(primaryRepo.fullName),
    ]);
    openIssues = issues;
    pullRequests = prs;
  }

  return {
    connection,
    repositories: repos,
    openIssues,
    pullRequests,
    mappedTasks,
    syncSettings,
  };
}
