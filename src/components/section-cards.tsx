"use client";

import {
  CheckCircle2Icon,
  Clock3Icon,
  ListTodoIcon,
  TrendingUpIcon,
  SparklesIcon,
} from "lucide-react";

export interface DashboardStatsProps {
  activeCount?: number;
  completedCount?: number;
  completedThisWeek?: number;
  urgentCount?: number;
  completionRate?: number;
  focusHours?: string;
}

export function SectionCards({
  activeCount = 0,
  completedCount = 0,
  completedThisWeek = 0,
  urgentCount = 0,
  completionRate = 0,
  focusHours = "0.0",
}: DashboardStatsProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Open Tasks */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80 hover:shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Open Tasks
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ListTodoIcon className="size-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-card-foreground tabular-nums">
              {activeCount}
            </span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
              Active
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1 font-medium text-foreground">
            <span>{urgentCount} high priority</span>
            <TrendingUpIcon className="size-3 text-primary" />
          </div>
          <span className="text-[11px] text-muted-foreground">In queue</span>
        </div>
      </div>

      {/* 2. Completed Tasks */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80 hover:shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-card-foreground tabular-nums">
              {completedCount}
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              +{completedThisWeek} this week
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
            <span>Strong completion pace</span>
            <TrendingUpIcon className="size-3" />
          </div>
          <span className="text-[11px] text-muted-foreground">PostgreSQL</span>
        </div>
      </div>

      {/* 3. Estimated Focus */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80 hover:shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Focus Blocks
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock3Icon className="size-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-card-foreground tabular-nums">
              {focusHours}h
            </span>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              Deep Work
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1 font-medium text-foreground">
            <span>Active focus tracking</span>
            <SparklesIcon className="size-3 text-amber-500" />
          </div>
          <span className="text-[11px] text-muted-foreground">Calculated</span>
        </div>
      </div>

      {/* 4. Completion Rate */}
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80 hover:shadow-sm">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completion Rate
            </span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingUpIcon className="size-3.5" />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-card-foreground tabular-nums">
              {completionRate}%
            </span>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
              {completionRate >= 50 ? "On Track" : "In Progress"}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{completedCount} done</span>
            <span>{activeCount + completedCount} total</span>
          </div>
        </div>
      </div>
    </div>
  );
}
