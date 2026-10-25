import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  githubInstallations,
  githubIssueMappings,
  githubSyncSettings,
  todos,
} from "@/schema/schema";
import {
  checkRepositoryPermission,
  createRemoteGitHubIssue,
  decryptGitHubToken,
  fetchIssueByNumber,
  getGitHubAppConfigStatus,
  getInstallationAccessToken,
  updateRemoteGitHubIssue,
  type GitHubIssueDTO,
} from "./github";

export interface SyncResult {
  success: boolean;
  action: "synced" | "skipped" | "conflict" | "error";
  message: string;
  mappingId?: string;
}

/**
 * Get or initialize user's GitHub sync settings
 */
export async function getUserSyncSettings(userId: string) {
  try {
    const [existing] = await db
      .select()
      .from(githubSyncSettings)
      .where(eq(githubSyncSettings.userId, userId))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(githubSyncSettings)
      .values({
        id: crypto.randomUUID(),
        userId,
        autoSyncOnWebhook: true,
        syncStatusChanges: true,
        syncTitleChanges: true,
        syncDescriptionChanges: true,
        syncLabels: true,
        syncAssignees: true,
        conflictStrategy: "newer_wins",
      })
      .returning();

    return created;
  } catch (err) {
    console.error("Error retrieving user sync settings, falling back to defaults:", err);
    return {
      id: "default",
      userId,
      autoSyncOnWebhook: true,
      syncStatusChanges: true,
      syncTitleChanges: true,
      syncDescriptionChanges: true,
      syncLabels: true,
      syncAssignees: true,
      conflictStrategy: "newer_wins",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

/**
 * Update user's GitHub sync settings
 */
export async function updateUserSyncSettings(
  userId: string,
  updates: Partial<typeof githubSyncSettings.$inferInsert>
) {
  const settings = await getUserSyncSettings(userId);

  const [updated] = await db
    .update(githubSyncSettings)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(githubSyncSettings.id, settings.id))
    .returning();

  return updated;
}

/**
 * Helper to get the installation and active token for a user
 */
export async function getUserGitHubToken(userId: string): Promise<{
  token: string | null;
  installationId: string | null;
}> {
  const [installation] = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.userId, userId))
    .limit(1);

  if (!installation) {
    return { token: null, installationId: null };
  }

  // 1. Try App Installation Access Token if GitHub App is configured
  const appConfig = getGitHubAppConfigStatus();
  if (appConfig.isAppConfigured && installation.installationId) {
    try {
      const appToken = await getInstallationAccessToken(installation.installationId);
      return { token: appToken, installationId: installation.installationId };
    } catch (err) {
      console.warn("Failed to get App installation token, falling back to stored OAuth token:", err);
    }
  }

  // 2. Fallback to stored encrypted OAuth token
  if (installation.accessToken) {
    const rawToken = decryptGitHubToken(installation.accessToken);
    return { token: rawToken, installationId: installation.installationId };
  }

  return { token: null, installationId: installation.installationId };
}

/**
 * Link an existing Todo task to a GitHub issue
 * Enforces uniqueness: 1 task -> 1 issue, and 1 issue -> 1 task per user
 */
