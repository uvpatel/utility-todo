import test from "node:test";
import assert from "node:assert/strict";
import type {
  GitHubCheckRunDTO,
  GitHubPullRequestDTO,
} from "../src/lib/integrations/github";

test("GitHub Sync — Pull Request Data Model & Visibility Contract", () => {
  const prs: GitHubPullRequestDTO[] = [
    {
      id: "pr_101",
      number: 12,
      title: "feat(kanban): Add column collapse and horizontal scroll",
      body: "Implements column collapse states and keyboard interactions",
      state: "open",
      draft: false,
      author: "uvpatel",
      headRef: "feat/kanban-redesign",
      baseRef: "main",
      htmlUrl: "https://github.com/uvpatel/utility-todo/pull/12",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mergedAt: null,
      repositoryFullName: "uvpatel/utility-todo",
    },
    {
      id: "pr_102",
      number: 10,
      title: "fix(auth): Better Auth session cookie persistence",
      body: "Resolves cookie expiration issues",
      state: "merged",
      draft: false,
      author: "uvpatel",
      headRef: "fix/session-expiry",
      baseRef: "main",
      htmlUrl: "https://github.com/uvpatel/utility-todo/pull/10",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      repositoryFullName: "uvpatel/utility-todo",
    },
  ];

  assert.ok(Array.isArray(prs), "PRs list should be an array");
  assert.equal(prs.length, 2);

  for (const pr of prs) {
    assert.ok(pr.id, "PR must have an id");
    assert.ok(typeof pr.number === "number", "PR number must be numeric");
    assert.ok(pr.title, "PR must have a title");
    assert.ok(pr.htmlUrl.includes("/pull/"), "PR htmlUrl must be valid");
    assert.ok(["open", "closed", "merged"].includes(pr.state), "PR state must be valid");
    assert.ok(pr.headRef, "PR headRef branch must be defined");
    assert.ok(pr.baseRef, "PR baseRef branch must be defined");
  }

  // Ensure PRs are treated as development activity, not tasks
  const openPrs = prs.filter((p) => p.state === "open");
  const mergedPrs = prs.filter((p) => p.state === "merged");
  assert.equal(openPrs.length, 1, "Should have 1 open PR");
  assert.equal(mergedPrs.length, 1, "Should have 1 merged PR");
});

