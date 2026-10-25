import type { TodoWithDetails } from "@/lib/actions/todos";

export type KanbanColumnId = "backlog" | "todo" | "in_progress" | "in_review" | "done";

export interface KanbanColumnConfig {
  id: KanbanColumnId;
  title: string;
  status: string;
  dotColor: string;
  badgeColor: string;
  borderColor: string;
  headerAccent: string;
}

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id: "backlog",
    title: "Backlog",
    status: "backlog",
    dotColor: "bg-zinc-400 dark:bg-zinc-500",
    badgeColor: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-400 dark:border-zinc-800",
    borderColor: "hover:border-zinc-300 dark:hover:border-zinc-700",
    headerAccent: "text-zinc-500 dark:text-zinc-400",
  },
  {
    id: "todo",
    title: "To Do",
    status: "todo",
    dotColor: "bg-sky-500 dark:bg-sky-400",
    badgeColor: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
    borderColor: "hover:border-sky-300 dark:hover:border-sky-700",
    headerAccent: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "in_progress",
    title: "In Progress",
    status: "in_progress",
    dotColor: "bg-amber-500 dark:bg-amber-400",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    borderColor: "hover:border-amber-300 dark:hover:border-amber-700",
    headerAccent: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "in_review",
    title: "In Review",
    status: "in_review",
    dotColor: "bg-purple-500 dark:bg-purple-400",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    borderColor: "hover:border-purple-300 dark:hover:border-purple-700",
    headerAccent: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "done",
    title: "Done",
    status: "done",
    dotColor: "bg-emerald-500 dark:bg-emerald-400",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    borderColor: "hover:border-emerald-300 dark:hover:border-emerald-700",
    headerAccent: "text-emerald-600 dark:text-emerald-400",
  },
];

export type SortOption = "manual" | "priority" | "dueDate" | "createdAt" | "title";
export type DueDateFilterOption = "all" | "overdue" | "today" | "upcoming" | "no-date";
export type CardDensity = "compact" | "comfortable";

export interface KanbanBoardPreferences {
  cardDensity: CardDensity;
  showProgressSummary: boolean;
  showDescriptionPreview: boolean;
  showSubtasksPreview: boolean;
  hideCompletedColumn: boolean;
  collapsedColumns: Record<string, boolean>;
  wipLimits: Record<string, number>;
}

export const DEFAULT_KANBAN_PREFERENCES: KanbanBoardPreferences = {
  cardDensity: "comfortable",
  showProgressSummary: true,
  showDescriptionPreview: true,
  showSubtasksPreview: true,
  hideCompletedColumn: false,
  collapsedColumns: {},
  wipLimits: {
    in_progress: 5,
    in_review: 4,
  },
};

/**
 * Determine which Kanban column a task belongs to
 */
export function getTaskColumnId(task: Pick<TodoWithDetails, "status" | "completed">): KanbanColumnId {
  if (task.completed || task.status === "done" || task.status === "completed") {
    return "done";
  }
  if (task.status === "backlog") return "backlog";
  if (task.status === "in_progress") return "in_progress";
  if (task.status === "in_review") return "in_review";
  return "todo";
}

/**
 * Check if a task is overdue (strictly before today, not completed)
 */
export function isTaskOverdue(dueDate?: Date | string | null, isCompleted = false): boolean {
  if (!dueDate || isCompleted) return false;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  return target.getTime() < today.getTime();
}

/**
 * Check if a task is due today
 */
export function isTaskDueToday(dueDate?: Date | string | null, isCompleted = false): boolean {
  if (!dueDate || isCompleted) return false;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  return target.getTime() === today.getTime();
}

/**
 * Check if a task is due in the future (after today)
 */
export function isTaskUpcoming(dueDate?: Date | string | null, isCompleted = false): boolean {
  if (!dueDate || isCompleted) return false;
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  return target.getTime() > today.getTime();
}

/**
 * Priority order rank for sorting
 */
const PRIORITY_RANK: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Sort tasks according to selected sorting option
 */