export async function linkTaskToGitHubIssue(input: {
  userId: string;
  todoId: string;
  repoFullName: string;
  issueNumber: number;
}): Promise<typeof githubIssueMappings.$inferSelect> {
  const { userId, todoId, repoFullName, issueNumber } = input;

  // 1. Verify task ownership
  const [task] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
    .limit(1);

  if (!task) {
    throw new Error("Task not found or access unauthorized.");
  }

  // 2. Enforce uniqueness: task cannot already be linked
  const [existingTaskMapping] = await db
    .select()
    .from(githubIssueMappings)
    .where(
      and(
        eq(githubIssueMappings.userId, userId),
        eq(githubIssueMappings.todoId, todoId)
      )
    )
    .limit(1);

  if (existingTaskMapping) {
    throw new Error(
      `This task is already linked to ${existingTaskMapping.repositoryFullName} #${existingTaskMapping.issueNumber}`
    );
  }

  // 3. Enforce uniqueness: issue cannot already be linked to another task for this user
  const [existingIssueMapping] = await db
    .select()
    .from(githubIssueMappings)
    .where(
      and(
        eq(githubIssueMappings.userId, userId),
        eq(githubIssueMappings.repositoryFullName, repoFullName),
        eq(githubIssueMappings.issueNumber, issueNumber)
      )
    )
    .limit(1);

  if (existingIssueMapping) {
    throw new Error(
      `Issue ${repoFullName} #${issueNumber} is already linked to task "${task.title}".`
    );
  }

  // 4. Fetch issue details from GitHub
  const { token } = await getUserGitHubToken(userId);
  const [owner, repo] = repoFullName.split("/");

  let remoteIssue: GitHubIssueDTO | null = null;
  if (token && owner && repo) {
    remoteIssue = await fetchIssueByNumber(token, owner, repo, issueNumber);
  }

  if (!remoteIssue) {
    throw new Error(
      `Could not retrieve issue #${issueNumber} from ${repoFullName}. Please verify repository access and issue existence.`
    );
  }

  // 5. Create mapping in PostgreSQL
  const mappingId = crypto.randomUUID();
  const [mapping] = await db
    .insert(githubIssueMappings)
    .values({
      id: mappingId,
      userId,
      todoId,
      repositoryFullName: repoFullName,
      githubIssueId: remoteIssue.id,
      issueNumber: remoteIssue.number,
      issueUrl: remoteIssue.htmlUrl,
      issueState: remoteIssue.state,
      issueTitle: remoteIssue.title,
      issueBody: remoteIssue.body,
      issueAuthor: remoteIssue.author,
      issueAssignee: remoteIssue.assignee || null,
      issueLabels: JSON.stringify(remoteIssue.labels || []),
      syncDirection: "bidirectional",
      lastSyncedAt: new Date(),
      lastRemoteUpdatedAt: new Date(remoteIssue.updatedAt),
      lastLocalUpdatedAt: new Date(),
      syncStatus: "synced",
      syncOrigin: "user",
    })
    .returning();

  // 6. Update task source metadata
  await db
    .update(todos)
    .set({
      sourceGithubIssueUrl: remoteIssue.htmlUrl,
      sourceGithubRepo: repoFullName,
      updatedAt: new Date(),
    })
    .where(eq(todos.id, todoId));

  return mapping;
}

/**
 * Safely unlinks a task from a GitHub issue without deleting the task!
 */
export async function unlinkTaskFromGitHubIssue(input: {
  userId: string;
  mappingId: string;
}): Promise<{ success: boolean }> {
  const { userId, mappingId } = input;

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

  if (!mapping) {
    throw new Error("Mapping not found or unauthorized.");
  }

  // Delete the mapping
  await db
    .delete(githubIssueMappings)
    .where(eq(githubIssueMappings.id, mappingId));

  // Clear task metadata while preserving the task itself
  await db
    .update(todos)
    .set({
      sourceGithubIssueUrl: null,
      sourceGithubRepo: null,
      updatedAt: new Date(),
    })
    .where(and(eq(todos.id, mapping.todoId), eq(todos.userId, userId)));

  return { success: true };
}

/**
 * Create a new GitHub issue from a Todo task with confirmation data and write validation
 */
export async function createGitHubIssueFromTask(input: {
  userId: string;
  todoId: string;
  repoFullName: string;
  title: string;
  body?: string | null;
  labels?: string[];
  assignees?: string[];
}): Promise<typeof githubIssueMappings.$inferSelect> {
  const { userId, todoId, repoFullName, title, body, labels, assignees } = input;

  // 1. Verify task ownership
  const [task] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, todoId), eq(todos.userId, userId)))
    .limit(1);

  if (!task) {
    throw new Error("Task not found or access unauthorized.");
  }

  // 2. Check task is not already linked
  const [existingMapping] = await db
    .select()
    .from(githubIssueMappings)
    .where(
      and(
        eq(githubIssueMappings.userId, userId),
        eq(githubIssueMappings.todoId, todoId)
      )
    )
    .limit(1);

  if (existingMapping) {
    throw new Error(
      `Task is already linked to ${existingMapping.repositoryFullName} #${existingMapping.issueNumber}.`
    );
  }

  // 3. Verify repository write access
  const { token } = await getUserGitHubToken(userId);
  const [owner, repo] = repoFullName.split("/");

  if (!token || !owner || !repo) {
    throw new Error(`GitHub authorization token is required to create an issue in ${repoFullName}.`);
  }

  // Check permission
  const { canWrite } = await checkRepositoryPermission(token, owner, repo);
  if (!canWrite) {
    throw new Error(
      `Insufficient permissions to create issues in repository ${repoFullName}. Push or Admin permission required.`
    );
  }

  const createdIssue = await createRemoteGitHubIssue(token, owner, repo, {
    title,
    body,
    labels,
    assignees,
  });

  // 4. Persist mapping
  const mappingId = crypto.randomUUID();
  const [mapping] = await db
    .insert(githubIssueMappings)
    .values({
      id: mappingId,
      userId,
      todoId,
      repositoryFullName: repoFullName,
      githubIssueId: createdIssue.id,
      issueNumber: createdIssue.number,
      issueUrl: createdIssue.htmlUrl,
      issueState: createdIssue.state,
      issueTitle: createdIssue.title,
      issueBody: createdIssue.body,
      issueAuthor: createdIssue.author,
      issueAssignee: createdIssue.assignee || null,
      issueLabels: JSON.stringify(createdIssue.labels || []),
      syncDirection: "bidirectional",
      lastSyncedAt: new Date(),
      lastRemoteUpdatedAt: new Date(createdIssue.updatedAt),
      lastLocalUpdatedAt: new Date(),
      syncStatus: "synced",
      syncOrigin: "user",
    })
    .returning();

  // 5. Update task with source information
  await db
    .update(todos)
    .set({
      sourceGithubIssueUrl: createdIssue.htmlUrl,
      sourceGithubRepo: repoFullName,
      updatedAt: new Date(),
    })
    .where(eq(todos.id, todoId));

  return mapping;
}

