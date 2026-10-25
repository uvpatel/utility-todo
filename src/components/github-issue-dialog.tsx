"use client";

import * as React from "react";
import {
  CalendarIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  GitPullRequestIcon,
  ListPlusIcon,
  PlusIcon,
  TagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  convertGitHubIssueToTask,
  getRepositoryIssues,
} from "@/lib/actions/github";
import type { GitHubIssueDTO } from "@/lib/integrations/github";
import type { Priority } from "@/lib/validations/todo";
import { toast } from "sonner";

interface GitHubIssueDialogProps {
  repoFullName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: (taskId: string) => void;
}

export function GitHubIssueDialog({
  repoFullName,
  open,
  onOpenChange,
  onTaskCreated,
}: GitHubIssueDialogProps) {
  const [issues, setIssues] = React.useState<GitHubIssueDTO[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedIssue, setSelectedIssue] = React.useState<GitHubIssueDTO | null>(null);
  const [taskPriority, setTaskPriority] = React.useState<Priority>("high");
  const [taskDueDate, setTaskDueDate] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [convertedMap, setConvertedMap] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!open || !repoFullName) return;

    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        setIsLoading(true);
        setSelectedIssue(null);
      }
    });

    getRepositoryIssues(repoFullName)
      .then((data) => {
        if (isMounted) {
          setIssues(data);
          if (data.length > 0) {
            setSelectedIssue(data[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load repo issues:", err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, repoFullName]);

  const handleConvert = async () => {
    if (!selectedIssue || !repoFullName || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await convertGitHubIssueToTask({
        repoFullName,
        issueNumber: selectedIssue.number,
        title: selectedIssue.title,
        body: selectedIssue.body,
        htmlUrl: selectedIssue.htmlUrl,
        priority: taskPriority,
        dueDate: taskDueDate || null,
      });

      setConvertedMap((prev) => ({
        ...prev,
        [selectedIssue.id]: res.id,
      }));

      toast.success(`Converted #${selectedIssue.number} into task!`);
      onTaskCreated?.(res.id);
    } catch {
      toast.error("Failed to convert issue to task");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2 text-foreground">
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <GitPullRequestIcon className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                {repoFullName} — Open Issues
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Select an issue to convert directly into a prioritized task with automated checklist steps.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-1 min-h-[380px] overflow-hidden">
          {/* Left: Issue List */}
          <div className="w-2/5 border-r border-border/60 overflow-y-auto divide-y divide-border/40 p-2 space-y-1 bg-secondary/10">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Loading issues...
              </div>
            ) : issues.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No open issues found in this repository.
              </div>
            ) : (
              issues.map((issue) => {
                const isSelected = selectedIssue?.id === issue.id;
                const isConverted = !!convertedMap[issue.id];

                return (
                  <div
                    key={issue.id}
                    onClick={() => setSelectedIssue(issue)}
                    className={`rounded-lg p-2.5 cursor-pointer transition-colors text-xs ${
                      isSelected
                        ? "bg-secondary text-foreground font-medium shadow-xs"
                        : "hover:bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                        #{issue.number}
                      </span>
                      {isConverted && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-emerald-500 text-emerald-600">
                          Converted
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 leading-snug text-foreground font-medium">
                      {issue.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                      <span>@{issue.author}</span>
                      {issue.labels.slice(0, 2).map((label) => (
                        <Badge key={label} variant="secondary" className="text-[9px] px-1 py-0">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Issue Preview & Conversion Config */}
          <div className="w-3/5 p-6 overflow-y-auto flex flex-col justify-between space-y-4">
            {selectedIssue ? (
              <>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                        Issue #{selectedIssue.number}
                      </span>
                      <a
                        href={selectedIssue.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        <span>Open on GitHub</span>
                        <ExternalLinkIcon className="size-3" />
                      </a>
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-1">
                      {selectedIssue.title}
                    </h3>
                  </div>

                  {selectedIssue.body && (
                    <div className="rounded-xl border border-border/80 bg-secondary/30 p-3.5 text-xs text-foreground/90 whitespace-pre-wrap max-h-44 overflow-y-auto font-sans leading-relaxed">
                      {selectedIssue.body}
                    </div>
                  )}

                  {/* Task Configuration Controls */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <span className="text-xs font-medium text-foreground">Task Settings</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5">
                        <TagIcon className="size-3.5 text-muted-foreground" />
                        <select
                          value={taskPriority}
                          onChange={(e) => setTaskPriority(e.target.value as Priority)}
                          className="bg-transparent text-xs text-foreground outline-none cursor-pointer w-full capitalize"
                        >
                          <option value="low" className="bg-card">Low Priority</option>
                          <option value="medium" className="bg-card">Medium Priority</option>
                          <option value="high" className="bg-card">High Priority</option>
                          <option value="urgent" className="bg-card">Urgent</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5">
                        <CalendarIcon className="size-3.5 text-muted-foreground" />
                        <input
                          type="date"
                          value={taskDueDate}
                          onChange={(e) => setTaskDueDate(e.target.value)}
                          className="bg-transparent text-xs text-foreground outline-none cursor-pointer w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion Button */}
                <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <ListPlusIcon className="size-3.5" />
                    <span>Auto-generates 4 checklist steps</span>
                  </div>

                  <Button
                    onClick={handleConvert}
                    disabled={isSubmitting || !!convertedMap[selectedIssue.id]}
                    className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
                  >
                    {convertedMap[selectedIssue.id] ? (
                      <>
                        <CheckCircle2Icon className="size-4 text-emerald-500" />
                        <span>Task Created</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="size-4" />
                        <span>{isSubmitting ? "Converting..." : "Convert to Task"}</span>
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-xs text-muted-foreground">
                Select an issue on the left to preview details.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
