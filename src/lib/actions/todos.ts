"use server";

import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireAuth } from "@/lib/auth-guard";
import { githubIssueMappings, projects, subtasks, todos } from "@/schema/schema";
import { syncTaskToIssue } from "@/lib/integrations/github-sync";
import {
  createSubtaskSchema,
  createTodoSchema,
  updateTodoSchema,
  type CreateSubtaskInput,
  type CreateTodoInput,
  type UpdateTodoInput,
} from "@/lib/validations/todo";

export type TodoWithDetails = typeof todos.$inferSelect & {
  project?: typeof projects.$inferSelect | null;
  subtasks: (typeof subtasks.$inferSelect)[];
  githubMapping?: typeof githubIssueMappings.$inferSelect | null;
};

/**
 * Get all todos for the authenticated user with optional filtering
 */
export async function getTodos(filters?: {
  status?: string;
  projectId?: string;
  myDay?: boolean;
  priority?: string;
  search?: string;
}) {
  const session = await requireAuth();
  const userId = session.user.id;

  const conditions = [eq(todos.userId, userId)];

  if (filters?.projectId) {
    conditions.push(eq(todos.projectId, filters.projectId));
  }

  if (filters?.myDay) {
    conditions.push(eq(todos.myDay, true));
  }

  if (filters?.priority && filters.priority !== "all") {
    conditions.push(eq(todos.priority, filters.priority));
  }

  if (filters?.status && filters.status !== "all") {
    if (filters.status === "completed") {
      conditions.push(eq(todos.completed, true));
    } else if (filters.status === "active") {
      conditions.push(eq(todos.completed, false));
    } else {
      conditions.push(eq(todos.status, filters.status));
    }
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const searchPattern = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(todos.title, searchPattern),
        ilike(todos.description, searchPattern)
      )!
    );
  }

  const userTodos = await db.query.todos.findMany({
    where: and(...conditions),
    with: {
      project: true,
      subtasks: {
        orderBy: (subtask, { asc }) => [asc(subtask.sortOrder), asc(subtask.createdAt)],
      },
      githubMapping: true,
    },
    orderBy: [asc(todos.sortOrder), desc(todos.createdAt)],
  });

  return userTodos as TodoWithDetails[];
}

/**
 * Create a new task in PostgreSQL
 */
export async function createTodo(input: CreateTodoInput) {
  const session = await requireAuth();
  const userId = session.user.id;
  const validated = createTodoSchema.parse(input);

  const newId = crypto.randomUUID();
  const todayStr = new Date().toISOString().split("T")[0];

  const [created] = await db
    .insert(todos)
    .values({
      id: newId,
      userId,
      title: validated.title,
      description: validated.description || null,
      priority: validated.priority,
      status: validated.status,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
      projectId: validated.projectId || null,
      myDay: validated.myDay ?? false,
      myDayDate: validated.myDay ? todayStr : null,
      recurring: validated.recurring && validated.recurring !== "none" ? validated.recurring : null,
      sourceEmailId: validated.sourceEmailId || null,
      sourceEmailSubject: validated.sourceEmailSubject || null,
      completed: false,
    })
    .returning();

  revalidatePath("/todo");
  revalidatePath("/dashboard");
  return created;
}

/**
 * Calculate the next due date for a recurring task
 */