/**
 * Synchronize a remote GitHub Issue into the local Todo task (GitHub -> Todo)
 * Handles conflict resolution, field synchronization, and loop prevention
 */
export async function syncIssueToTask(
  mappingId: string,
  remoteIssue: GitHubIssueDTO,
  options?: { origin?: string }
): Promise<SyncResult> {
  const [mapping] = await db
    .select()
    .from(githubIssueMappings)
    .where(eq(githubIssueMappings.id, mappingId))
    .limit(1);

  if (!mapping) {
    return { success: false, action: "error", message: "Mapping not found" };
  }

  // Loop prevention: If the mapping was recently updated by a local user action and
  // the remote updated timestamp is earlier than or equal to last local update, skip
  const remoteUpdatedAt = new Date(remoteIssue.updatedAt).getTime();
  const lastLocalUpdatedAt = mapping.lastLocalUpdatedAt
    ? new Date(mapping.lastLocalUpdatedAt).getTime()
    : 0;

  if (
    mapping.syncOrigin === "user" &&
    lastLocalUpdatedAt > 0 &&
    remoteUpdatedAt <= lastLocalUpdatedAt + 2000
  ) {
    return {
      success: true,
      action: "skipped",
      message: "Skipped echo update to prevent infinite sync loop.",
      mappingId,
    };
  }

  // Retrieve user sync settings
  const settings = await getUserSyncSettings(mapping.userId);

  // Check conflict resolution strategy
  if (settings.conflictStrategy === "local_wins" && mapping.syncStatus === "pending") {
    return {
      success: true,
      action: "conflict",
      message: "Local wins conflict strategy preserved existing task changes.",
      mappingId,
    };
  }

  // Fetch target task
  const [task] = await db
    .select()
    .from(todos)
    .where(eq(todos.id, mapping.todoId))
    .limit(1);

  if (!task) {
    return { success: false, action: "error", message: "Linked task no longer exists." };
  }

  const taskUpdates: Partial<typeof todos.$inferInsert> = {
    updatedAt: new Date(),
  };

  // 1. Sync title if enabled
  if (settings.syncTitleChanges && remoteIssue.title !== mapping.issueTitle) {
    taskUpdates.title = remoteIssue.title;
  }

  // 2. Sync description if enabled
  if (settings.syncDescriptionChanges && remoteIssue.body !== mapping.issueBody) {
    taskUpdates.description = remoteIssue.body;
  }

  // 3. Sync status / completion if enabled
  if (settings.syncStatusChanges) {
    const isRemoteClosed = remoteIssue.state === "closed";
    if (isRemoteClosed && !task.completed) {
      taskUpdates.completed = true;
      taskUpdates.status = "completed";
    } else if (!isRemoteClosed && task.completed) {
      taskUpdates.completed = false;
      taskUpdates.status = "todo";
    }
  }

  // Apply task updates if any
  if (Object.keys(taskUpdates).length > 1) {
    await db.update(todos).set(taskUpdates).where(eq(todos.id, task.id));
  }

  // Update mapping record
  await db
    .update(githubIssueMappings)
    .set({
      issueState: remoteIssue.state,
      issueTitle: remoteIssue.title,
      issueBody: remoteIssue.body,
      issueAssignee: remoteIssue.assignee || null,
      issueLabels: JSON.stringify(remoteIssue.labels || []),
      lastRemoteUpdatedAt: new Date(remoteIssue.updatedAt),
      lastSyncedAt: new Date(),
      syncStatus: "synced",
      lastSyncError: null,
      syncOrigin: options?.origin || "webhook",
      updatedAt: new Date(),
    })
    .where(eq(githubIssueMappings.id, mappingId));

  return {
    success: true,
    action: "synced",
    message: `Synchronized issue #${remoteIssue.number} to task "${task.title}".`,
    mappingId,
  };
}

/**
 * Synchronize a local Todo task change to GitHub (Todo -> GitHub)
 * Triggers on task title, body, or status updates
 */
