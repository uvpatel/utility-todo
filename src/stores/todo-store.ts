"use client";

import { create } from "zustand";
import type { TodoWithDetails } from "@/lib/actions/todos";
import type { projects as projectsTable } from "@/schema/schema";
import * as actions from "@/lib/actions/todos";
import * as projectActions from "@/lib/actions/projects";
import { toast } from "sonner";
import type { Priority, RecurringFrequency, TaskStatus } from "@/lib/validations/todo";
import type { CardDensity, DueDateFilterOption, SortOption } from "@/lib/kanban-utils";

export type WorkspaceView = "inbox" | "my-day" | "upcoming" | "completed" | "kanban" | "all";
export type ViewMode = "list" | "kanban";

export type ProjectItem = typeof projectsTable.$inferSelect;

function getStoredPreferences() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("utility_todo_kanban_prefs");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistPreference(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredPreferences() || {};
    existing[key] = value;
    localStorage.setItem("utility_todo_kanban_prefs", JSON.stringify(existing));
  } catch {
    // ignore storage errors
  }
}

const saved = getStoredPreferences();

interface TodoStoreState {
  tasks: TodoWithDetails[];
  projects: ProjectItem[];
  isLoading: boolean;
  activeView: WorkspaceView;
  viewMode: ViewMode;
  selectedProjectId: string | null;
  statusFilter: "all" | "active" | "completed";
  priorityFilter: "all" | "low" | "medium" | "high" | "urgent";
  dueDateFilter: DueDateFilterOption;
  columnStatusFilter: string;
  sortOption: SortOption;
  searchQuery: string;
  selectedTaskId: string | null;
  isQuickAddOpen: boolean;

  // Board Customizations
  cardDensity: CardDensity;
  showProgressSummary: boolean;
  showDescriptionPreview: boolean;
  showSubtasksPreview: boolean;
  hideCompletedColumn: boolean;
  collapsedColumns: Record<string, boolean>;
  wipLimits: Record<string, number>;

  // Create Task Dialog State
  isCreateDialogOpen: boolean;
  createDialogDefaultStatus: string;

  // Actions
  setTasks: (tasks: TodoWithDetails[]) => void;
  setProjects: (projects: ProjectItem[]) => void;
  setActiveView: (view: WorkspaceView) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedProjectId: (projectId: string | null) => void;
  setStatusFilter: (filter: "all" | "active" | "completed") => void;
  setPriorityFilter: (filter: "all" | "low" | "medium" | "high" | "urgent") => void;
  setDueDateFilter: (filter: DueDateFilterOption) => void;
  setColumnStatusFilter: (status: string) => void;
  setSortOption: (sort: SortOption) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTaskId: (id: string | null) => void;
  setIsQuickAddOpen: (open: boolean) => void;

  // Customization actions
  setCardDensity: (density: CardDensity) => void;
  setShowProgressSummary: (show: boolean) => void;
  setShowDescriptionPreview: (show: boolean) => void;
  setShowSubtasksPreview: (show: boolean) => void;
  setHideCompletedColumn: (hide: boolean) => void;
  toggleColumnCollapse: (columnId: string) => void;
  setColumnWipLimit: (columnId: string, limit: number) => void;
  collapseAllColumns: (collapsed: boolean) => void;
  resetFilters: () => void;

  // Dialog actions
  openCreateDialog: (defaultStatus?: string) => void;
  closeCreateDialog: () => void;

  // Server-synced task operations
  fetchTasks: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  createTask: (title: string, options?: Partial<actions.TodoWithDetails>) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  updateTask: (input: { id: string } & Partial<actions.TodoWithDetails>) => Promise<void>;
  duplicateTask: (id: string) => Promise<void>;
  moveTaskStatus: (id: string, newStatus: string) => Promise<void>;
  moveTaskStatusAndOrder: (
    id: string,
    newStatus: string,
    reorderedTaskIds: string[]
  ) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearCompleted: () => Promise<void>;

