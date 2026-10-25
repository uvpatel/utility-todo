"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, MonitorIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  className?: string;
  variant?: "ghost" | "outline";
  size?: "default" | "sm" | "icon";
}

export function ThemeToggle({
  className = "",
  variant = "ghost",
  size = "icon",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`size-8 rounded-lg text-muted-foreground transition-colors ${className}`}
        aria-label="Toggle theme"
        disabled
      >
        <span className="size-4 opacity-0" />
      </Button>
    );
  }

  const currentTheme = theme || "system";
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors ${className}`}
          aria-label="Select theme"
        >
          {isDark ? (
            <MoonIcon className="size-4 text-primary transition-transform duration-200" />
          ) : (
            <SunIcon className="size-4 text-amber-500 transition-transform duration-200" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 rounded-xl border-border bg-popover p-1 shadow-lg text-xs"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex items-center gap-2">
            <SunIcon className="size-3.5 text-amber-500" />
            <span>Light</span>
          </div>
          {currentTheme === "light" && (
            <CheckIcon className="size-3.5 text-primary" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex items-center gap-2">
            <MoonIcon className="size-3.5 text-primary" />
            <span>Dark</span>
          </div>
          {currentTheme === "dark" && (
            <CheckIcon className="size-3.5 text-primary" />
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs text-popover-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex items-center gap-2">
            <MonitorIcon className="size-3.5 text-muted-foreground" />
            <span>System</span>
          </div>
          {currentTheme === "system" && (
            <CheckIcon className="size-3.5 text-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
