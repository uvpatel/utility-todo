"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  CheckIcon,
  CircleIcon,
  ListTodoIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { useTodoStore, type TodoFilter } from "@/stores/todo-store"

const filterLabels: Record<TodoFilter, string> = {
  all: "All",
  active: "Active",
  completed: "Completed",
}

export default function TodoPage() {
  const todos = useTodoStore((state) => state.todos)
  const draft = useTodoStore((state) => state.draft)
  const filter = useTodoStore((state) => state.filter)
  const addTodo = useTodoStore((state) => state.addTodo)
  const toggleTodo = useTodoStore((state) => state.toggleTodo)
  const removeTodo = useTodoStore((state) => state.removeTodo)
  const renameTodo = useTodoStore((state) => state.renameTodo)
  const toggleAll = useTodoStore((state) => state.toggleAll)
  const clearCompleted = useTodoStore((state) => state.clearCompleted)
  const setDraft = useTodoStore((state) => state.setDraft)
  const setFilter = useTodoStore((state) => state.setFilter)

  const activeCount = todos.filter((todo) => !todo.completed).length
  const completedCount = todos.length - activeCount
  const visibleTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed
    if (filter === "completed") return todo.completed
    return true
  })

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <main className="flex min-h-screen flex-1 flex-col gap-6 p-4 md:p-6">
          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-border/60 bg-background/95 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ListTodoIcon className="size-4" />
                  Protected workspace
                </div>
                <CardTitle className="text-3xl tracking-tight">Todo route</CardTitle>
                <CardDescription className="max-w-2xl text-base">
                  Zustand owns the todo list, the draft input, the filter state, and the bulk actions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        addTodo()
                      }
                    }}
                    placeholder="Add a todo and press Enter"
                    className="h-11"
                  />
                  <Button onClick={addTodo} className="h-11 shrink-0">
                    <PlusIcon className="size-4" />
                    Add todo
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(["all", "active", "completed"] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={filter === value ? "default" : "outline"}
                      onClick={() => setFilter(value)}
                      className="h-9"
                    >
                      {filterLabels[value]}
                    </Button>
                  ))}
                  <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary">{activeCount} active</Badge>
                    <Badge variant="secondary">{completedCount} done</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardDescription>Open items</CardDescription>
                  <CardTitle className="text-4xl">{activeCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardDescription>Completed items</CardDescription>
                  <CardTitle className="text-4xl">{completedCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          </section>

          <Card className="border-border/60 bg-background/95 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>{visibleTodos.length} items in the current view</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleAll(true)}
                  disabled={!todos.length}
                >
                  Mark all done
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => toggleAll(false)}
                  disabled={!todos.length}
                >
                  Mark all active
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={clearCompleted}
                  disabled={!completedCount}
                >
                  Clear completed
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleTodos.length ? (
                visibleTodos.map((todo, index) => (
                  <div key={todo.id}>
                    {index > 0 ? <Separator className="mb-3" /> : null}
                    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 md:flex-row md:items-center">
                      <button
                        type="button"
                        onClick={() => toggleTodo(todo.id)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background transition hover:border-primary"
                        aria-label={todo.completed ? "Mark todo as active" : "Mark todo as completed"}
                      >
                        {todo.completed ? (
                          <CheckIcon className="size-4 text-primary" />
                        ) : (
                          <CircleIcon className="size-4 text-muted-foreground" />
                        )}
                      </button>
                      <input
                        value={todo.title}
                        onChange={(event) => renameTodo(todo.id, event.target.value)}
                        className={`min-h-10 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm outline-none transition focus:border-border focus:bg-background ${
                          todo.completed ? "text-muted-foreground line-through" : "text-foreground"
                        }`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTodo(todo.id)}
                        aria-label="Remove todo"
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                  No todos match the current filter.
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}