  // Subtask operations
  addSubtask: (todoId: string, title: string) => Promise<void>;
  toggleSubtask: (subtaskId: string, todoId: string) => Promise<void>;
  deleteSubtask: (subtaskId: string, todoId: string) => Promise<void>;
  generateAIBreakdown: (todoId: string) => Promise<void>;

  // Project operations
  createProject: (name: string, color?: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
}

export const useTodoStore = create<TodoStoreState>((set, get) => ({
  tasks: [],
  projects: [],
  isLoading: false,
  activeView: "inbox",
  viewMode: "list",
  selectedProjectId: null,
  statusFilter: "all",
  priorityFilter: "all",
  dueDateFilter: "all",
  columnStatusFilter: "all",
  sortOption: "manual",
  searchQuery: "",
  selectedTaskId: null,
  isQuickAddOpen: false,

  // Customization state with localStorage hydration
  cardDensity: (saved?.cardDensity as CardDensity) || "comfortable",
  showProgressSummary: saved?.showProgressSummary ?? true,
  showDescriptionPreview: saved?.showDescriptionPreview ?? true,
  showSubtasksPreview: saved?.showSubtasksPreview ?? true,
  hideCompletedColumn: saved?.hideCompletedColumn ?? false,
  collapsedColumns: saved?.collapsedColumns || {},
  wipLimits: saved?.wipLimits || {
    in_progress: 5,
    in_review: 4,
  },

  isCreateDialogOpen: false,
  createDialogDefaultStatus: "todo",

  setTasks: (tasks) => set({ tasks }),
  setProjects: (projects) => set({ projects }),
  setActiveView: (activeView) => {
    set({ activeView, selectedProjectId: null });
  },
  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedProjectId: (selectedProjectId) => {
    set({ selectedProjectId, activeView: "inbox" });
  },
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  setDueDateFilter: (dueDateFilter) => set({ dueDateFilter }),
  setColumnStatusFilter: (columnStatusFilter) => set({ columnStatusFilter }),
  setSortOption: (sortOption) => set({ sortOption }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
  setIsQuickAddOpen: (isQuickAddOpen) => set({ isQuickAddOpen }),

  setCardDensity: (cardDensity) => {
    set({ cardDensity });
    persistPreference("cardDensity", cardDensity);
  },
  setShowProgressSummary: (showProgressSummary) => {
    set({ showProgressSummary });
    persistPreference("showProgressSummary", showProgressSummary);
  },
  setShowDescriptionPreview: (showDescriptionPreview) => {
    set({ showDescriptionPreview });
    persistPreference("showDescriptionPreview", showDescriptionPreview);
  },
  setShowSubtasksPreview: (showSubtasksPreview) => {
    set({ showSubtasksPreview });
    persistPreference("showSubtasksPreview", showSubtasksPreview);
  },
  setHideCompletedColumn: (hideCompletedColumn) => {
    set({ hideCompletedColumn });
    persistPreference("hideCompletedColumn", hideCompletedColumn);
  },
  toggleColumnCollapse: (columnId) => {
    const current = get().collapsedColumns;
    const next = { ...current, [columnId]: !current[columnId] };
    set({ collapsedColumns: next });
    persistPreference("collapsedColumns", next);
  },
  setColumnWipLimit: (columnId, limit) => {
    const current = get().wipLimits;
    const next = { ...current, [columnId]: limit };
    set({ wipLimits: next });
    persistPreference("wipLimits", next);
  },
  collapseAllColumns: (collapsed) => {
    const next: Record<string, boolean> = {
      backlog: collapsed,
      todo: collapsed,
      in_progress: collapsed,
      in_review: collapsed,
      done: collapsed,
    };
    set({ collapsedColumns: next });
    persistPreference("collapsedColumns", next);
  },
  resetFilters: () => {
    set({
      searchQuery: "",
      statusFilter: "all",
      priorityFilter: "all",
      dueDateFilter: "all",
      columnStatusFilter: "all",
      selectedProjectId: null,
      sortOption: "manual",
    });
  },

  openCreateDialog: (defaultStatus = "todo") => {
    set({ isCreateDialogOpen: true, createDialogDefaultStatus: defaultStatus });
  },
  closeCreateDialog: () => {
    set({ isCreateDialogOpen: false });
  },

  fetchTasks: async () => {
    try {
      set({ isLoading: true });
      const tasks = await actions.getTodos();
      set({ tasks, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProjects: async () => {
    try {
      const projects = await projectActions.getProjects();
      set({ projects });
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  },

  createTask: async (title: string, options = {}) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const { activeView, selectedProjectId } = get();
    const isMyDay = activeView === "my-day" || !!options.myDay;
    const projectId = selectedProjectId || options.projectId || null;
    const status = (options.status as TaskStatus) || "todo";
    const isCompleted = status === "done" || status === "completed";

    try {
      const created = await actions.createTodo({
        title: trimmed,
        description: options.description || null,
        priority: (options.priority as Priority) || "medium",
        status,
        dueDate: options.dueDate ? new Date(options.dueDate).toISOString() : null,
        projectId,
        myDay: isMyDay,
        recurring: (options.recurring as RecurringFrequency) || null,
      });

      const fullTask: TodoWithDetails = {
        ...created,
        completed: isCompleted,
        status,
        project: get().projects.find((p) => p.id === created.projectId) || null,
        subtasks: [],
      };

      set((state) => ({
        tasks: [fullTask, ...state.tasks],
      }));
      toast.success("Task added");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add task");
    }
  },

  toggleTask: async (id: string) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              status: !task.completed ? "completed" : "todo",
            }
          : task
      ),
    }));

    try {
      await actions.toggleTodo(id);
      const refreshed = await actions.getTodos();
      set({ tasks: refreshed });
    } catch {
      set({ tasks: previousTasks });
      toast.error("Failed to update task");
    }
  },

  updateTask: async (input) => {
    const previousTasks = get().tasks;

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === input.id ? { ...t, ...input } : t)),
    }));

    try {
      await actions.updateTodo({
        id: input.id,
        title: input.title,
        description: input.description,
        completed: input.completed,
        priority: input.priority as Priority | undefined,
        status: input.status as TaskStatus | undefined,
        dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : null,
        projectId: input.projectId,
        myDay: input.myDay,
        recurring: input.recurring as RecurringFrequency | undefined,
      });
      toast.success("Task updated");
    } catch {
      set({ tasks: previousTasks });
      toast.error("Failed to update task");
    }
  },

  duplicateTask: async (id: string) => {
    try {
      const duplicated = await actions.duplicateTodo(id);
      set((state) => ({
        tasks: [duplicated, ...state.tasks],
      }));
      toast.success("Task duplicated");
    } catch {
      toast.error("Failed to duplicate task");
    }
  },

  moveTaskStatus: async (id: string, newStatus: string) => {
    const previousTasks = get().tasks;
    const isCompleted = newStatus === "done" || newStatus === "completed";

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              completed: isCompleted,
            }
          : t
      ),
    }));

    try {
      await actions.updateTodo({
        id,
        status: newStatus as TaskStatus,
        completed: isCompleted,
      });
    } catch {
      set({ tasks: previousTasks });
      toast.error("Failed to update task status");
    }
  },

  moveTaskStatusAndOrder: async (
    id: string,
    newStatus: string,
    reorderedTaskIds: string[]
  ) => {
    const previousTasks = get().tasks;
    const isCompleted = newStatus === "done" || newStatus === "completed";

    // Map each task to updated status and sortOrder
    const sortOrderMap = new Map<string, number>();
    reorderedTaskIds.forEach((taskId, index) => {
      sortOrderMap.set(taskId, index);
    });

    const updatedTasks = previousTasks.map((t) => {
      const nextSortOrder = sortOrderMap.has(t.id) ? sortOrderMap.get(t.id)! : t.sortOrder;
      if (t.id === id) {
        return {
          ...t,
          status: newStatus,
          completed: isCompleted,
          sortOrder: nextSortOrder,
        };
      }
      return {
        ...t,
        sortOrder: nextSortOrder,
      };
    });

    set({ tasks: updatedTasks });

    try {
      await Promise.all([
        actions.updateTodo({
          id,
          status: newStatus as TaskStatus,
          completed: isCompleted,
          sortOrder: sortOrderMap.get(id),
        }),
        actions.reorderTasks(reorderedTaskIds),
      ]);
    } catch {
      set({ tasks: previousTasks });
      toast.error("Failed to save board reordering");
    }
  },

  deleteTask: async (id: string) => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    }));

    try {
      await actions.deleteTodo(id);
      toast.success("Task deleted");
    } catch {
      set({ tasks: previousTasks });
      toast.error("Failed to delete task");
    }
  },

  clearCompleted: async () => {
    const previousTasks = get().tasks;
    set((state) => ({
      tasks: state.tasks.filter((t) => !t.completed && t.status !== "done" && t.status !== "completed"),
    }));

    try {
      await actions.clearCompletedTodos();
      toast.success("Completed tasks cleared");
    } catch {
      set({ tasks: previousTasks });
      toast.error("Failed to clear completed tasks");
    }
  },

  addSubtask: async (todoId: string, title: string) => {
    try {
      const created = await actions.createSubtask({ todoId, title });
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === todoId
            ? { ...task, subtasks: [...task.subtasks, created] }
            : task
        ),
      }));
      toast.success("Subtask added");
    } catch {
      toast.error("Failed to add subtask");
    }
  },

  toggleSubtask: async (subtaskId: string, todoId: string) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === todoId
          ? {
              ...task,
              subtasks: task.subtasks.map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
              ),
            }
          : task
      ),
    }));

    try {
      await actions.toggleSubtask(subtaskId);
    } catch {
      await get().fetchTasks();
      toast.error("Failed to update subtask");
    }
  },

  deleteSubtask: async (subtaskId: string, todoId: string) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === todoId
          ? {
              ...task,
              subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
            }
          : task
      ),
    }));

    try {
      await actions.deleteSubtask(subtaskId);
      toast.success("Subtask deleted");
    } catch {
      await get().fetchTasks();
      toast.error("Failed to delete subtask");
    }
  },

  generateAIBreakdown: async (todoId: string) => {
    try {
      toast.loading("Analyzing task & generating steps...", { id: "ai-breakdown" });
      const created = await actions.generateSubtasksWithAI(todoId);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === todoId
            ? { ...task, subtasks: [...task.subtasks, ...created] }
            : task
        ),
      }));
      toast.success("AI generated checklist steps!", { id: "ai-breakdown" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate steps", {
        id: "ai-breakdown",
      });
    }
  },

  reorderTasks: async (taskIds: string[]) => {
    const taskMap = new Map(get().tasks.map((t) => [t.id, t]));
    const reordered = taskIds
      .map((id) => taskMap.get(id))
      .filter((t): t is actions.TodoWithDetails => !!t);

    set({ tasks: reordered });
    try {
      await actions.reorderTasks(taskIds);
    } catch {
      toast.error("Failed to save reordered tasks");
    }
  },

  createProject: async (name: string, color = "#0075de") => {
    try {
      const created = await projectActions.createProject({ name, color });
      set((state) => ({
        projects: [created, ...state.projects],
      }));
      toast.success("Project created");
    } catch {
      toast.error("Failed to create project");
    }
  },

  deleteProject: async (id: string) => {
    try {
      await projectActions.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
        tasks: state.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null, project: null } : t)),
      }));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  },
}));
