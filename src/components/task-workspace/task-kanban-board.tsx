"use client";

import * as React from "react";
import { useTodoStore } from "@/stores/todo-store";
import type { TodoWithDetails } from "@/lib/actions/todos";
import {
  filterTasks,
  groupTasksByColumn,
  KANBAN_COLUMNS,
  type KanbanColumnId,
} from "@/lib/kanban-utils";
import { KanbanColumn } from "./kanban-column";
import { KanbanTaskCard } from "./kanban-task-card";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { KanbanIcon, PlusIcon } from "lucide-react";

interface TaskKanbanBoardProps {
  tasks: TodoWithDetails[];
}

export function TaskKanbanBoard({ tasks }: TaskKanbanBoardProps) {
  const {
    moveTaskStatusAndOrder,
    openCreateDialog,
    priorityFilter,
    dueDateFilter,
    columnStatusFilter,
    selectedProjectId,
    searchQuery,
    sortOption,
    hideCompletedColumn,
    resetFilters,
  } = useTodoStore();

  const [activeTask, setActiveTask] = React.useState<TodoWithDetails | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 1. Filter tasks
  const filteredTasks = React.useMemo(() => {
    return filterTasks(tasks, {
      searchQuery,
      priorityFilter,
      selectedProjectId,
      dueDateFilter,
      columnStatusFilter,
    });
  }, [
    tasks,
    searchQuery,
    priorityFilter,
    selectedProjectId,
    dueDateFilter,
    columnStatusFilter,
  ]);

  // 2. Group into columns and apply current sort
  const columnTasksMap = React.useMemo(() => {
    return groupTasksByColumn(filteredTasks, sortOption);
  }, [filteredTasks, sortOption]);

  // Visible columns based on preferences
  const visibleColumns = React.useMemo(() => {
    return KANBAN_COLUMNS.filter((col) => {
      if (hideCompletedColumn && col.id === "done") return false;
      return true;
    });
  }, [hideCompletedColumn]);

  const findTaskColumn = (id: string): KanbanColumnId | null => {
    for (const col of visibleColumns) {
      if (columnTasksMap[col.id]?.some((t) => t.id === id)) {
        return col.id;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceCol = findTaskColumn(activeId);
    let targetCol: KanbanColumnId | null = null;

    if (visibleColumns.some((c) => c.id === overId)) {
      targetCol = overId as KanbanColumnId;
    } else {
      targetCol = findTaskColumn(overId);
    }

    if (!sourceCol || !targetCol) return;

    // Build the reordered column tasks
    const targetTasks = [...(columnTasksMap[targetCol] || [])];
    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    if (sourceCol === targetCol) {
      // Intra-column reorder
      const oldIndex = targetTasks.findIndex((t) => t.id === activeId);
      const newIndex = targetTasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        targetTasks.splice(oldIndex, 1);
        targetTasks.splice(newIndex, 0, activeTaskItem);
      }
    } else {
      // Cross-column move
      const targetIndex = targetTasks.findIndex((t) => t.id === overId);
      if (targetIndex !== -1) {
        targetTasks.splice(targetIndex, 0, activeTaskItem);
      } else {
        targetTasks.push(activeTaskItem);
      }
    }

    // Assemble the full updated list of all task IDs across all columns
    const allReorderedIds: string[] = [];
    for (const col of visibleColumns) {
      if (col.id === targetCol) {
        targetTasks.forEach((t) => allReorderedIds.push(t.id));
      } else {
        const colList = columnTasksMap[col.id] || [];
        colList
          .filter((t) => t.id !== activeId)
          .forEach((t) => allReorderedIds.push(t.id));
      }
    }

    // Persist optimistic status change and ordering
    await moveTaskStatusAndOrder(activeId, targetCol, allReorderedIds);
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40 my-6">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
          <KanbanIcon className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No tasks on this board yet</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          Plan, organize, and conquer your workflow with a visual Kanban board.
        </p>
        <Button
          type="button"
          size="sm"
          onClick={() => openCreateDialog("todo")}
          className="mt-4 gap-1.5 text-xs font-medium cursor-pointer"
        >
          <PlusIcon className="size-3.5" />
          <span>Create First Task</span>
        </Button>
      </div>
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/40 my-6">
        <h3 className="text-sm font-semibold text-foreground">No tasks match your filters</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Try adjusting your search query, priority, or due date filters.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="mt-4 text-xs cursor-pointer"
        >
          Reset Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-6 scrollbar-thin">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-start gap-3 min-w-max pb-2">
          {visibleColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={columnTasksMap[column.id] || []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <KanbanTaskCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