function getNextRecurringDate(baseDate: Date, frequency: string): Date {
  const next = new Date(baseDate);
  if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (frequency === "weekdays") {
    do {
      next.setDate(next.getDate() + 1);
    } while (next.getDay() === 0 || next.getDay() === 6);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
  } else if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

/**
 * Toggle task completion with recurring task handling
 */
export async function toggleTodo(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const existing = await db.query.todos.findFirst({
    where: and(eq(todos.id, id), eq(todos.userId, userId)),
  });

  if (!existing) {
    throw new Error("Task not found or unauthorized");
  }

  const nextCompleted = !existing.completed;
  const nextStatus = nextCompleted ? "completed" : "todo";

  const [updated] = await db
    .update(todos)
    .set({
      completed: nextCompleted,
      status: nextStatus,
      updatedAt: new Date(),
    })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)))
    .returning();

  // If a recurring task was completed, spawn the next occurrence
  if (nextCompleted && existing.recurring && existing.recurring !== "none") {
    const baseDate = existing.dueDate ? new Date(existing.dueDate) : new Date();
    const nextDueDate = getNextRecurringDate(baseDate, existing.recurring);

    await db.insert(todos).values({
      id: crypto.randomUUID(),
      userId,
      title: existing.title,
      description: existing.description,
      priority: existing.priority,
      status: "todo",
      completed: false,
      dueDate: nextDueDate,
      projectId: existing.projectId,
      myDay: false,
      recurring: existing.recurring,
    });
  }

  // Synchronize status change with linked GitHub issue if mapped
  try {
    const [mapping] = await db
      .select()
      .from(githubIssueMappings)
      .where(
        and(
          eq(githubIssueMappings.userId, userId),
          eq(githubIssueMappings.todoId, id)
        )
      )
      .limit(1);

    if (mapping) {
      await syncTaskToIssue(mapping.id, updated, { origin: "user" });
    }
  } catch (syncErr) {
    console.warn("GitHub status sync non-fatal error:", syncErr);
  }

  revalidatePath("/todo");
  revalidatePath("/dashboard");
  return updated;
}

/**
 * Update an existing task
 */
export async function updateTodo(input: UpdateTodoInput) {
  const session = await requireAuth();
  const userId = session.user.id;
  const validated = updateTodoSchema.parse(input);

  const updateData: Partial<typeof todos.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (validated.title !== undefined) updateData.title = validated.title;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.priority !== undefined) updateData.priority = validated.priority;
  if (validated.status !== undefined) {
    updateData.status = validated.status;
    if (validated.status === "done" || validated.status === "completed") {
      updateData.completed = true;
    } else if (validated.completed === undefined) {
      updateData.completed = false;
    }
  }
  if (validated.completed !== undefined) {
    updateData.completed = validated.completed;
    if (validated.completed) {
      updateData.status = validated.status || "done";
    } else if (validated.status === undefined) {
      updateData.status = "todo";
    }
  }
  if (validated.dueDate !== undefined) {
    updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null;
  }
  if (validated.projectId !== undefined) updateData.projectId = validated.projectId;
  if (validated.myDay !== undefined) {
    updateData.myDay = validated.myDay;
    updateData.myDayDate = validated.myDay ? new Date().toISOString().split("T")[0] : null;
  }
  if (validated.recurring !== undefined) {
    updateData.recurring = validated.recurring && validated.recurring !== "none" ? validated.recurring : null;
  }
  if (validated.sortOrder !== undefined) updateData.sortOrder = validated.sortOrder;
  if (validated.sourceEmailId !== undefined) updateData.sourceEmailId = validated.sourceEmailId;
  if (validated.sourceEmailSubject !== undefined) updateData.sourceEmailSubject = validated.sourceEmailSubject;

  const [updated] = await db
    .update(todos)
    .set(updateData)
    .where(and(eq(todos.id, validated.id), eq(todos.userId, userId)))
    .returning();

  // Synchronize field changes (title, description, status) with linked GitHub issue if mapped
  try {
    const [mapping] = await db
      .select()
      .from(githubIssueMappings)
      .where(
        and(
          eq(githubIssueMappings.userId, userId),
          eq(githubIssueMappings.todoId, validated.id)
        )
      )
      .limit(1);

    if (mapping) {
      await syncTaskToIssue(mapping.id, updated, { origin: "user" });
    }
  } catch (syncErr) {
    console.warn("GitHub field sync non-fatal error:", syncErr);
  }

  revalidatePath("/todo");
  revalidatePath("/dashboard");
  return updated;
}

/**
 * Duplicate an existing task with its subtasks
 */
