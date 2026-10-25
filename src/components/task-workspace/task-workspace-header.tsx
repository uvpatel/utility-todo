"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  KanbanIcon,
  LayoutListIcon,
  SearchIcon,
} from "lucide-react";
import { useTodoStore } from "@/stores/todo-store";

interface TaskWorkspaceHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  activeCount: number;
  completedCount: number;
  hideViewModeToggle?: boolean;
}

export function TaskWorkspaceHeader({
  title,
  description,
  icon,
  activeCount,
  completedCount,
  hideViewModeToggle = false,
}: TaskWorkspaceHeaderProps) {
  const {
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    searchQuery,
    setSearchQuery,
  } = useTodoStore();

  return (
    <div className="flex flex-col gap-4">
      {/* Title & View switcher bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {icon}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Active / Done badges */}
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="px-2.5 py-0.5 font-mono text-xs">
              {activeCount} active
            </Badge>
            <Badge variant="secondary" className="px-2.5 py-0.5 font-mono text-xs">
              {completedCount} done
            </Badge>
          </div>

          {/* List / Kanban Mode Toggle */}
          {!hideViewModeToggle && (
            <div className="flex items-center rounded-lg border border-border bg-secondary/30 p-0.5">
              <Button
                type="button"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-7 px-2.5 text-xs gap-1.5 cursor-pointer ${
                  viewMode === "list" ? "bg-background text-foreground shadow-xs font-medium" : "text-muted-foreground"
                }`}
                title="List view"
              >
                <LayoutListIcon className="size-3.5" />
                <span className="hidden sm:inline">List</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className={`h-7 px-2.5 text-xs gap-1.5 cursor-pointer ${
                  viewMode === "kanban" ? "bg-background text-foreground shadow-xs font-medium" : "text-muted-foreground"
                }`}
                title="Kanban Board view"
              >
                <KanbanIcon className="size-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "active", "completed"] as const).map((status) => (
            <Button
              key={status}
              type="button"
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="h-7 text-xs capitalize cursor-pointer px-2.5"
            >
              {status}
            </Button>
          ))}

          <Separator orientation="vertical" className="mx-1 h-4" />

          {(["all", "urgent", "high", "medium", "low"] as const).map((p) => (
            <Button
              key={p}
              type="button"
              variant={priorityFilter === p ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setPriorityFilter(p)}
              className={`h-7 text-xs capitalize cursor-pointer px-2.5 ${
                priorityFilter === p ? "border border-border font-medium bg-card" : "text-muted-foreground"
              }`}
            >
              {p}
            </Button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="h-8 pl-8 text-xs bg-secondary/30"
          />
        </div>
      </div>
    </div>
  );
}
