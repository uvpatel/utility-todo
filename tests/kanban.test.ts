import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateKanbanMetrics,
  filterTasks,
  getTaskColumnId,
  groupTasksByColumn,
  isTaskDueToday,
  isTaskOverdue,
  sortTasks,
} from "../src/lib/kanban-utils";
import type { TodoWithDetails } from "../src/lib/actions/todos";

function createMockTask(overrides: Partial<TodoWithDetails> = {}): TodoWithDetails {
  return {
    id: overrides.id || "test-id",
    userId: "user-1",
    projectId: overrides.projectId || null,
    title: overrides.title || "Test Task",
    description: overrides.description || null,
    completed: overrides.completed ?? false,
    priority: overrides.priority || "medium",
    status: overrides.status || "todo",
    dueDate: overrides.dueDate || null,
    myDay: overrides.myDay ?? false,
    myDayDate: null,
    recurring: null,
    sortOrder: overrides.sortOrder ?? 0,
    sourceEmailId: null,
    sourceEmailSubject: null,
    sourceGithubIssueUrl: null,
    sourceGithubPrUrl: null,
    sourceGithubRepo: null,
    createdAt: overrides.createdAt || new Date("2026-01-01T10:00:00Z"),
    updatedAt: new Date("2026-01-01T10:00:00Z"),
    subtasks: overrides.subtasks || [],
    project: overrides.project || null,
    githubMapping: null,
  };
}

test("Kanban Utils — getTaskColumnId maps states correctly", () => {
  assert.equal(getTaskColumnId({ status: "backlog", completed: false }), "backlog");
  assert.equal(getTaskColumnId({ status: "todo", completed: false }), "todo");
  assert.equal(getTaskColumnId({ status: "in_progress", completed: false }), "in_progress");
  assert.equal(getTaskColumnId({ status: "in_review", completed: false }), "in_review");
  assert.equal(getTaskColumnId({ status: "done", completed: false }), "done");
  assert.equal(getTaskColumnId({ status: "completed", completed: false }), "done");
  // Completed flag overrides status
  assert.equal(getTaskColumnId({ status: "in_progress", completed: true }), "done");
});

test("Kanban Utils — isTaskOverdue and isTaskDueToday", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const today = new Date();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  assert.equal(isTaskOverdue(yesterday, false), true);
  assert.equal(isTaskOverdue(yesterday, true), false); // Completed tasks are not overdue
  assert.equal(isTaskOverdue(today, false), false);
  assert.equal(isTaskOverdue(tomorrow, false), false);

  assert.equal(isTaskDueToday(today, false), true);
  assert.equal(isTaskDueToday(yesterday, false), false);
  assert.equal(isTaskDueToday(tomorrow, false), false);
});

test("Kanban Utils — calculateKanbanMetrics computes accurate non-overlapping counts", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);

  const today = new Date();

  const tasks: TodoWithDetails[] = [
    createMockTask({ id: "1", status: "todo", completed: false, dueDate: yesterday }), // open, overdue
    createMockTask({ id: "2", status: "in_progress", completed: false, dueDate: today }), // open, in_progress, today
    createMockTask({ id: "3", status: "in_review", completed: false }), // open, in_review
    createMockTask({ id: "4", status: "backlog", completed: false }), // open
    createMockTask({ id: "5", status: "done", completed: true }), // completed
    createMockTask({ id: "6", status: "todo", completed: true }), // completed
  ];

  const metrics = calculateKanbanMetrics(tasks);

  assert.equal(metrics.totalTasks, 6);
  assert.equal(metrics.completedTasks, 2);
  assert.equal(metrics.openTasks, 4);
  assert.equal(metrics.inProgressTasks, 1);
  assert.equal(metrics.inReviewTasks, 1);
  assert.equal(metrics.overdueTasks, 1);
  assert.equal(metrics.todayTasks, 1);
  assert.equal(metrics.completionPercentage, 33); // 2/6 = 33%
});

test("Kanban Utils — filterTasks handles search, priority, project, and due date", () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const tasks: TodoWithDetails[] = [
    createMockTask({ id: "1", title: "Refactor API", description: "Use zod v4", priority: "urgent", projectId: "p1", dueDate: yesterday }),
    createMockTask({ id: "2", title: "Build UI", priority: "high", projectId: "p2" }),
    createMockTask({ id: "3", title: "Fix bug in search", priority: "low", projectId: "p1" }),
  ];

  // Search filter
  const searchResults = filterTasks(tasks, { searchQuery: "zod" });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, "1");

  // Priority filter
  const urgentResults = filterTasks(tasks, { priorityFilter: "urgent" });
  assert.equal(urgentResults.length, 1);
  assert.equal(urgentResults[0].id, "1");

  // Project filter
  const p1Results = filterTasks(tasks, { selectedProjectId: "p1" });
  assert.equal(p1Results.length, 2);

  // Overdue filter
  const overdueResults = filterTasks(tasks, { dueDateFilter: "overdue" });
  assert.equal(overdueResults.length, 1);
  assert.equal(overdueResults[0].id, "1");
});

test("Kanban Utils — sortTasks sorts by priority, dueDate, and title", () => {
  const d1 = new Date("2026-05-01");
  const d2 = new Date("2026-06-01");

  const tasks: TodoWithDetails[] = [
    createMockTask({ id: "1", title: "Bravo", priority: "low", dueDate: d2 }),
    createMockTask({ id: "2", title: "Alpha", priority: "urgent", dueDate: d1 }),
    createMockTask({ id: "3", title: "Charlie", priority: "high", dueDate: null }),
  ];

  // Priority sort (Urgent > High > Medium > Low)
  const byPriority = sortTasks(tasks, "priority");
  assert.deepEqual(byPriority.map((t) => t.id), ["2", "3", "1"]);

  // Due date sort
  const byDueDate = sortTasks(tasks, "dueDate");
  assert.deepEqual(byDueDate.map((t) => t.id), ["2", "1", "3"]);

  // Title sort
  const byTitle = sortTasks(tasks, "title");
  assert.deepEqual(byTitle.map((t) => t.id), ["2", "1", "3"]);
});

test("Kanban Utils — groupTasksByColumn groups tasks correctly", () => {
  const tasks: TodoWithDetails[] = [
    createMockTask({ id: "1", status: "backlog" }),
    createMockTask({ id: "2", status: "todo" }),
    createMockTask({ id: "3", status: "in_progress" }),
    createMockTask({ id: "4", status: "in_review" }),
    createMockTask({ id: "5", status: "done" }),
  ];

  const grouped = groupTasksByColumn(tasks);
  assert.equal(grouped.backlog.length, 1);
  assert.equal(grouped.todo.length, 1);
  assert.equal(grouped.in_progress.length, 1);
  assert.equal(grouped.in_review.length, 1);
  assert.equal(grouped.done.length, 1);
});
