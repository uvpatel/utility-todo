"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTodoStore } from "@/stores/todo-store";
import type { Priority, RecurringFrequency, TaskStatus } from "@/lib/validations/todo";
import { KANBAN_COLUMNS } from "@/lib/kanban-utils";
import { CalendarIcon, FolderIcon, PlusIcon, RepeatIcon, TagIcon } from "lucide-react";

function CreateTaskForm() {
  const {
    createDialogDefaultStatus,
    closeCreateDialog,
    createTask,
    projects,
    selectedProjectId,
  } = useTodoStore();

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>(
    (createDialogDefaultStatus as TaskStatus) || "todo"
  );
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [projectId, setProjectId] = React.useState<string>(selectedProjectId || "");
  const [dueDate, setDueDate] = React.useState("");
  const [recurring, setRecurring] = React.useState<string>("none");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Task title is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createTask(trimmed, {
        description: description.trim() || null,
        status,
        priority,
        projectId: projectId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        recurring: (recurring === "none" ? null : recurring) as RecurringFrequency | null,
      });
      closeCreateDialog();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader className="text-left">
        <DialogTitle className="text-lg font-bold tracking-tight">Create New Task</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Add a new task to your personal board.
        </DialogDescription>
      </DialogHeader>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <Input
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            autoFocus
            disabled={isSubmitting}
            className="h-9 text-sm"
          />
        </div>

        <div>
          <textarea
            placeholder="Add optional description or notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 text-xs">
          {/* Status */}
          <div className="rounded-lg border border-border/70 bg-secondary/20 p-2">
            <label className="mb-1 block text-[10px] font-medium text-muted-foreground uppercase">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
            >
              {KANBAN_COLUMNS.map((c) => (
                <option key={c.id} value={c.status} className="bg-card text-foreground">
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="rounded-lg border border-border/70 bg-secondary/20 p-2">
            <label className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase">
              <TagIcon className="size-2.5" />
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer capitalize"
            >
              <option value="low" className="bg-card text-foreground">Low</option>
              <option value="medium" className="bg-card text-foreground">Medium</option>
              <option value="high" className="bg-card text-foreground">High</option>
              <option value="urgent" className="bg-card text-foreground">Urgent</option>
            </select>
          </div>

          {/* Project */}
          <div className="rounded-lg border border-border/70 bg-secondary/20 p-2">
            <label className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase">
              <FolderIcon className="size-2.5" />
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
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
          <div className="col-span-2 sm:col-span-2 rounded-lg border border-border/70 bg-secondary/20 p-2">
            <label className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase">
              <CalendarIcon className="size-2.5" />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer"
            />
          </div>

          {/* Recurring */}
          <div className="col-span-2 sm:col-span-1 rounded-lg border border-border/70 bg-secondary/20 p-2">
            <label className="mb-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase">
              <RepeatIcon className="size-2.5" />
              Repeat
            </label>
            <select
              value={recurring}
              onChange={(e) => setRecurring(e.target.value)}
              className="w-full bg-transparent text-xs font-medium text-foreground outline-none cursor-pointer capitalize"
            >
              <option value="none" className="bg-card text-foreground">None</option>
              <option value="daily" className="bg-card text-foreground">Daily</option>
              <option value="weekdays" className="bg-card text-foreground">Weekdays</option>
              <option value="weekly" className="bg-card text-foreground">Weekly</option>
              <option value="monthly" className="bg-card text-foreground">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={closeCreateDialog}
          disabled={isSubmitting}
          className="text-xs"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim() || isSubmitting}
          className="gap-1.5 text-xs font-medium"
        >
          <PlusIcon className="size-3.5" />
          <span>{isSubmitting ? "Creating..." : "Create Task"}</span>
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TaskCreateDialog() {
  const { isCreateDialogOpen, closeCreateDialog } = useTodoStore();

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={(open) => !open && closeCreateDialog()}>
      <DialogContent className="sm:max-w-[480px] border-border bg-card">
        {isCreateDialogOpen && <CreateTaskForm />}
      </DialogContent>
    </Dialog>
  );
}