export async function duplicateTodo(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const original = await db.query.todos.findFirst({
    where: and(eq(todos.id, id), eq(todos.userId, userId)),
    with: {
      subtasks: true,
    },
  });

  if (!original) {
    throw new Error("Task not found or unauthorized");
  }

  const newId = crypto.randomUUID();
  await db.insert(todos).values({
    id: newId,
    userId,
    title: `${original.title} (Copy)`,
    description: original.description,
    priority: original.priority,
    status: original.status === "done" || original.status === "completed" ? "todo" : original.status,
    completed: false,
    dueDate: original.dueDate,
    projectId: original.projectId,
    myDay: original.myDay,
    recurring: original.recurring,
    sortOrder: (original.sortOrder ?? 0) - 1,
  });

  if (original.subtasks && original.subtasks.length > 0) {
    for (const sub of original.subtasks) {
      await db.insert(subtasks).values({
        id: crypto.randomUUID(),
        todoId: newId,
        userId,
        title: sub.title,
        completed: false,
        sortOrder: sub.sortOrder,
      });
    }
  }

  revalidatePath("/todo");
  revalidatePath("/dashboard");

  const fullDuplicated = await db.query.todos.findFirst({
    where: and(eq(todos.id, newId), eq(todos.userId, userId)),
    with: {
      project: true,
      subtasks: {
        orderBy: (subtask, { asc }) => [asc(subtask.sortOrder), asc(subtask.createdAt)],
      },
    },
  });

  return fullDuplicated as TodoWithDetails;
}

/**
 * Delete a single task
 */
export async function deleteTodo(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)));

  revalidatePath("/todo");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Clear all completed tasks for the current user
 */
