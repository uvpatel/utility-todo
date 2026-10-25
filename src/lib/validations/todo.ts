import { z } from "zod";

export const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);
export const statusEnum = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "completed",
  "archived",
]);
export const recurringEnum = z.enum(["none", "daily", "weekdays", "weekly", "monthly"]);

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(500),
  description: z.string().optional().nullable(),
  priority: priorityEnum.default("medium"),
  status: statusEnum.default("todo"),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  myDay: z.boolean().optional().default(false),
  recurring: recurringEnum.optional().nullable(),
  sourceEmailId: z.string().optional().nullable(),
  sourceEmailSubject: z.string().optional().nullable(),
});

export const updateTodoSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().optional().nullable(),
  completed: z.boolean().optional(),
  priority: priorityEnum.optional(),
  status: statusEnum.optional(),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  myDay: z.boolean().optional(),
  myDayDate: z.string().optional().nullable(),
  recurring: recurringEnum.optional().nullable(),
  sortOrder: z.number().int().optional(),
  sourceEmailId: z.string().optional().nullable(),
  sourceEmailSubject: z.string().optional().nullable(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required").max(100),
  color: z.string().default("#0075de"),
});

export const createSubtaskSchema = z.object({
  todoId: z.string().min(1),
  title: z.string().trim().min(1, "Subtask title is required").max(255),
});

export type Priority = z.infer<typeof priorityEnum>;
export type TaskStatus = z.infer<typeof statusEnum>;
export type RecurringFrequency = z.infer<typeof recurringEnum>;
export type CreateTodoInput = z.input<typeof createTodoSchema>;
export type UpdateTodoInput = z.input<typeof updateTodoSchema>;
export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type CreateSubtaskInput = z.input<typeof createSubtaskSchema>;
