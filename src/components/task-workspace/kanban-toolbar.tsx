"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDownIcon,
  ChevronsLeftRightIcon,
  FilterIcon,
  KanbanIcon,
  LayoutListIcon,
  PlusIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import { useTodoStore } from "@/stores/todo-store";
import type { DueDateFilterOption, SortOption } from "@/lib/kanban-utils";
import { KANBAN_COLUMNS } from "@/lib/kanban-utils";

interface KanbanToolbarProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  activeCount: number;
  completedCount: number;
  hideViewModeToggle?: boolean;
}

export function KanbanToolbar({
  title,
  description,
  icon,
  activeCount,
  completedCount,
  hideViewModeToggle = false,
}: KanbanToolbarProps) {
  const {
    viewMode,
    setViewMode,
    priorityFilter,
    setPriorityFilter,
    dueDateFilter,
    setDueDateFilter,
    columnStatusFilter,
    setColumnStatusFilter,
    sortOption,
    setSortOption,
    searchQuery,
    setSearchQuery,
    selectedProjectId,
    setSelectedProjectId,
    projects,
    resetFilters,
    cardDensity,
    setCardDensity,
    showProgressSummary,
    setShowProgressSummary,
    showDescriptionPreview,
    setShowDescriptionPreview,
    showSubtasksPreview,
    setShowSubtasksPreview,
    hideCompletedColumn,
    setHideCompletedColumn,
    collapseAllColumns,
    openCreateDialog,
  } = useTodoStore();

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    priorityFilter !== "all" ||
    dueDateFilter !== "all" ||
    columnStatusFilter !== "all" ||
    selectedProjectId !== null ||
    sortOption !== "manual";

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: Title & Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {icon}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <Badge variant="outline" className="font-mono text-xs px-2 py-0">
              {activeCount} active
            </Badge>
            {completedCount > 0 && (
              <Badge variant="secondary" className="font-mono text-xs px-2 py-0">
                {completedCount} done
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>

        {/* View Switcher & Primary Action */}
        <div className="flex flex-wrap items-center gap-2">
          {!hideViewModeToggle && (
            <div className="flex items-center rounded-lg border border-border bg-secondary/30 p-0.5">
              <Button
                type="button"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={`h-7 px-2.5 text-xs gap-1.5 cursor-pointer ${
                  viewMode === "list"
                    ? "bg-background text-foreground shadow-2xs font-medium"
                    : "text-muted-foreground"
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
                  viewMode === "kanban"
                    ? "bg-background text-foreground shadow-2xs font-medium"
                    : "text-muted-foreground"
                }`}
                title="Kanban Board view"
              >
                <KanbanIcon className="size-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
            </div>
          )}

          {/* Primary Create Task button */}
          <Button
            type="button"
            size="sm"
            onClick={() => openCreateDialog("todo")}
            className="h-7 px-3 text-xs gap-1.5 font-medium cursor-pointer"
          >
            <PlusIcon className="size-3.5" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Middle row: Search, Filter pills, Sort, and Customization menu */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative w-full sm:w-56">
            <SearchIcon className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="h-7 pl-8 pr-7 text-xs bg-secondary/30 border-border/80"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>

          {/* Linear-style Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant={hasActiveFilters ? "default" : "outline"}
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5 border-border/80 cursor-pointer"
              >
                <FilterIcon className="size-3" />
                <span>Filter</span>
                {hasActiveFilters && (
                  <span className="flex size-1.5 rounded-full bg-primary-foreground" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 text-xs">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                Priority
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={priorityFilter}
                onValueChange={(val) => setPriorityFilter(val as typeof priorityFilter)}
              >
                <DropdownMenuRadioItem value="all">All Priorities</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="urgent">Urgent</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                Due Date
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={dueDateFilter}
                onValueChange={(val) => setDueDateFilter(val as DueDateFilterOption)}
              >
                <DropdownMenuRadioItem value="all">All Dates</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="overdue">Overdue</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="today">Due Today</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="upcoming">Upcoming</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="no-date">No Due Date</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                Status Column
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={columnStatusFilter}
                onValueChange={setColumnStatusFilter}
              >
                <DropdownMenuRadioItem value="all">All Columns</DropdownMenuRadioItem>
                {KANBAN_COLUMNS.map((col) => (
                  <DropdownMenuRadioItem key={col.id} value={col.id}>
                    {col.title}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>

              {projects.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Project
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup
                    value={selectedProjectId || "all"}
                    onValueChange={(val) => setSelectedProjectId(val === "all" ? null : val)}
                  >
                    <DropdownMenuRadioItem value="all">All Projects</DropdownMenuRadioItem>
                    {projects.map((p) => (
                      <DropdownMenuRadioItem key={p.id} value={p.id}>
                        {p.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5 border-border/80 cursor-pointer"
              >
                <ArrowUpDownIcon className="size-3" />
                <span className="capitalize">
                  {sortOption === "manual" ? "Sort" : sortOption}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 text-xs">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                Order by
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sortOption}
                onValueChange={(val) => setSortOption(val as SortOption)}
              >
                <DropdownMenuRadioItem value="manual">
                  Manual (Drag & Drop)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="priority">
                  Priority (Urgent first)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dueDate">
                  Due Date (Earliest first)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="createdAt">
                  Creation Date (Newest first)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title">
                  Title (A to Z)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Board Customization Menu */}
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1.5 border-border/80 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Board Customization"
              >
                <SlidersHorizontalIcon className="size-3" />
                <span className="hidden sm:inline">Customize</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                Card Density
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={cardDensity}
                onValueChange={(val) => setCardDensity(val as typeof cardDensity)}
              >
                <DropdownMenuRadioItem value="comfortable">
                  Comfortable
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="compact">
                  Compact
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                Display Options
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={showProgressSummary}
                onCheckedChange={setShowProgressSummary}
              >
                Progress Summary Bar
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showDescriptionPreview}
                onCheckedChange={setShowDescriptionPreview}
              >
                Description Snippet
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showSubtasksPreview}
                onCheckedChange={setShowSubtasksPreview}
              >
                Subtask Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={hideCompletedColumn}
                onCheckedChange={setHideCompletedColumn}
              >
                Hide Done Column
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => collapseAllColumns(true)}>
                <ChevronsLeftRightIcon className="size-3 mr-2" />
                Collapse All Columns
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => collapseAllColumns(false)}>
                <ChevronsLeftRightIcon className="size-3 mr-2" />
                Expand All Columns
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Chips Bar (Shown when any filter is active) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-0.5">
          <span className="text-[11px] text-muted-foreground mr-1">Active filters:</span>

          {searchQuery && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px]">
              <span>Search: &quot;{searchQuery}&quot;</span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="hover:text-destructive cursor-pointer"
              >
                <XIcon className="size-2.5" />
              </button>
            </Badge>
          )}

          {priorityFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px] capitalize">
              <span>Priority: {priorityFilter}</span>
              <button
                type="button"
                onClick={() => setPriorityFilter("all")}
                className="hover:text-destructive cursor-pointer"
              >
                <XIcon className="size-2.5" />
              </button>
            </Badge>
          )}

          {dueDateFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px] capitalize">
              <span>Due: {dueDateFilter}</span>
              <button
                type="button"
                onClick={() => setDueDateFilter("all")}
                className="hover:text-destructive cursor-pointer"
              >
                <XIcon className="size-2.5" />
              </button>
            </Badge>
          )}

          {columnStatusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px] capitalize">
              <span>Column: {columnStatusFilter}</span>
              <button
                type="button"
                onClick={() => setColumnStatusFilter("all")}
                className="hover:text-destructive cursor-pointer"
              >
                <XIcon className="size-2.5" />
              </button>
            </Badge>
          )}

          {selectedProjectId && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px]">
              <span>
                Project: {projects.find((p) => p.id === selectedProjectId)?.name || "Selected"}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="hover:text-destructive cursor-pointer"
              >
                <XIcon className="size-2.5" />
              </button>
            </Badge>
          )}

          {sortOption !== "manual" && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px] capitalize">
              <span>Sort: {sortOption}</span>
              <button
                type="button"
                onClick={() => setSortOption("manual")}
                className="hover:text-destructive cursor-pointer"
              >
                <XIcon className="size-2.5" />
              </button>
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Reset all
          </Button>
        </div>
      )}
    </div>
  );
}
