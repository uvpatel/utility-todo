"use client";

import * as React from "react";
import { useTodoStore, type WorkspaceView } from "@/stores/todo-store";
import { TaskListView } from "./task-list-view";
import { TaskKanbanBoard } from "./task-kanban-board";
import { KanbanToolbar } from "./kanban-toolbar";
import { KanbanProgressSummary } from "./kanban-progress-summary";
import { TaskCreateDialog } from "./task-create-dialog";
import { TaskQuickAdd } from "./task-quick-add";
import {
  CalendarCheckIcon,
  CheckCircle2Icon,
  FolderIcon,
  InboxIcon,
  KanbanIcon,
  SunIcon,
} from "lucide-react";

interface TaskWorkspaceViewProps {
  forcedView?: WorkspaceView;
  forcedMode?: "list" | "kanban";
}

export function TaskWorkspaceView({ forcedView, forcedMode }: TaskWorkspaceViewProps) {
  const {
    tasks,
    projects,
    activeView,
    viewMode,
    selectedProjectId,
    statusFilter,
    priorityFilter,
    searchQuery,
    fetchTasks,
    fetchProjects,
    setActiveView,
    setViewMode,
    showProgressSummary,
  } = useTodoStore();

  React.useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  React.useEffect(() => {
    if (forcedView) {
      setActiveView(forcedView);
    }
  }, [forcedView, setActiveView]);

  React.useEffect(() => {
    if (forcedMode) {
      setViewMode(forcedMode);
    }
  }, [forcedMode, setViewMode]);

  const effectiveView = forcedView || activeView;
  const effectiveMode = forcedMode || viewMode;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Compute view-scoped tasks (project, my-day, etc.)
  const viewScopedTasks = React.useMemo(() => {
    return tasks.filter((task) => {
      if (selectedProjectId) {
        if (task.projectId !== selectedProjectId) return false;
      } else if (effectiveView === "my-day") {
        if (!task.myDay) return false;
      } else if (effectiveView === "upcoming") {
        if (!task.dueDate) return false;
      } else if (effectiveView === "completed") {
        if (!task.completed) return false;
      }
      return true;
    });
  }, [tasks, selectedProjectId, effectiveView]);

  // Compute filtered tasks for list view
  const listFilteredTasks = React.useMemo(() => {
    return viewScopedTasks.filter((task) => {
      if (statusFilter === "active" && task.completed) return false;
      if (statusFilter === "completed" && !task.completed) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      return true;
    });
  }, [viewScopedTasks, statusFilter, priorityFilter, searchQuery]);

  const activeCount = viewScopedTasks.filter((t) => !t.completed).length;
  const completedCount = viewScopedTasks.filter((t) => t.completed).length;

  const getViewDetails = () => {
    if (selectedProject) {
      return {
        title: selectedProject.name,
        description: "Project workspace",
        icon: <FolderIcon className="size-5" style={{ color: selectedProject.color }} />,
      };
    }

    switch (effectiveView) {
      case "my-day":
        return {
          title: "My Day",
          description: new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          }),
          icon: <SunIcon className="size-5 text-amber-500 fill-amber-400" />,
        };
      case "upcoming":
        return {
          title: "Upcoming Tasks",
          description: "Tasks with scheduled deadlines",
          icon: <CalendarCheckIcon className="size-5 text-indigo-500" />,
        };
      case "completed":
        return {
          title: "Completed History",
          description: "Archive of accomplished work",
          icon: <CheckCircle2Icon className="size-5 text-emerald-500" />,
        };
      case "kanban":
        return {
          title: "Kanban Board",
          description: "Visual agile workflow across Backlog, To Do, In Progress, Review, and Done",
          icon: <KanbanIcon className="size-5 text-primary" />,
        };
      case "inbox":
      default:
        return {
          title: "Inbox",
          description: "Capture, prioritize, and conquer your workflow",
          icon: <InboxIcon className="size-5 text-blue-500" />,
        };
    }
  };

  const headerInfo = getViewDetails();

  return (
    <main
      className={`flex flex-1 flex-col gap-4 p-4 md:p-6 w-full ${
        effectiveMode === "kanban" ? "max-w-[1600px] mx-auto" : "max-w-6xl mx-auto"
      }`}
    >
      <KanbanToolbar
        title={headerInfo.title}
        description={headerInfo.description}
        icon={headerInfo.icon}
        activeCount={activeCount}
        completedCount={completedCount}
      />

      {effectiveMode === "kanban" ? (
        <>
          {showProgressSummary && <KanbanProgressSummary tasks={viewScopedTasks} />}
          <TaskKanbanBoard tasks={viewScopedTasks} />
        </>
      ) : (
        <>
          <TaskQuickAdd />
          <TaskListView tasks={listFilteredTasks} />
        </>
      )}

      {/* Global Task Creation Dialog */}
      <TaskCreateDialog />
    </main>
  );
}