export async function syncTaskToIssue(
  mappingId: string,
  localTodo: typeof todos.$inferSelect,
  options?: { origin?: string }
): Promise<SyncResult> {
  const [mapping] = await db
    .select()
    .from(githubIssueMappings)
    .where(eq(githubIssueMappings.id, mappingId))
    .limit(1);

  if (!mapping) {
    return { success: false, action: "error", message: "Mapping not found" };
  }

  if (mapping.syncDirection === "github_to_todo") {
    return { success: true, action: "skipped", message: "Mapping configured as unidirectional GitHub -> Todo." };
  }

  const settings = await getUserSyncSettings(mapping.userId);
  const { token } = await getUserGitHubToken(mapping.userId);

  const updates: {
    title?: string;
    body?: string | null;
    state?: "open" | "closed";
  } = {};

  if (settings.syncTitleChanges && localTodo.title !== mapping.issueTitle) {
    updates.title = localTodo.title;
  }

  if (settings.syncDescriptionChanges && localTodo.description !== mapping.issueBody) {
    updates.body = localTodo.description;
  }

  if (settings.syncStatusChanges) {
    const isLocalCompleted = localTodo.completed || localTodo.status === "completed" || localTodo.status === "done";
    const isRemoteClosed = mapping.issueState === "closed";

    if (isLocalCompleted && !isRemoteClosed) {
      updates.state = "closed";
    } else if (!isLocalCompleted && isRemoteClosed) {
      updates.state = "open";
    }
  }

  // If no monitored fields changed, nothing to push
  if (Object.keys(updates).length === 0) {
    return { success: true, action: "skipped", message: "No tracked fields changed for GitHub sync." };
  }

  const [owner, repo] = mapping.repositoryFullName.split("/");

  if (!token || !owner || !repo) {
    throw new Error(
      `Cannot push updates to GitHub issue ${mapping.repositoryFullName} #${mapping.issueNumber}: Missing token or repository.`
    );
  }

  try {
    const updatedRemote = await updateRemoteGitHubIssue(
      token,
      owner,
      repo,
      mapping.issueNumber,
      updates
    );

    // Update mapping record
    await db
      .update(githubIssueMappings)
      .set({
        issueTitle: updatedRemote.title,
        issueBody: updatedRemote.body,
        issueState: updatedRemote.state,
        lastRemoteUpdatedAt: new Date(updatedRemote.updatedAt),
        lastLocalUpdatedAt: new Date(),
        lastSyncedAt: new Date(),
        syncStatus: "synced",
        lastSyncError: null,
        syncOrigin: options?.origin || "user",
        updatedAt: new Date(),
      })
      .where(eq(githubIssueMappings.id, mappingId));

    return {
      success: true,
      action: "synced",
      message: `Pushed local changes to ${mapping.repositoryFullName} #${mapping.issueNumber}.`,
      mappingId,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Failed to sync to GitHub";

    // Mark mapping as error without breaking local state
    await db
      .update(githubIssueMappings)
      .set({
        syncStatus: "error",
        lastSyncError: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(githubIssueMappings.id, mappingId));

    return {
      success: false,
      action: "error",
      message: errorMessage,
      mappingId,
    };
  }
}

/**
 * Reconcile all mapped tasks for a user
 * Safe fallback / manual sync mechanism to heal drift and catch missed webhooks
 */
export async function reconcileAllUserMappings(userId: string): Promise<{
  total: number;
  synced: number;
  errors: number;
  details: string[];
}> {
  const mappings = await db
    .select()
    .from(githubIssueMappings)
    .where(eq(githubIssueMappings.userId, userId));

  const { token } = await getUserGitHubToken(userId);

  let syncedCount = 0;
  let errorCount = 0;
  const details: string[] = [];

  for (const mapping of mappings) {
    const [owner, repo] = mapping.repositoryFullName.split("/");
    let remoteIssue: GitHubIssueDTO | null = null;

    if (token && owner && repo) {
      remoteIssue = await fetchIssueByNumber(token, owner, repo, mapping.issueNumber);
    }

    if (remoteIssue) {
      const res = await syncIssueToTask(mapping.id, remoteIssue, { origin: "reconcile" });
      if (res.success) {
        syncedCount++;
        details.push(`Reconciled ${mapping.repositoryFullName} #${mapping.issueNumber}`);
      } else {
        errorCount++;
        details.push(`Failed to reconcile #${mapping.issueNumber}: ${res.message}`);
      }
    } else {
      errorCount++;
      details.push(`Could not fetch remote issue ${mapping.repositoryFullName} #${mapping.issueNumber}`);
    }
  }

  return {
    total: mappings.length,
    synced: syncedCount,
    errors: errorCount,
    details,
  };
}
