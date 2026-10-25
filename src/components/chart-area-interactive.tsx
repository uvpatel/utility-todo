"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export interface TaskChartItem {
  date: string;
  created: number;
  completed: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomNotionTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const formattedDate = label
      ? new Date(label).toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : "";

    return (
      <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-xs text-popover-foreground">
        <p className="font-semibold text-foreground mb-1.5">{formattedDate}</p>
        <div className="space-y-1">
          {payload.map((item) => (
            <div key={item.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground capitalize">{item.name}</span>
              </div>
              <span className="font-mono font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function ChartAreaInteractive({
  data = [],
}: {
  data?: TaskChartItem[];
}) {
  const [timeRange, setTimeRange] = React.useState<"7d" | "14d">("14d");

  const chartData = React.useMemo(() => {
    if (data.length > 0) return data;
    const fallback: TaskChartItem[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      fallback.push({
        date: d.toISOString().split("T")[0],
        created: 0,
        completed: 0,
      });
    }
    return fallback;
  }, [data]);

  const filteredData = React.useMemo(() => {
    const days = timeRange === "7d" ? 7 : 14;
    return chartData.slice(-days);
  }, [chartData, timeRange]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">Task Throughput</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Live Activity
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tasks created vs completed over time from your PostgreSQL database
          </p>
        </div>

        {/* Time range buttons */}
        <div className="flex items-center rounded-lg border border-border bg-secondary/60 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTimeRange("14d")}
            className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
              timeRange === "14d"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Last 14 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("7d")}
            className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
              timeRange === "7d"
                ? "bg-card text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Last 7 Days
          </button>
        </div>
      </div>

      <div className="mt-6 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="notionCreatedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2383E2" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2383E2" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="notionCompletedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2A9D8F" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#2A9D8F" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tickMargin={8}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              tickFormatter={(val) => {
                const d = new Date(val);
                return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
              }}
            />
            <Tooltip content={<CustomNotionTooltip />} />
            <Area
              dataKey="created"
              name="Created"
              type="monotone"
              stroke="#2383E2"
              strokeWidth={2}
              fill="url(#notionCreatedGrad)"
            />
            <Area
              dataKey="completed"
              name="Completed"
              type="monotone"
              stroke="#2A9D8F"
              strokeWidth={2}
              fill="url(#notionCompletedGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend below chart */}
      <div className="mt-4 flex items-center justify-end gap-6 text-xs text-muted-foreground pt-3 border-t border-border/60">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#2383E2]" />
          <span>Tasks Created</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#2A9D8F]" />
          <span>Tasks Completed</span>
        </div>
      </div>
    </div>
  );
}
