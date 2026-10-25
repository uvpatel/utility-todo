"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CalendarIcon, PlusIcon, RepeatIcon, TagIcon } from "lucide-react";
import { useTodoStore } from "@/stores/todo-store";
import type { Priority, RecurringFrequency, TaskStatus } from "@/lib/validations/todo";

interface TaskQuickAddProps {
  defaultStatus?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onAdded?: () => void;
}

export function TaskQuickAdd({
  defaultStatus = "todo",
  placeholder = "Add a task, set a priority, and press Enter...",
  autoFocus = false,
  onAdded,
}: TaskQuickAddProps) {
  const { createTask } = useTodoStore();
  const [draft, setDraft] = React.useState("");
  const [draftPriority, setDraftPriority] = React.useState<Priority>("medium");
  const [draftDueDate, setDraftDueDate] = React.useState("");
  const [draftRecurring, setDraftRecurring] = React.useState<string>("none");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await createTask(trimmed, {
        priority: draftPriority,
        status: defaultStatus as TaskStatus,
        dueDate: draftDueDate ? new Date(draftDueDate) : null,
        recurring: (draftRecurring === "none" ? null : draftRecurring) as RecurringFrequency | null,
      });

      setDraft("");
      setDraftDueDate("");
      setDraftRecurring("none");
      onAdded?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-3.5 space-y-2.5">
        <form onSubmit={handleCreate} className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              autoFocus={autoFocus}
              className="h-10 bg-secondary/30 text-sm"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              disabled={!draft.trim() || isSubmitting}
              className="h-10 shrink-0 gap-1.5 font-medium cursor-pointer"
            >
              <PlusIcon className="size-4" />
              <span>{isSubmitting ? "Adding..." : "Add Task"}</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1">
              <TagIcon className="size-3 text-muted-foreground" />
              <select
                value={draftPriority}
                onChange={(e) => setDraftPriority(e.target.value as Priority)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer capitalize"
              >
                <option value="low" className="bg-card">Low Priority</option>
                <option value="medium" className="bg-card">Medium Priority</option>
                <option value="high" className="bg-card">High Priority</option>
                <option value="urgent" className="bg-card">Urgent</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1">
              <CalendarIcon className="size-3 text-muted-foreground" />
              <input
                type="date"
                value={draftDueDate}
                onChange={(e) => setDraftDueDate(e.target.value)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1">
              <RepeatIcon className="size-3 text-muted-foreground" />
              <select
                value={draftRecurring}
                onChange={(e) => setDraftRecurring(e.target.value)}
                className="bg-transparent text-xs text-foreground outline-none cursor-pointer capitalize"
              >
                <option value="none" className="bg-card">No Repeat</option>
                <option value="daily" className="bg-card">Daily</option>
                <option value="weekdays" className="bg-card">Weekdays</option>
                <option value="weekly" className="bg-card">Weekly</option>
                <option value="monthly" className="bg-card">Monthly</option>
              </select>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
