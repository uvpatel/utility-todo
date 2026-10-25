"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  CheckCircle2Icon,
  InboxIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SunIcon,
  XIcon,
} from "lucide-react";
import { useTodoStore, type WorkspaceView } from "@/stores/todo-store";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const {
    tasks,
    setActiveView,
    setSelectedProjectId,
    setSelectedTaskId,
    createTask,
  } = useTodoStore();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredTasks = search.trim()
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
      )
    : tasks.slice(0, 5);

  const handleNavigate = (view: WorkspaceView) => {
    setActiveView(view);
    setSelectedProjectId(null);
    setIsOpen(false);
    router.push("/todo");
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsOpen(false);
    router.push("/todo");
  };

  const handleQuickCreate = async () => {
    if (!search.trim()) return;
    await createTask(search.trim());
    setSearch("");
    setIsOpen(false);
    router.push("/todo");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-20 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Search header */}
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
          <SearchIcon className="size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filteredTasks.length === 0) {
                e.preventDefault();
                handleQuickCreate();
              }
            }}
            placeholder="Type a command or search tasks..."
            className="h-9 border-none bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
            autoFocus
          />
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </div>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
              <button
                onClick={() => handleNavigate("inbox")}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <InboxIcon className="size-3.5 text-blue-400" />
                Inbox
              </button>
              <button
                onClick={() => handleNavigate("my-day")}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <SunIcon className="size-3.5 text-amber-400" />
                My Day
              </button>
              <button
                onClick={() => handleNavigate("upcoming")}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <CalendarIcon className="size-3.5 text-indigo-400" />
                Upcoming
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push("/dashboard");
                }}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <LayoutDashboardIcon className="size-3.5 text-emerald-400" />
                Dashboard
              </button>
            </div>
          </div>

          {/* Matched tasks */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>{search.trim() ? "Search Results" : "Recent Tasks"}</span>
              <span className="font-mono">{filteredTasks.length}</span>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No tasks found. Press{" "}
                <button
                  onClick={handleQuickCreate}
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Enter to create &ldquo;{search}&rdquo;
                </button>
              </div>
            ) : (
              filteredTasks.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTask(t.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs text-foreground hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {t.completed ? (
                      <CheckCircle2Icon className="size-3.5 text-primary shrink-0" />
                    ) : (
                      <span className="size-2 rounded-full bg-muted-foreground shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        t.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {t.project && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                        style={{ borderColor: t.project.color }}
                      >
                        {t.project.name}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] capitalize px-1.5 py-0">
                      {t.priority}
                    </Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/70 bg-secondary/20 px-4 py-2 text-[11px] text-muted-foreground">
          <span>Navigate with arrows</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
