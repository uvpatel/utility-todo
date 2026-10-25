"use client";

import * as React from "react";
import type { TodoWithDetails } from "@/lib/actions/todos";
import { calculateKanbanMetrics } from "@/lib/kanban-utils";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  LayersIcon,
} from "lucide-react";

interface KanbanProgressSummaryProps {
  tasks: TodoWithDetails[];
}

export function KanbanProgressSummary({ tasks }: KanbanProgressSummaryProps) {
  const metrics = React.useMemo(() => calculateKanbanMetrics(tasks), [tasks]);

  if (metrics.totalTasks === 0) {
    return null;
  }

  return (
    <section
      aria-label="Kanban board summary"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 rounded-xl border border-border/70 bg-card/60 p-2.5 backdrop-blur-xs shadow-2xs"
    >
      {/* Open tasks */}
      <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-2.5 py-1.5 transition-colors hover:bg-secondary/50">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground/5 text-foreground">
          <LayersIcon className="size-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Open
          </div>
          <div className="font-mono text-sm font-semibold text-foreground">
            {metrics.openTasks}
          </div>
        </div>
      </div>

      {/* In Progress */}
      <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-2.5 py-1.5 transition-colors hover:bg-secondary/50">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <ClockIcon className="size-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            In Progress
          </div>
          <div className="font-mono text-sm font-semibold text-foreground">
            {metrics.inProgressTasks}
          </div>
        </div>
      </div>

      {/* In Review */}
      <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-2.5 py-1.5 transition-colors hover:bg-secondary/50">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
          <EyeIcon className="size-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            In Review
          </div>
          <div className="font-mono text-sm font-semibold text-foreground">
            {metrics.inReviewTasks}
          </div>
        </div>
      </div>

      {/* Completed */}
      <div className="flex items-center gap-2 rounded-lg bg-secondary/30 px-2.5 py-1.5 transition-colors hover:bg-secondary/50">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2Icon className="size-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Completed
          </div>
          <div className="font-mono text-sm font-semibold text-foreground">
            {metrics.completedTasks}
          </div>
        </div>
      </div>

      {/* Overdue */}
      <div
        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 transition-colors ${
          metrics.overdueTasks > 0
            ? "bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400"
            : "bg-secondary/30 hover:bg-secondary/50"
        }`}
      >
        <div
          className={`flex size-6 shrink-0 items-center justify-center rounded-md ${
            metrics.overdueTasks > 0
              ? "bg-rose-500/20 text-rose-600 dark:text-rose-400"
              : "bg-foreground/5 text-muted-foreground"
          }`}
        >
          <AlertCircleIcon className="size-3.5" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">
            Overdue
          </div>
          <div className="font-mono text-sm font-semibold">
            {metrics.overdueTasks}
          </div>
        </div>
      </div>

      {/* Due Today & Completion Rate */}
      <div className="flex flex-col justify-center rounded-lg bg-secondary/30 px-2.5 py-1.5">
        <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarIcon className="size-2.5" />
            <span>Today: {metrics.todayTasks}</span>
          </span>
          <span className="font-mono font-semibold text-foreground">
            {metrics.completionPercentage}%
          </span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${metrics.completionPercentage}%` }}
          />
        </div>
      </div>
    </section>
  );
}