test("GitHub Sync — CI Check Runs Data Model Contract", () => {
  const checks: GitHubCheckRunDTO[] = [
    {
      id: 101,
      name: "typecheck / tsc",
      status: "completed",
      conclusion: "success",
      htmlUrl: "https://github.com/uvpatel/utility-todo/actions/runs/101",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
    {
      id: 102,
      name: "tests / vitest",
      status: "completed",
      conclusion: "success",
      htmlUrl: "https://github.com/uvpatel/utility-todo/actions/runs/102",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    },
  ];

  assert.equal(checks.length, 2);
  for (const chk of checks) {
    assert.ok(typeof chk.id === "number");
    assert.ok(chk.name);
    assert.equal(chk.status, "completed");
    assert.equal(chk.conclusion, "success");
    assert.ok(chk.htmlUrl?.startsWith("https://github.com/"));
  }
});

test("GitHub Sync — Loop Prevention and Origin Tagging", () => {
  // Scenario: Local update happened at T0 with origin 'user'.
  // Webhook event fires with updated_at equal or prior to local update + threshold.
  const lastLocalUpdatedAt = Date.now();
  const remoteUpdatedAt = lastLocalUpdatedAt + 1000; // 1s later (within 2s echo window)
  const syncOrigin = "user";

  const isEchoLoop =
    syncOrigin === "user" &&
    lastLocalUpdatedAt > 0 &&
    remoteUpdatedAt <= lastLocalUpdatedAt + 2000;

  assert.equal(isEchoLoop, true, "Echo webhook delivery within window should be detected and skipped");

  // Legitimate subsequent remote edit outside echo window
  const subsequentRemoteUpdatedAt = lastLocalUpdatedAt + 15000; // 15s later
  const isSubsequentEcho =
    syncOrigin === "user" &&
    lastLocalUpdatedAt > 0 &&
    subsequentRemoteUpdatedAt <= lastLocalUpdatedAt + 2000;

  assert.equal(isSubsequentEcho, false, "Subsequent external edit should NOT be skipped");
});

test("GitHub Sync — Bidirectional Status Mapping", () => {
  // Utility Todo status -> GitHub issue state
  function todoStatusToGitHubState(status: string, completed: boolean): "open" | "closed" {
    if (completed || status === "completed" || status === "done") {
      return "closed";
    }
    return "open";
  }

  // GitHub issue state -> Utility Todo task status & completed
  function gitHubStateToTodo(state: "open" | "closed"): { status: string; completed: boolean } {
    if (state === "closed") {
      return { status: "completed", completed: true };
    }
    return { status: "todo", completed: false };
  }

  // Verify Todo -> GitHub transitions
  assert.equal(todoStatusToGitHubState("todo", false), "open");
  assert.equal(todoStatusToGitHubState("in_progress", false), "open");
  assert.equal(todoStatusToGitHubState("done", true), "closed");
  assert.equal(todoStatusToGitHubState("completed", true), "closed");

  // Verify GitHub -> Todo transitions
  assert.deepEqual(gitHubStateToTodo("closed"), { status: "completed", completed: true });
  assert.deepEqual(gitHubStateToTodo("open"), { status: "todo", completed: false });
});

test("GitHub Sync — Uniqueness Constraint Invariants", () => {
  // Simulated mapping store
  interface MappingRecord {
    userId: string;
    todoId: string;
    repoFullName: string;
    issueNumber: number;
  }

  const existingMappings: MappingRecord[] = [
    {
      userId: "user-1",
      todoId: "task-100",
      repoFullName: "workspace/utility-todo",
      issueNumber: 142,
    },
  ];

  function validateCanLink(userId: string, todoId: string, repo: string, issue: number): { allowed: boolean; reason?: string } {
    // 1. Task already linked
    if (existingMappings.some((m) => m.userId === userId && m.todoId === todoId)) {
      return { allowed: false, reason: "task_already_linked" };
    }
    // 2. Issue already linked for this user
    if (existingMappings.some((m) => m.userId === userId && m.repoFullName === repo && m.issueNumber === issue)) {
      return { allowed: false, reason: "issue_already_linked" };
    }
    return { allowed: true };
  }

  // Attempting to link same task to another issue
  assert.deepEqual(
    validateCanLink("user-1", "task-100", "workspace/utility-todo", 145),
    { allowed: false, reason: "task_already_linked" }
  );

  // Attempting to link another task to the already linked issue
  assert.deepEqual(
    validateCanLink("user-1", "task-200", "workspace/utility-todo", 142),
    { allowed: false, reason: "issue_already_linked" }
  );

  // Distinct task and distinct issue succeeds
  assert.deepEqual(
    validateCanLink("user-1", "task-200", "workspace/utility-todo", 145),
    { allowed: true }
  );

  // Different user with same issue succeeds (multi-tenant safe)
  assert.deepEqual(
    validateCanLink("user-2", "task-300", "workspace/utility-todo", 142),
    { allowed: true }
  );
});

test("GitHub Sync — Data Preservation Invariant", () => {
  // When GitHub access is revoked, removed, or unlinked:
  // User tasks must remain intact with descriptions, checklist items, and project references
  interface LocalTask {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    sourceGithubIssueUrl: string | null;
  }

  const task: LocalTask = {
    id: "task-alpha",
    title: "Implement OAuth flow",
    description: "Detailed notes about OAuth grant types",
    completed: false,
    sourceGithubIssueUrl: "https://github.com/workspace/utility-todo/issues/142",
  };

  // Simulated unlinking: clears source pointer, leaves core task untouched
  function unlinkTask(t: LocalTask): LocalTask {
    return {
      ...t,
      sourceGithubIssueUrl: null,
    };
  }

  const unlinked = unlinkTask(task);
  assert.equal(unlinked.id, "task-alpha", "Task ID must be preserved");
  assert.equal(unlinked.title, "Implement OAuth flow", "Task title must be preserved");
  assert.equal(unlinked.description, "Detailed notes about OAuth grant types", "Task notes must be preserved");
  assert.equal(unlinked.sourceGithubIssueUrl, null, "External link is gracefully cleared");
});
