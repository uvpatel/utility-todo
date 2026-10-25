"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CircleIcon,
  CopyIcon,
  FolderGit2Icon,
  GripVerticalIcon,
  ListPlusIcon,
  MailIcon,
  MoreHorizontalIcon,
  MoveRightIcon,
  RepeatIcon,
  SunIcon,
  Trash2Icon,
} from "lucide-react";
import type { TodoWithDetails } from "@/lib/actions/todos";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDueDate } from "./task-item-card";
import { PrioritySignalIcon } from "./kanban-status-icons";
import { useTodoStore } from "@/stores/todo-store";

interface KanbanTaskCardProps {
  task: TodoWithDetails;
  isOverlay?: boolean;
}

export function KanbanTaskCard({ task, isOverlay = false }: KanbanTaskCardProps) {
  const {
    toggleTask,
    setSelectedTaskId,
    updateTask,
    duplicateTask,
    deleteTask,
    moveTaskStatus,
    cardDensity,
    showDescriptionPreview,
    showSubtasksPreview,
  } = useTodoStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
    disabled: isOverlay,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : task.completed ? 0.7 : 1,
  };

  const dueInfo = formatDueDate(task.dueDate);
  const isOverdue = dueInfo?.text === "Overdue";
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const totalSubtasks = subtasks.length;
  const subtaskPercentage =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const isComfortable = cardDensity === "comfortable";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setSelectedTaskId(task.id)}
      className={`group relative flex flex-col rounded-lg border border-border/80 bg-card text-card-foreground transition-all duration-150 cursor-pointer select-none hover:border-border hover:shadow-sm ${
        isComfortable ? "p-3 gap-2.5" : "p-2.5 gap-2"
      } ${
        isDragging
          ? "ring-2 ring-primary/80 shadow-md border-primary/50"
          : isOverlay
          ? "ring-2 ring-primary shadow-2xl rotate-1 scale-[1.02] bg-card border-border"
          : ""
      }`}
    >
      {/* Top Row: Project pill / Source badges + Drag handle + Overflow Menu */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {/* Project Pill */}
          {task.project ? (
            <Badge
              variant="outline"
              className="h-4.5 gap-1 px-1.5 text-[10px] font-normal border-border/80 bg-secondary/30"
              style={{ borderColor: `${task.project.color}40` }}
            >
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: task.project.color }}
              />
              <span className="truncate max-w-[100px]">{task.project.name}</span>
            </Badge>
          ) : (
            <span className="text-[10px] font-mono text-muted-foreground/60 tracking-wider">
              TASK
            </span>
          )}

          {/* GitHub Pill */}
          {(task.githubMapping || task.sourceGithubIssueUrl) && (
            <span
              className={`flex items-center gap-1 rounded border px-1.5 py-0 text-[9px] font-medium font-mono ${
                task.githubMapping?.issueState === "closed"
                  ? "bg-purple-500/10 text-purple-600 border-purple-500/25 dark:text-purple-400"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400"
              }`}
              title={
                task.githubMapping?.repositoryFullName ||
                task.sourceGithubRepo ||
                "GitHub Issue"
              }
            >
              <FolderGit2Icon className="size-2.5" />
              <span>#{task.githubMapping?.issueNumber || "issue"}</span>
            </span>
          )}

          {/* Mail Pill */}
          {task.sourceEmailId && (
            <span
              className="flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/20 px-1 py-0 text-[9px] font-medium text-rose-600 dark:text-rose-400"
              title={task.sourceEmailSubject || "Gmail"}
            >
              <MailIcon className="size-2.5" />
              <span>Mail</span>
            </span>
          )}
        </div>

        {/* Drag handle & Actions menu */}
        <div
          className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {!isOverlay && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="flex size-5 items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-secondary cursor-grab active:cursor-grabbing touch-none"
              aria-label="Drag task"
              title="Drag task"
            >
              <GripVerticalIcon className="size-3" />
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 text-muted-foreground/60 hover:text-foreground cursor-pointer"
                aria-label="Task options"
              >
                <MoreHorizontalIcon className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuItem onClick={() => updateTask({ id: task.id, myDay: !task.myDay })}>
                <SunIcon className="size-3.5 mr-2 text-amber-500" />
                {task.myDay ? "Remove from My Day" : "Add to My Day"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateTask(task.id)}>
                <CopyIcon className="size-3.5 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => moveTaskStatus(task.id, "backlog")}>
                <MoveRightIcon className="size-3.5 mr-2 text-zinc-400" />
                Move to Backlog
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => moveTaskStatus(task.id, "todo")}>
                <MoveRightIcon className="size-3.5 mr-2 text-sky-500" />
                Move to To Do
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => moveTaskStatus(task.id, "in_progress")}>
                <MoveRightIcon className="size-3.5 mr-2 text-amber-500" />
                Move to In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => moveTaskStatus(task.id, "in_review")}>
                <MoveRightIcon className="size-3.5 mr-2 text-purple-500" />
                Move to In Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => moveTaskStatus(task.id, "done")}>
                <MoveRightIcon className="size-3.5 mr-2 text-emerald-500" />
                Move to Done
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2Icon className="size-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Middle Row: Checkbox + Title */}
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleTask(task.id);
          }}
          className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background transition hover:border-primary cursor-pointer"
          aria-label={task.completed ? "Mark active" : "Mark completed"}
        >
          {task.completed ? (
            <CheckCircle2Icon className="size-3.5 text-primary" />
          ) : (
            <CircleIcon className="size-3.5 text-muted-foreground/30 hover:text-muted-foreground/60" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-xs font-medium leading-snug line-clamp-2 ${
              task.completed ? "line-through text-muted-foreground font-normal" : "text-foreground"
            }`}
          >
            {task.title}
          </p>

          {/* Description Preview if enabled */}
          {showDescriptionPreview && task.description && (
            <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1 leading-tight">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Subtasks Progress if present */}
      {showSubtasksPreview && totalSubtasks > 0 && (
        <div className="space-y-1 pt-0.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 font-mono">
              <ListPlusIcon className="size-3" />
              <span>{completedSubtasks}/{totalSubtasks}</span>
            </span>
            <span className="font-mono">{subtaskPercentage}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${subtaskPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Metadata: Priority signal bars + Due Date + Flags */}
      <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/40 text-[10px]">
        <div className="flex items-center gap-2">
          {/* Priority indicator */}
          <div className="flex items-center gap-1" title={`Priority: ${task.priority}`}>
            <PrioritySignalIcon priority={task.priority} />
            <span className="capitalize text-muted-foreground text-[10px] font-medium hidden sm:inline">
              {task.priority}
            </span>
          </div>

          {/* Due Date Indicator */}
          {dueInfo && (
            <div
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 border font-medium ${dueInfo.color}`}
              title={`Due: ${dueInfo.text}`}
            >
              {isOverdue ? (
                <AlertCircleIcon className="size-2.5 text-rose-500" />
              ) : (
                <CalendarIcon className="size-2.5 opacity-70" />
              )}
              <span>{dueInfo.text}</span>
            </div>
          )}
        </div>

        {/* Right side flags */}
        <div className="flex items-center gap-1 text-muted-foreground">
          {task.recurring && task.recurring !== "none" && (
            <span title={`Repeats ${task.recurring}`}>
              <RepeatIcon className="size-3 text-primary" />
            </span>
          )}
          {task.myDay && (
            <span className="text-amber-400" title="In My Day">
              <SunIcon className="size-3 fill-amber-400" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
