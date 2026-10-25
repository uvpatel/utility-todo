"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ListTodoIcon } from "lucide-react";
import { useTodoStore } from "@/stores/todo-store";
import { TaskItemCard } from "./task-item-card";
import type { TodoWithDetails } from "@/lib/actions/todos";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface TaskListViewProps {
  tasks: TodoWithDetails[];
}

export function TaskListView({ tasks }: TaskListViewProps) {
  const {
    toggleTask,
    updateTask,
    duplicateTask,
    deleteTask,
    setSelectedTaskId,
    clearCompleted,
    reorderTasks,
    searchQuery,
  } = useTodoStore();

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(tasks, oldIndex, newIndex);
        reorderTasks(newOrder.map((t) => t.id));
      }
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 py-3.5">
        <div>
          <CardTitle className="text-base font-semibold">
            Tasks ({tasks.length})
          </CardTitle>
          <CardDescription className="text-xs">
            {tasks.filter((t) => !t.completed).length} incomplete in current view
          </CardDescription>
        </div>

        {completedCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearCompleted}
            className="h-8 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
          >
            Clear Completed
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground mb-3">
              <ListTodoIcon className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">No tasks in this view</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {searchQuery
                ? "No tasks match your search filter."
                : "Add a task using the input above or press ⌘K to open the command palette."}
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-border/40">
                {tasks.map((task) => (
                  <TaskItemCard
                    key={task.id}
                    task={task}
                    variant="list"
                    onToggle={toggleTask}
                    onSelect={setSelectedTaskId}
                    onUpdate={updateTask}
                    onDuplicate={duplicateTask}
                    onDelete={deleteTask}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