export async function clearCompletedTodos() {
  const session = await requireAuth();
  const userId = session.user.id;

  await db
    .delete(todos)
    .where(and(eq(todos.userId, userId), eq(todos.completed, true)));

  revalidatePath("/todo");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Subtasks management
 */
export async function createSubtask(input: CreateSubtaskInput) {
  const session = await requireAuth();
  const userId = session.user.id;
  const validated = createSubtaskSchema.parse(input);

  // Verify task ownership
  const task = await db.query.todos.findFirst({
    where: and(eq(todos.id, validated.todoId), eq(todos.userId, userId)),
  });

  if (!task) {
    throw new Error("Task not found or unauthorized");
  }

  const [created] = await db
    .insert(subtasks)
    .values({
      id: crypto.randomUUID(),
      todoId: validated.todoId,
      userId,
      title: validated.title,
      completed: false,
    })
    .returning();

  revalidatePath("/todo");
  return created;
}

export async function toggleSubtask(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const existing = await db.query.subtasks.findFirst({
    where: and(eq(subtasks.id, id), eq(subtasks.userId, userId)),
  });

  if (!existing) {
    throw new Error("Subtask not found or unauthorized");
  }

  const [updated] = await db
    .update(subtasks)
    .set({
      completed: !existing.completed,
    })
    .where(and(eq(subtasks.id, id), eq(subtasks.userId, userId)))
    .returning();

  revalidatePath("/todo");
  return updated;
}

export async function deleteSubtask(id: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  await db
    .delete(subtasks)
    .where(and(eq(subtasks.id, id), eq(subtasks.userId, userId)));

  revalidatePath("/todo");
  return { success: true };
}

/**
 * AI-powered task breakdown: analyzes task title and generates actionable subtasks
 */
export async function generateSubtasksWithAI(todoId: string) {
  const session = await requireAuth();
  const userId = session.user.id;

  const task = await db.query.todos.findFirst({
    where: and(eq(todos.id, todoId), eq(todos.userId, userId)),
    with: { subtasks: true },
  });

  if (!task) {
    throw new Error("Task not found or unauthorized");
  }

  let steps: string[] = [];

  // If GEMINI_API_KEY is available, call Gemini API
  if (process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Break down the following task into 3 to 4 concise, actionable checklist steps (one step per line, no numbering or bullets):\nTask: ${task.title}\nDescription: ${task.description || "N/A"}`,
                  },
                ],
              },
            ],
          }),
        }
      );
      if (response.ok) {
        const result = await response.json();
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          steps = text
            .split("\n")
            .map((s: string) => s.replace(/^[-*0-9.)\s]+/, "").trim())
            .filter((s: string) => s.length > 2);
        }
      }
    } catch {
      // Fall through to deterministic smart breakdown
    }
  }

  // Smart contextual breakdown fallback
  if (steps.length === 0) {
    const t = task.title.toLowerCase();
    if (t.includes("design") || t.includes("ui") || t.includes("ux")) {
      steps = [
        "Audit existing user flow and identify pain points",
        "Create wireframes and layout compositions",
        "Apply design system tokens and color palette",
        "Review with stakeholders and test responsive states",
      ];
    } else if (t.includes("bug") || t.includes("fix") || t.includes("issue")) {
      steps = [
        "Reproduce the bug locally with minimal test case",
        "Inspect stack trace and identify root cause",
        "Implement code fix and verify regression safety",
        "Add automated test and deploy to staging",
      ];
    } else if (t.includes("feature") || t.includes("implement") || t.includes("build") || t.includes("create")) {
      steps = [
        "Define technical requirements and data models",
        "Build backend endpoints and database schemas",
        "Construct UI components and hook up state management",
        "Perform end-to-end testing and verify edge cases",
      ];
    } else if (t.includes("deploy") || t.includes("release") || t.includes("ship") || t.includes("launch")) {
      steps = [
        "Run production linting and build checks",
        "Verify environment variables and secret configurations",
        "Deploy build to production environment",
        "Execute post-deployment smoke tests and monitor logs",
      ];
    } else if (t.includes("test") || t.includes("verify") || t.includes("audit")) {
      steps = [
        "Prepare test scenarios and acceptance criteria",
        "Execute automated test suite across target browsers",
        "Log discrepancies and performance bottlenecks",
        "Validate security and user access permissions",
      ];
    } else {
      steps = [
        `Research requirements and outline scope for "${task.title}"`,
        "Draft the initial implementation and key milestones",
        "Review progress and refine edge cases",
        "Complete final verification and mark as finished",
      ];
    }
  }

  const existingCount = task.subtasks.length;
  const createdSubtasks = [];

  for (let i = 0; i < steps.length; i++) {
    const [subtask] = await db
      .insert(subtasks)
      .values({
        id: crypto.randomUUID(),
        todoId: task.id,
        userId,
        title: steps[i],
        completed: false,
        sortOrder: existingCount + i,
      })
      .returning();
    createdSubtasks.push(subtask);
  }

  revalidatePath("/todo");
  return createdSubtasks;
}

/**
 * Persist reordered task order
 */
export async function reorderTasks(taskIds: string[]) {
  const session = await requireAuth();
  const userId = session.user.id;

  for (let i = 0; i < taskIds.length; i++) {
    await db
      .update(todos)
      .set({ sortOrder: i })
      .where(and(eq(todos.id, taskIds[i]), eq(todos.userId, userId)));
  }

  revalidatePath("/todo");
  return { success: true };
}

/**
 * Get real metrics and analytics for the authenticated user
 */
export async function getDashboardStats() {
  const session = await requireAuth();
  const userId = session.user.id;

  const allTodos = await db.query.todos.findMany({
    where: eq(todos.userId, userId),
    with: {
      project: true,
      subtasks: true,
    },
    orderBy: [asc(todos.sortOrder), desc(todos.createdAt)],
  });

  const total = allTodos.length;
  const completedList = allTodos.filter((t) => t.completed);
  const activeList = allTodos.filter((t) => !t.completed);

  const completedCount = completedList.length;
  const activeCount = activeList.length;
  const urgentCount = activeList.filter((t) => t.priority === "urgent" || t.priority === "high").length;
  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Calculate completed this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const completedThisWeek = completedList.filter(
    (t) => new Date(t.updatedAt) >= oneWeekAgo
  ).length;

  // Approximate focus hours: 45 min per completed task, 15 min per active task
  const focusHours = ((completedCount * 0.75) + (activeCount * 0.25)).toFixed(1);

  // Group task creation and completions over the last 14 days for the chart
  const daysMap = new Map<string, { created: number; completed: number }>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    daysMap.set(dateStr, { created: 0, completed: 0 });
  }

  allTodos.forEach((task) => {
    const createdDate = new Date(task.createdAt).toISOString().split("T")[0];
    if (daysMap.has(createdDate)) {
      daysMap.get(createdDate)!.created += 1;
    }
    if (task.completed) {
      const updatedDate = new Date(task.updatedAt).toISOString().split("T")[0];
      if (daysMap.has(updatedDate)) {
        daysMap.get(updatedDate)!.completed += 1;
      }
    }
  });

  const chartData = Array.from(daysMap.entries()).map(([date, counts]) => ({
    date,
    created: counts.created,
    completed: counts.completed,
  }));

  return {
    total,
    activeCount,
    completedCount,
    completedThisWeek,
    urgentCount,
    completionRate,
    focusHours,
    chartData,
    recentTasks: allTodos.slice(0, 10),
  };
}
