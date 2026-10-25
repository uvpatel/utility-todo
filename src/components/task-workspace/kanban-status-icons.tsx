import * as React from "react";
import type { Priority } from "@/lib/validations/todo";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export function BacklogStatusIcon({ className = "size-3.5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 2"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="6.25" />
    </svg>
  );
}

export function TodoStatusIcon({ className = "size-3.5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="6.25" />
    </svg>
  );
}

export function InProgressStatusIcon({ className = "size-3.5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="6.25" />
      <path
        d="M8 1.75 A 6.25 6.25 0 0 1 14.25 8 L 8 8 Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export function InReviewStatusIcon({ className = "size-3.5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="6.25" strokeDasharray="5 2" />
      <circle cx="8" cy="8" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function DoneStatusIcon({ className = "size-3.5", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="8" cy="8" r="6.25" fill="currentColor" className="fill-emerald-500/20" />
      <path
        d="M5 8.25 L7 10.25 L11 6"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function getStatusIcon(status: string, className = "size-3.5") {
  switch (status) {
    case "backlog":
      return <BacklogStatusIcon className={`${className} text-zinc-400 dark:text-zinc-500`} />;
    case "todo":
      return <TodoStatusIcon className={`${className} text-sky-500 dark:text-sky-400`} />;
    case "in_progress":
      return <InProgressStatusIcon className={`${className} text-amber-500 dark:text-amber-400`} />;
    case "in_review":
      return <InReviewStatusIcon className={`${className} text-purple-500 dark:text-purple-400`} />;
    case "done":
    case "completed":
      return <DoneStatusIcon className={`${className} text-emerald-500 dark:text-emerald-400`} />;
    default:
      return <TodoStatusIcon className={`${className} text-muted-foreground`} />;
  }
}

/**
 * Linear-inspired priority signal bars
 */
export function PrioritySignalIcon({
  priority,
  className = "h-3 w-3.5",
}: {
  priority: Priority | string;
  className?: string;
}) {
  switch (priority) {
    case "urgent":
      return (
        <span title="Urgent Priority" className="inline-flex items-center">
          <svg
            viewBox="0 0 14 12"
            fill="currentColor"
            className={`${className} text-rose-500`}
            aria-label="Urgent Priority"
          >
            <rect x="1" y="7" width="2.5" height="5" rx="0.75" />
            <rect x="5" y="4" width="2.5" height="8" rx="0.75" />
            <rect x="9" y="1" width="2.5" height="11" rx="0.75" />
          </svg>
        </span>
      );
    case "high":
      return (
        <span title="High Priority" className="inline-flex items-center">
          <svg
            viewBox="0 0 14 12"
            fill="currentColor"
            className={`${className} text-amber-500`}
            aria-label="High Priority"
          >
            <rect x="1" y="7" width="2.5" height="5" rx="0.75" />
            <rect x="5" y="4" width="2.5" height="8" rx="0.75" />
            <rect x="9" y="1" width="2.5" height="11" rx="0.75" opacity="0.25" />
          </svg>
        </span>
      );
    case "medium":
      return (
        <span title="Medium Priority" className="inline-flex items-center">
          <svg
            viewBox="0 0 14 12"
            fill="currentColor"
            className={`${className} text-sky-500`}
            aria-label="Medium Priority"
          >
            <rect x="1" y="7" width="2.5" height="5" rx="0.75" />
            <rect x="5" y="4" width="2.5" height="8" rx="0.75" opacity="0.25" />
            <rect x="9" y="1" width="2.5" height="11" rx="0.75" opacity="0.25" />
          </svg>
        </span>
      );
    case "low":
    default:
      return (
        <span title="Low Priority" className="inline-flex items-center">
          <svg
            viewBox="0 0 14 12"
            fill="currentColor"
            className={`${className} text-muted-foreground/50`}
            aria-label="Low Priority"
          >
            <rect x="1" y="7" width="2.5" height="5" rx="0.75" />
            <rect x="5" y="4" width="2.5" height="8" rx="0.75" opacity="0.2" />
            <rect x="9" y="1" width="2.5" height="11" rx="0.75" opacity="0.2" />
          </svg>
        </span>
      );
  }
}
