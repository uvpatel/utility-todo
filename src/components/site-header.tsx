"use client";

import * as React from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SearchIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader({ title }: { title?: string }) {
  const pathname = usePathname();

  const headerTitle = React.useMemo(() => {
    if (title) return title;
    if (pathname === "/dashboard") return "Dashboard & Analytics";
    if (pathname === "/github") return "GitHub Workspace & Productivity";
    if (pathname.startsWith("/settings/integrations")) return "Settings & Integrations";
    if (pathname === "/todo/my-day") return "My Day";
    if (pathname === "/todo/upcoming") return "Upcoming Tasks";
    if (pathname === "/todo/completed") return "Completed Archive";
    if (pathname === "/todo/kanban") return "Kanban Board";
    return "Workspace";
  }, [title, pathname]);

  const handleOpenSearch = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground cursor-pointer" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-sm font-medium tracking-tight text-foreground">{headerTitle}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleOpenSearch}
          className="hidden items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer sm:flex transition-colors"
          title="Search tasks (⌘K)"
        >
          <SearchIcon className="size-3.5" />
          <span>Quick search</span>
          <kbd className="ml-1.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
            ⌘K
          </kbd>
        </button>

        <ThemeToggle />

        {pathname !== "/todo" && (
          <Link
            href="/todo"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <SparklesIcon className="size-3.5" />
            <span>Open Tasks</span>
          </Link>
        )}
      </div>
    </header>
  );
}
