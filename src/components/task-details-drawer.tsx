"use client";

import * as React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  CalendarIcon,
  CheckCircle2Icon,
  CircleIcon,
  CopyIcon,
  ExternalLinkIcon,
  FolderIcon,
  ListPlusIcon,
  MailIcon,
  RepeatIcon,
  SparklesIcon,
  SunIcon,
  TagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useTodoStore } from "@/stores/todo-store";
import { TaskGitHubIntegration } from "@/components/task-github-integration";
import type { Priority, RecurringFrequency, TaskStatus } from "@/lib/validations/todo";
import { useIsMobile } from "@/hooks/use-mobile";
import { KANBAN_COLUMNS } from "@/lib/kanban-utils";
import { getStatusIcon } from "./task-workspace/kanban-status-icons";

export function TaskDetailsDrawer() {
  const {
    tasks,
    projects,
    selectedTaskId,
    setSelectedTaskId,
    updateTask,
    deleteTask,
    duplicateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    generateAIBreakdown,
    fetchTasks,
  } = useTodoStore();

  const isMobile = useIsMobile();
  const task = tasks.find((t) => t.id === selectedTaskId);
  const [subtaskTitle, setSubtaskTitle] = React.useState("");

  if (!task) return null;

  const handleTitleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (val && val !== task.title) {
      updateTask({ id: task.id, title: val });
    }
  };

  const handleDescriptionBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.trim();
    if (val !== (task.description || "")) {
      updateTask({ id: task.id, description: val || null });
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    await addSubtask(task.id, subtaskTitle.trim());
    setSubtaskTitle("");
  };

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress =
    totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const createdDateStr = new Date(task.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const updatedDateStr = new Date(task.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const content = (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-5 space-y-5 flex-1">
        {/* Title Input */}
        <div>
          <input
            defaultValue={task.title}
            onBlur={handleTitleBlur}
            className="w-full bg-transparent text-lg font-bold tracking-tight text-foreground outline-none focus:ring-1 focus:ring-primary/40 rounded px-1 -mx-1"
            placeholder="Task title..."
          />
        </div>

        {/* Source Email Badge if converted from Gmail */}
        {task.sourceEmailId && (
          <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <MailIcon className="size-4 text-rose-500 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-foreground">Converted from Gmail</span>
                <p className="text-muted-foreground truncate text-[11px]">
                  {task.sourceEmailSubject || "Email message"}
                </p>
              </div>
            </div>
            <Link
              href="/settings/integrations"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline shrink-0"
            >
              <span>View Email</span>
              <ExternalLinkIcon className="size-3" />
            </Link>
          </div>
        )}

        {/* GitHub Integration Section */}
        <TaskGitHubIntegration task={task} onTaskUpdated={fetchTasks} />

        {/* Properties Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          {/* Status Selector */}
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-2.5">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {getStatusIcon(task.status, "size-3")}
              <span>Status</span>
            </div>
            <select
              value={task.status}
              onChange={(e) =>
                updateTask({
                  id: task.id,
                  status: e.target.value as TaskStatus,
                  completed: e.target.value === "done" || e.target.value === "completed",
                })
              }
              className="w-full bg-transparent text-xs font-medium text-foreground outline-none capitalize cursor-pointer"
            >
              {KANBAN_COLUMNS.map((c) => (
                <option key={c.id} value={c.status} className="bg-card text-foreground">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Selector */}
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-2.5">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <TagIcon className="size-3" />
              <span>Priority</span>
            </div>
            <select
              value={task.priority}
              onChange={(e) =>
                updateTask({ id: task.id, priority: e.target.value as Priority })
              }
              className="w-full bg-transparent text-xs font-medium text-foreground outline-none capitalize cursor-pointer"
            >
              <option value="low" className="bg-card text-foreground">Low</option>
              <option value="medium" className="bg-card text-foreground">Medium</option>
              <option value="high" className="bg-card text-foreground">High</option>
              <option value="urgent" className="bg-card text-foreground">Urgent</option>
            </select>
          </div>

          {/* Project Selector */}
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-2.5">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <FolderIcon className="size-3" />
              <span>Project</span>
            </div>
            <select
              value={task.projectId || ""}
              onChange={(e) =>
                updateTask({ id: task.id, projectId: e.target.value || null })
              }
              className="w-full bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer truncate"
            >
              <option value="" className="bg-card text-muted-foreground">None (Inbox)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-2.5">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarIcon className="size-3" />
              <span>Due Date</span>
            </div>
            <input
              type="date"
              value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
              onChange={(e) =>
                updateTask({
                  id: task.id,
                  dueDate: e.target.value ? new Date(e.target.value) : null,
                })
              }
              className="w-full bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
            />
          </div>

          {/* Recurring */}
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-2.5">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <RepeatIcon className="size-3" />
              <span>Repeat</span>
            </div>
            <select
              value={task.recurring || "none"}
              onChange={(e) =>
                updateTask({
                  id: task.id,
                  recurring:
                    e.target.value === "none"
                      ? null
                      : (e.target.value as RecurringFrequency),
                })
              }
              className="w-full bg-transparent text-xs font-medium text-foreground outline-none capitalize cursor-pointer"
            >
              <option value="none" className="bg-card text-foreground">No Repeat</option>
              <option value="daily" className="bg-card text-foreground">Daily</option>
              <option value="weekdays" className="bg-card text-foreground">Weekdays</option>
              <option value="weekly" className="bg-card text-foreground">Weekly</option>
              <option value="monthly" className="bg-card text-foreground">Monthly</option>
            </select>
          </div>

          {/* My Day Toggle */}
          <div className="rounded-xl border border-border/80 bg-secondary/30 p-2.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
                <SunIcon className={`size-3 ${task.myDay ? "text-amber-400" : ""}`} />
                <span>My Day</span>
              </div>
              <span className="text-xs font-medium">
                {task.myDay ? "Active" : "Off"}
              </span>
            </div>
            <Button
              type="button"
              variant={task.myDay ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={() => updateTask({ id: task.id, myDay: !task.myDay })}
            >
              {task.myDay ? "Remove" : "Add"}
            </Button>
          </div>
        </div>

        {/* Description/Notes textarea */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Description & Notes
          </label>
          <textarea
            defaultValue={task.description || ""}
            onBlur={handleDescriptionBlur}
            rows={3}
            placeholder="Add context, details, or checklist notes..."
            className="w-full rounded-xl border border-border bg-secondary/20 p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 transition-colors"
          />
        </div>

        <Separator className="bg-border/60" />

        {/* Subtasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListPlusIcon className="size-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Subtasks</span>
              {totalSubtasks > 0 && (
                <span className="text-[11px] text-muted-foreground font-mono">
                  ({completedSubtasks}/{totalSubtasks})
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateAIBreakdown(task.id)}
                className="h-6 gap-1 px-2 text-[10px] text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
              >
                <SparklesIcon className="size-2.5" />
                <span>AI Breakdown</span>
              </Button>
              {totalSubtasks > 0 && (
                <div className="text-[11px] text-muted-foreground font-medium">
                  {subtaskProgress}%
                </div>
              )}
            </div>
          </div>

          {totalSubtasks > 0 && (
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
          )}

          {/* Subtask list */}
          <div className="space-y-1.5">
            {task.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center justify-between gap-2.5 rounded-lg border border-border/60 bg-secondary/15 px-2.5 py-1.5 text-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleSubtask(subtask.id, task.id)}
                  className="flex size-4 shrink-0 items-center justify-center rounded border border-border transition hover:border-primary cursor-pointer"
                  aria-label={subtask.completed ? "Mark incomplete" : "Mark complete"}
                >
                  {subtask.completed ? (
                    <CheckCircle2Icon className="size-3.5 text-primary" />
                  ) : (
                    <CircleIcon className="size-3.5 text-muted-foreground/40" />
                  )}
                </button>
                <span
                  className={`flex-1 text-xs ${
                    subtask.completed ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {subtask.title}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5 text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={() => deleteSubtask(subtask.id, task.id)}
                  aria-label="Delete subtask"
                >
                  <Trash2Icon className="size-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add subtask form */}
          <form onSubmit={handleAddSubtask} className="flex gap-2">
            <Input
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
              placeholder="Add next step..."
              className="h-7 text-xs bg-secondary/30"
            />
            <Button type="submit" size="sm" variant="outline" className="h-7 text-xs shrink-0">
              Add Step
            </Button>
          </form>
        </div>

        {/* Timestamps */}
        <div className="pt-2 text-[10px] text-muted-foreground/70">
          <p>Created on {createdDateStr} • Updated {updatedDateStr}</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t border-border/50 p-4 bg-secondary/10 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => deleteTask(task.id)}
            className="gap-1 text-xs cursor-pointer h-7 px-2.5"
          >
            <Trash2Icon className="size-3" />
            <span>Delete</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => duplicateTask(task.id)}
            className="gap-1 text-xs cursor-pointer h-7 px-2.5"
          >
            <CopyIcon className="size-3" />
            <span>Duplicate</span>
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSelectedTaskId(null)}
          className="text-xs h-7 px-3"
        >
          Close
        </Button>
      </div>
    </div>
  );

  // Desktop: Side panel (Sheet)
  if (!isMobile) {
    return (
      <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
        <SheetContent
          side="right"
          showCloseButton={true}
          className="sm:max-w-md w-full p-0 flex flex-col gap-0 border-l border-border bg-card"
        >
          <SheetHeader className="p-4 border-b border-border/50 text-left">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                {task.status}
              </Badge>
              {task.project && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 px-1.5 py-0 font-normal"
                  style={{ borderColor: `${task.project.color}50` }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: task.project.color }}
                  />
                  <span>{task.project.name}</span>
                </Badge>
              )}
            </div>
            <SheetTitle className="sr-only">Task Details</SheetTitle>
            <SheetDescription className="sr-only">
              Edit task title, status, priority, and subtasks
            </SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  // Mobile: Bottom drawer
  return (
    <Drawer open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
      <DrawerContent className="mx-auto max-w-2xl border-border bg-card max-h-[85vh]">
        <DrawerHeader className="flex flex-row items-start justify-between border-b border-border/50 pb-3">
          <div className="space-y-1 text-left flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                {task.status}
              </Badge>
              {task.project && (
                <Badge
                  variant="outline"
                  className="text-[10px] gap-1 px-1.5 py-0 font-normal"
                  style={{ borderColor: `${task.project.color}50` }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: task.project.color }}
                  />
                  <span>{task.project.name}</span>
                </Badge>
              )}
            </div>
            <DrawerTitle className="sr-only">Task Details</DrawerTitle>
            <DrawerDescription className="sr-only">
              Edit task properties and checklist
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
              <XIcon className="size-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        {content}
      </DrawerContent>
    </Drawer>
  );
}
