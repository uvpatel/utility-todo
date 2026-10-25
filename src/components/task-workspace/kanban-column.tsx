"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckIcon,
  ChevronRightIcon,
  ChevronsLeftRightIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SlidersIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import type { TodoWithDetails } from "@/lib/actions/todos";
import type { KanbanColumnConfig } from "@/lib/kanban-utils";
import { getStatusIcon } from "./kanban-status-icons";
import { KanbanTaskCard } from "./kanban-task-card";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTodoStore } from "@/stores/todo-store";

interface KanbanColumnProps {
  column: KanbanColumnConfig;
  tasks: TodoWithDetails[];
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const {
    createTask,
    clearCompleted,
    collapsedColumns,
    toggleColumnCollapse,
    wipLimits,
    setColumnWipLimit,
  } = useTodoStore();

  const isCollapsed = !!collapsedColumns[column.id];
  const wipLimit = wipLimits[column.id] || 0;
  const isOverWipLimit = wipLimit > 0 && tasks.length > wipLimit;

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const [isAdding, setIsAdding] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isEditingWip, setIsEditingWip] = React.useState(false);
  const [wipInput, setWipInput] = React.useState(wipLimit > 0 ? String(wipLimit) : "");

  const handleQuickSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await createTask(trimmed, { status: column.status as TodoWithDetails["status"] });
      setNewTitle("");
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveWip = () => {
    const num = parseInt(wipInput.trim(), 10);
    if (!isNaN(num) && num > 0) {
      setColumnWipLimit(column.id, num);
    } else {
      setColumnWipLimit(column.id, 0);
    }
    setIsEditingWip(false);
  };

  // Collapsed state ribbon
  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        onClick={() => toggleColumnCollapse(column.id)}
        className="group relative flex flex-col items-center justify-between py-4 px-2 rounded-xl border border-border/70 bg-secondary/15 hover:bg-secondary/30 transition-all duration-150 cursor-pointer min-h-[460px] w-11 shrink-0 select-none"
        title={`Click to expand ${column.title}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-6 items-center justify-center rounded-md bg-secondary/60">
            {getStatusIcon(column.status, "size-4")}
          </div>

          <Badge
            variant="outline"
            className="font-mono text-[10px] px-1 py-0 bg-background"
          >
            {tasks.length}
          </Badge>
        </div>

        {/* Rotated column title */}
        <div className="flex-1 flex items-center justify-center py-6">
          <span className="transform -rotate-90 whitespace-nowrap text-xs font-semibold tracking-wider text-muted-foreground group-hover:text-foreground transition-colors uppercase">
            {column.title}
          </span>
        </div>

        <ChevronRightIcon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    );
  }

  // Expanded column
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl border bg-secondary/10 transition-all duration-150 min-h-[480px] max-h-[calc(100vh-230px)] w-full min-w-[280px] max-w-[340px] shrink-0 ${
        isOver
          ? "border-primary/70 bg-primary/5 ring-1 ring-primary/40 shadow-sm"
          : "border-border/70 hover:border-border"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/40 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-5 shrink-0 items-center justify-center">
            {getStatusIcon(column.status, "size-4")}
          </div>

          <h3 className="text-xs font-semibold tracking-tight text-foreground uppercase truncate">
            {column.title}
          </h3>

          {/* Count Badge / WIP Limit */}
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={`font-mono text-[10px] px-1.5 py-0 font-medium ${
                isOverWipLimit
                  ? "bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400"
                  : column.badgeColor
              }`}
            >
              {tasks.length}
              {wipLimit > 0 && <span className="opacity-75">/{wipLimit}</span>}
            </Badge>

            {isOverWipLimit && (
              <span
                className="text-[9px] font-medium text-rose-500 hidden sm:inline"
                title="WIP limit exceeded"
              >
                Limit!
              </span>
            )}
          </div>
        </div>

        {/* Column Actions: Quick Add & Menu */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsAdding(!isAdding)}
            className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
            title={`Add task to ${column.title}`}
            aria-label={`Add task to ${column.title}`}
          >
            <PlusIcon className="size-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={`${column.title} column menu`}
              >
                <MoreHorizontalIcon className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuItem onClick={() => setIsAdding(true)}>
                <PlusIcon className="size-3.5 mr-2" />
                Add Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingWip(true)}>
                <SlidersIcon className="size-3.5 mr-2" />
                {wipLimit > 0 ? `Edit WIP Limit (${wipLimit})` : "Set WIP Limit"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleColumnCollapse(column.id)}>
                <ChevronsLeftRightIcon className="size-3.5 mr-2" />
                Collapse Column
              </DropdownMenuItem>
              {column.id === "done" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={clearCompleted}
                  >
                    <Trash2Icon className="size-3.5 mr-2" />
                    Clear Completed
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inline WIP Limit Editor */}
      {isEditingWip && (
        <div className="p-2 border-b border-border/40 bg-card text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-[11px] text-muted-foreground">Limit:</span>
            <Input
              type="number"
              min="0"
              max="99"
              value={wipInput}
              onChange={(e) => setWipInput(e.target.value)}
              placeholder="0 (no limit)"
              className="h-7 text-xs w-24 bg-background"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveWip();
                if (e.key === "Escape") setIsEditingWip(false);
              }}
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setIsEditingWip(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-2.5 text-xs font-medium"
              onClick={handleSaveWip}
            >
              Save
            </Button>
          </div>
        </div>
      )}

      {/* Inline Quick Add inside Column */}
      {isAdding && (
        <div className="p-2.5 border-b border-border/40 bg-card shadow-2xs">
          <form onSubmit={handleQuickSubmit} className="space-y-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={`Task in ${column.title}...`}
              autoFocus
              className="h-8 text-xs bg-background"
              disabled={isSubmitting}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsAdding(false);
                  setNewTitle("");
                }
              }}
            />
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground cursor-pointer"
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle("");
                }}
              >
                <XIcon className="size-3 mr-1" />
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!newTitle.trim() || isSubmitting}
                className="h-7 px-2.5 text-xs font-medium cursor-pointer"
              >
                <CheckIcon className="size-3 mr-1" />
                Add
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Task Cards Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanTaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 py-10 px-4 text-center">
            <p className="text-[11px] text-muted-foreground">
              No tasks in {column.title}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="mt-2 h-6 px-2 text-[10px] text-primary hover:text-primary/80 cursor-pointer"
            >
              + Add a task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
