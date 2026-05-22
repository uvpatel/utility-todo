"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TodoFilter = "all" | "active" | "completed"

export type TodoItem = {
  id: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

type TodoStore = {
  todos: TodoItem[]
  draft: string
  filter: TodoFilter
  addTodo: () => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
  renameTodo: (id: string, title: string) => void
  toggleAll: (completed: boolean) => void
  clearCompleted: () => void
  setDraft: (draft: string) => void
  setFilter: (filter: TodoFilter) => void
}

const createTodo = (title: string): TodoItem => {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    title: title.trim(),
    completed: false,
    createdAt: now,
    updatedAt: now,
  }
}

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      todos: [
        createTodo("Set up protected todo route"),
        createTodo("Move auth checks into a shared guard"),
      ],
      draft: "",
      filter: "all",
      addTodo: () => {
        const title = get().draft.trim()

        if (!title) {
          return
        }

        set((state) => ({
          todos: [createTodo(title), ...state.todos],
          draft: "",
        }))
      },
      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  completed: !todo.completed,
                  updatedAt: new Date().toISOString(),
                }
              : todo
          ),
        })),
      removeTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),
      renameTodo: (id, title) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  title: title.trim(),
                  updatedAt: new Date().toISOString(),
                }
              : todo
          ),
        })),
      toggleAll: (completed) =>
        set((state) => ({
          todos: state.todos.map((todo) => ({
            ...todo,
            completed,
            updatedAt: new Date().toISOString(),
          })),
        })),
      clearCompleted: () =>
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        })),
      setDraft: (draft) => set({ draft }),
      setFilter: (filter) => set({ filter }),
    }),
    {
      name: "better-auth-todo-store",
      partialize: (state) => ({
        todos: state.todos,
        draft: state.draft,
        filter: state.filter,
      }),
    }
  )
)