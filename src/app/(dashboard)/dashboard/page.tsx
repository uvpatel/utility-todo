import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { getDashboardStats } from "@/lib/actions/todos";
import {
  CheckCircle2Icon,
  CircleIcon,
  ListTodoIcon,
  PlusIcon,
  ArrowRightIcon,
  ListPlusIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const priorityPillStyles: Record<string, string> = {
  urgent: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/50",
  high: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/50",
  medium: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50",
  low: "bg-secondary text-muted-foreground border-border",
};

const statusPillStyles: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  todo: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  archived: "bg-secondary text-muted-foreground",
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Notion Page Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-card border border-border shadow-xs text-xl">
            📊
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Performance & Metrics
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live task execution, throughput analytics, and sprint health
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="h-9 gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-xs"
          >
            <Link href="/todo">
              <PlusIcon className="size-3.5" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric summary cards */}
      <SectionCards
        activeCount={stats.activeCount}
        completedCount={stats.completedCount}
        completedThisWeek={stats.completedThisWeek}
        urgentCount={stats.urgentCount}
        completionRate={stats.completionRate}
        focusHours={stats.focusHours}
      />

      {/* Interactive Throughput Chart */}
      <ChartAreaInteractive data={stats.chartData} />

      {/* Notion Database Table View */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex flex-row items-center justify-between border-b border-border px-6 py-4 bg-card">
          <div className="flex items-center gap-2.5">
            <span className="text-sm">📋</span>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Recent Database Entries
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {stats.recentTasks.length} tasks recorded in PostgreSQL
              </p>
            </div>
          </div>

          <Link
            href="/todo"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors"
          >
            <span>Open Full Workspace</span>
            <ArrowRightIcon className="size-3" />
          </Link>
        </div>

        {stats.recentTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-muted-foreground">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-3">
              <ListTodoIcon className="size-6" />
            </div>
            <span className="font-semibold text-foreground">No tasks found</span>
            <p className="mt-1 text-muted-foreground max-w-sm">
              Visit your tasks workspace to add tasks, assign priorities, and organize workflows.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-muted-foreground font-semibold">
                  <th className="py-2.5 px-4 w-1/3">Task Name</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3">Project</th>
                  <th className="py-2.5 px-3">Steps</th>
                  <th className="py-2.5 px-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.recentTasks.map((task) => (
                  <tr
                    key={task.id}
                    className="hover:bg-secondary/40 transition-colors group"
                  >
                    {/* Task Title */}
                    <td className="py-3 px-4 font-medium text-foreground">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {task.completed ? (
                          <CheckCircle2Icon className="size-4 text-primary shrink-0" />
                        ) : (
                          <CircleIcon className="size-4 text-muted-foreground shrink-0" />
                        )}
                        <span
                          className={`truncate ${
                            task.completed ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    </td>

                    {/* Status Tag */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize ${
                          statusPillStyles[task.status] || "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {task.completed ? "Completed" : task.status.replace("_", " ")}
                      </span>
                    </td>

                    {/* Priority Tag */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize border ${
                          priorityPillStyles[task.priority] || "bg-secondary text-muted-foreground border-border"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    {/* Project Tag */}
                    <td className="py-3 px-3">
                      {task.project ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium border border-border bg-card">
                          <span
                            className="size-1.5 rounded-full"
                            style={{ backgroundColor: task.project.color }}
                          />
                          <span className="text-foreground">{task.project.name}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Inbox</span>
                      )}
                    </td>

                    {/* Subtasks Count */}
                    <td className="py-3 px-3 text-muted-foreground">
                      {task.subtasks.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                          <ListPlusIcon className="size-2.5" />
                          {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4 text-muted-foreground text-[11px] font-mono">
                      {task.dueDate ? (
                        new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