export function sortTasks<T extends TodoWithDetails>(tasks: T[], sortOption: SortOption): T[] {
  if (sortOption === "manual") {
    return [...tasks].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  return [...tasks].sort((a, b) => {
    if (sortOption === "priority") {
      const rankA = PRIORITY_RANK[a.priority] || 0;
      const rankB = PRIORITY_RANK[b.priority] || 0;
      if (rankB !== rankA) return rankB - rankA;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }

    if (sortOption === "dueDate") {
      if (!a.dueDate && !b.dueDate) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      const timeDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (timeDiff !== 0) return timeDiff;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }

    if (sortOption === "createdAt") {
      const timeDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (timeDiff !== 0) return timeDiff;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }

    if (sortOption === "title") {
      const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      if (cmp !== 0) return cmp;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }

    return 0;
  });
}

/**
 * Filter tasks by search query, priority, project, and due date
 */
export function filterTasks<T extends TodoWithDetails>(
  tasks: T[],
  filters: {
    searchQuery?: string;
    priorityFilter?: string;
    selectedProjectId?: string | null;
    dueDateFilter?: DueDateFilterOption;
    columnStatusFilter?: string;
  }
): T[] {
  const {
    searchQuery = "",
    priorityFilter = "all",
    selectedProjectId = null,
    dueDateFilter = "all",
    columnStatusFilter = "all",
  } = filters;

  const query = searchQuery.trim().toLowerCase();

  return tasks.filter((task) => {
    // Project filter
    if (selectedProjectId && task.projectId !== selectedProjectId) {
      return false;
    }

    // Column status filter
    if (columnStatusFilter !== "all") {
      const colId = getTaskColumnId(task);
      if (colId !== columnStatusFilter) return false;
    }

    // Priority filter
    if (priorityFilter !== "all" && task.priority !== priorityFilter) {
      return false;
    }

    // Due date filter
    if (dueDateFilter === "overdue" && !isTaskOverdue(task.dueDate, task.completed)) {
      return false;
    }
    if (dueDateFilter === "today" && !isTaskDueToday(task.dueDate, task.completed)) {
      return false;
    }
    if (dueDateFilter === "upcoming" && !isTaskUpcoming(task.dueDate, task.completed)) {
      return false;
    }
    if (dueDateFilter === "no-date" && task.dueDate !== null && task.dueDate !== undefined) {
      return false;
    }

    // Search query (title and description)
    if (query) {
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchDesc = task.description?.toLowerCase().includes(query) ?? false;
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });
}

export interface KanbanProgressMetrics {
  totalTasks: number;
  openTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayTasks: number;
  completionPercentage: number;
}

/**
 * Calculate progress and productivity metrics strictly from task collection
 */
export function calculateKanbanMetrics(tasks: TodoWithDetails[]): KanbanProgressMetrics {
  let openTasks = 0;
  let inProgressTasks = 0;
  let inReviewTasks = 0;
  let completedTasks = 0;
  let overdueTasks = 0;
  let todayTasks = 0;

  for (const task of tasks) {
    const isDone = task.completed || task.status === "done" || task.status === "completed";

    if (isDone) {
      completedTasks += 1;
    } else {
      openTasks += 1;

      if (task.status === "in_progress") {
        inProgressTasks += 1;
      } else if (task.status === "in_review") {
        inReviewTasks += 1;
      }

      if (isTaskOverdue(task.dueDate, false)) {
        overdueTasks += 1;
      } else if (isTaskDueToday(task.dueDate, false)) {
        todayTasks += 1;
      }
    }
  }

  const totalTasks = tasks.length;
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    totalTasks,
    openTasks,
    inProgressTasks,
    inReviewTasks,
    completedTasks,
    overdueTasks,
    todayTasks,
    completionPercentage,
  };
}

/**
 * Group tasks into columns with given sorting applied
 */
export function groupTasksByColumn(
  tasks: TodoWithDetails[],
  sortOption: SortOption = "manual"
): Record<KanbanColumnId, TodoWithDetails[]> {
  const grouped: Record<KanbanColumnId, TodoWithDetails[]> = {
    backlog: [],
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };

  for (const task of tasks) {
    const colId = getTaskColumnId(task);
    grouped[colId].push(task);
  }

  for (const colId of Object.keys(grouped) as KanbanColumnId[]) {
    grouped[colId] = sortTasks(grouped[colId], sortOption);
  }

  return grouped;
}
