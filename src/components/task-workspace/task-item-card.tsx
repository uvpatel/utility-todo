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

export const priorityBadgeStyles: Record<string, string> = {
  low: "bg-secondary text-muted-foreground border-border",
  medium: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60",
  high: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60",
  urgent: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60",
};

export function formatDueDate(dateStr?: Date | string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));
  if (diffDays < 0) {
    return { text: "Overdue", color: "text-rose-500 bg-rose-500/10 border-rose-500/25" };
  }
  if (diffDays === 0) {
    return { text: "Today", color: "text-amber-500 bg-amber-500/10 border-amber-500/25" };
  }
  if (diffDays === 1) {
    return { text: "Tomorrow", color: "text-blue-500 bg-blue-500/10 border-blue-500/25" };
  }
  return {
    text: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    color: "text-muted-foreground bg-secondary/50 border-border",
  };
}

interface TaskItemCardProps {
  task: TodoWithDetails;
  variant?: "list" | "kanban";
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onUpdate: (data: { id: string; myDay?: boolean; status?: string }) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveStatus?: (id: string, status: string) => void;
}

export function TaskItemCard({
  task,
  variant = "list",
  onToggle,
  onSelect,
  onUpdate,
  onDuplicate,
  onDelete,
  onMoveStatus,
}: TaskItemCardProps) {
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
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 40 : 1,
    opacity: isDragging ? 0.4 : task.completed ? 0.65 : 1,
  };

  const dueInfo = formatDueDate(task.dueDate);
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const totalSubtasks = subtasks.length;
  const subtaskPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  if (variant === "kanban") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-3 shadow-xs hover:border-border hover:shadow-md transition-all cursor-pointer ${
          isDragging ? "ring-2 ring-primary shadow-xl" : ""
        }`}
        onClick={() => onSelect(task.id)}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Priority & Project Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 capitalize ${
                priorityBadgeStyles[task.priority] || ""
              }`}
            >
              {task.priority}
            </Badge>

            {task.project && (
              <Badge
                variant="outline"
                className="gap-1 text-[10px] px-1.5 py-0 font-normal"
                style={{ borderColor: `${task.project.color}50` }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: task.project.color }}
                />
                <span className="truncate max-w-[90px]">{task.project.name}</span>
              </Badge>
            )}

            {task.sourceEmailId && (
              <span
                className="flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/20 px-1 py-0 text-[10px] font-medium text-rose-600 dark:text-rose-400"
                title={task.sourceEmailSubject || "Gmail"}
              >
                <MailIcon className="size-2.5" />
                <span>Mail</span>
              </span>
            )}

            {(task.githubMapping || task.sourceGithubIssueUrl) && (
              <span
                className={`flex items-center gap-1 rounded border px-1.5 py-0 text-[10px] font-medium font-mono ${
                  task.githubMapping?.issueState === "closed"
                    ? "bg-purple-500/10 text-purple-600 border-purple-500/25 dark:text-purple-400"
                    : "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400"
                }`}
                title={task.githubMapping?.repositoryFullName || task.sourceGithubRepo || "GitHub Issue"}
              >
                <FolderGit2Icon className="size-2.5" />
                <span>#{task.githubMapping?.issueNumber || "gh"}</span>
              </span>
            )}
          </div>

          {/* Action options */}
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            {/* Drag Handle */}
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="text-muted-foreground/40 hover:text-foreground cursor-grab active:cursor-grabbing p-1 touch-none rounded"
              aria-label="Drag to reorder"
            >
              <GripVerticalIcon className="size-3.5" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <MoreHorizontalIcon className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 text-xs">
                <DropdownMenuItem onClick={() => onUpdate({ id: task.id, myDay: !task.myDay })}>
                  <SunIcon className="size-3.5 mr-2" />
                  {task.myDay ? "Remove from My Day" : "Add to My Day"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(task.id)}>
                  <CopyIcon className="size-3.5 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                {onMoveStatus && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onMoveStatus(task.id, "backlog")}>
                      <MoveRightIcon className="size-3.5 mr-2 text-muted-foreground" />
                      Move to Backlog
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveStatus(task.id, "todo")}>
                      <MoveRightIcon className="size-3.5 mr-2 text-blue-500" />
                      Move to To Do
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveStatus(task.id, "in_progress")}>
                      <MoveRightIcon className="size-3.5 mr-2 text-amber-500" />
                      Move to In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveStatus(task.id, "in_review")}>
                      <MoveRightIcon className="size-3.5 mr-2 text-purple-500" />
                      Move to In Review
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onMoveStatus(task.id, "done")}>
                      <MoveRightIcon className="size-3.5 mr-2 text-emerald-500" />
                      Move to Done
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2Icon className="size-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Task Title with Toggle */}
        <div className="flex items-start gap-2 pt-0.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task.id);
            }}
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-background transition hover:border-primary cursor-pointer"
            aria-label={task.completed ? "Mark active" : "Mark completed"}
          >
            {task.completed ? (
              <CheckCircle2Icon className="size-3.5 text-primary" />
            ) : (
              <CircleIcon className="size-3.5 text-muted-foreground/30" />
            )}
          </button>
          <span
            className={`text-xs font-medium leading-snug line-clamp-2 ${
              task.completed ? "line-through text-muted-foreground font-normal" : "text-foreground"
            }`}
          >
            {task.title}
          </span>
        </div>

        {/* Subtask mini progress bar if subtasks exist */}
        {totalSubtasks > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <ListPlusIcon className="size-3" />
                {completedSubtasks}/{totalSubtasks}
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

        {/* Footer: Due date & Recurring indicator */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/40 text-[10px]">
          <div>
            {dueInfo ? (
              <span className={`rounded px-1.5 py-0.5 border font-medium ${dueInfo.color}`}>
                {dueInfo.text}
              </span>
            ) : (
              <span className="text-muted-foreground/60">No due date</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {task.recurring && task.recurring !== "none" && (
              <span className="flex items-center gap-0.5 text-muted-foreground" title={`Repeats ${task.recurring}`}>
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

  // List layout
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors bg-card ${
        isDragging ? "shadow-2xl border border-primary/50 rounded-xl" : ""
      }`}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/30 hover:text-foreground cursor-grab active:cursor-grabbing p-0.5 -ml-1 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVerticalIcon className="size-3.5" />
      </button>

      {/* Completion Toggle */}
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-background transition hover:border-primary cursor-pointer"
        aria-label={task.completed ? "Mark active" : "Mark completed"}
      >
        {task.completed ? (
          <CheckCircle2Icon className="size-4 text-primary" />
        ) : (
          <CircleIcon className="size-4 text-muted-foreground/30" />
        )}
      </button>

      {/* Title and details */}
      <div
        onClick={() => onSelect(task.id)}
        className="flex flex-1 flex-col gap-1 min-w-0 cursor-pointer"
      >
        <span
          className={`text-sm font-medium tracking-tight truncate ${
            task.completed
              ? "line-through text-muted-foreground font-normal"
              : "text-foreground"
          }`}
        >
          {task.title}
        </span>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 capitalize ${
              priorityBadgeStyles[task.priority] || ""
            }`}
          >
            {task.priority}
          </Badge>

          {task.project && (
            <Badge
              variant="outline"
              className="gap-1 text-[10px] px-1.5 py-0"
              style={{ borderColor: task.project.color }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: task.project.color }}
              />
              {task.project.name}
            </Badge>
          )}

          {dueInfo && (
            <span
              className={`rounded px-1.5 py-0 text-[10px] border font-medium ${dueInfo.color}`}
            >
              {dueInfo.text}
            </span>
          )}

          {totalSubtasks > 0 && (
            <span className="flex items-center gap-1 rounded bg-secondary px-1.5 py-0 text-[10px] font-mono text-muted-foreground">
              <ListPlusIcon className="size-2.5" />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}

          {task.recurring && task.recurring !== "none" && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground capitalize">
              <RepeatIcon className="size-2.5 text-primary" />
              {task.recurring}
            </span>
          )}

          {task.sourceEmailId && (
            <span
              className="flex items-center gap-1 rounded bg-rose-500/10 border border-rose-500/20 px-1.5 py-0 text-[10px] font-medium text-rose-600 dark:text-rose-400"
              title={task.sourceEmailSubject || "Converted from Gmail"}
            >
              <MailIcon className="size-2.5" />
              <span>Gmail</span>
            </span>
          )}

          {(task.githubMapping || task.sourceGithubIssueUrl) && (
            <span
              className={`flex items-center gap-1 rounded border px-1.5 py-0 text-[10px] font-medium font-mono ${
                task.githubMapping?.issueState === "closed"
                  ? "bg-purple-500/10 text-purple-600 border-purple-500/25 dark:text-purple-400"
                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400"
              }`}
              title={task.githubMapping?.repositoryFullName || task.sourceGithubRepo || "GitHub Issue"}
            >
              <FolderGit2Icon className="size-2.5" />
              <span>#{task.githubMapping?.issueNumber || "gh"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Quick action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={`size-7 cursor-pointer ${
            task.myDay ? "text-amber-400" : "text-muted-foreground"
          }`}
          onClick={() => onUpdate({ id: task.id, myDay: !task.myDay })}
          title={task.myDay ? "Remove from My Day" : "Add to My Day"}
        >
          <SunIcon className={`size-3.5 ${task.myDay ? "fill-amber-400" : ""}`} />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => onDuplicate(task.id)}
          title="Duplicate task"
        >
          <CopyIcon className="size-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
          onClick={() => onDelete(task.id)}
          title="Delete task"
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
