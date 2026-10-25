"use client";

import * as React from "react";
import Link from "next/link";
import { XIcon, ArrowRightIcon } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem("utility_todo_skip_banner_dismissed");
}

function getServerSnapshot() {
  return false;
}

export function DismissibleToast() {
  const isStoredVisible = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isDismissed, setIsDismissed] = React.useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("utility_todo_skip_banner_dismissed", "true");
    } catch {
      // ignore
    }
  };

  if (!isStoredVisible || isDismissed) return null;

  return (
    <div className="fixed right-6 top-18 z-40 hidden max-w-sm items-center gap-3 rounded-lg border border-[#E9E9E7] bg-white px-3.5 py-2.5 text-xs text-[#111111] shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:flex animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex flex-col">
        <span className="text-[#5F5E5B]">Skip this page next time?</span>
        <Link
          href="/todo"
          className="inline-flex items-center gap-1 font-medium text-[#2383E2] hover:text-[#0F6FCC]"
        >
          Always open app
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="ml-auto rounded p-1 text-[#9B9A97] hover:bg-[#F7F7F5] hover:text-[#111111] transition-colors cursor-pointer"
        aria-label="Dismiss banner"
      >
        <XIcon className="size-3.5" />
      </button>
    </div>
  );
}
