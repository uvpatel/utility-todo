"use client";

import * as React from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FolderGit2Icon,
  Link2Icon,
  Loader2Icon,
  PlusIcon,
  RefreshCwIcon,
  UnlinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createGitHubIssueFromTaskAction,
  getGitHubConnection,
  getGitHubRepositories,
  getRepositoryIssues,
  linkExistingTaskAction,
  retryTaskSyncAction,
  unlinkTaskAction,
  type GitHubConnectionStatus,
} from "@/lib/actions/github";
import type { TodoWithDetails } from "@/lib/actions/todos";
import type { GitHubIssueDTO } from "@/lib/integrations/github";
import type { githubRepositories } from "@/schema/schema";
import { toast } from "sonner";

interface TaskGitHubIntegrationProps {
  task: TodoWithDetails;
  onTaskUpdated?: () => void;
}

export function TaskGitHubIntegration({ task, onTaskUpdated }: TaskGitHubIntegrationProps) {
  const [connectionStatus, setConnectionStatus] = React.useState<GitHubConnectionStatus | null>(null);
  const [repositories, setRepositories] = React.useState<(typeof githubRepositories.$inferSelect)[]>([]);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isLinkOpen, setIsLinkOpen] = React.useState(false);
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = React.useState(false);

  // Form states for creating issue
  const [selectedRepo, setSelectedRepo] = React.useState("");
  const [issueTitle, setIssueTitle] = React.useState(task.title);
  const [issueBody, setIssueBody] = React.useState(task.description || "");
  const [issueLabels, setIssueLabels] = React.useState("todo, enhancement");
  const [isSubmittingCreate, setIsSubmittingCreate] = React.useState(false);

  // Form states for linking issue
  const [linkRepo, setLinkRepo] = React.useState("");
  const [repoIssues, setRepoIssues] = React.useState<GitHubIssueDTO[]>([]);
  const [selectedIssueNumber, setSelectedIssueNumber] = React.useState<number | null>(null);
  const [isLoadingIssues, setIsLoadingIssues] = React.useState(false);
  const [isSubmittingLink, setIsSubmittingLink] = React.useState(false);

  // Sync action states
  const [isRetryingSync, setIsRetryingSync] = React.useState(false);
  const [isUnlinking, setIsUnlinking] = React.useState(false);

  // Load connection and repositories on mount
  React.useEffect(() => {
    let isMounted = true;
    Promise.all([getGitHubConnection(), getGitHubRepositories()]).then(([status, repos]) => {
      if (isMounted) {
        setConnectionStatus(status);
        setRepositories(repos.filter((r) => r.isSelected));
        if (repos.length > 0) {
          setSelectedRepo(repos[0].fullName);
          setLinkRepo(repos[0].fullName);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update form fields when opening create modal
  const handleOpenCreateModal = () => {
    setIssueTitle(task.title);
    setIssueBody(task.description || "");
    setIsCreateOpen(true);
  };

  // Load issues when linking repository changes
  React.useEffect(() => {
    if (!linkRepo || !isLinkOpen) return;
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) setIsLoadingIssues(true);
    });

    getRepositoryIssues(linkRepo)
      .then((issues) => {
        if (isMounted) {
          setRepoIssues(issues);
          if (issues.length > 0) {
            setSelectedIssueNumber(issues[0].number);
          } else {
            setSelectedIssueNumber(null);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingIssues(false);
      });

    return () => {
      isMounted = false;
    };
  }, [linkRepo, isLinkOpen]);

  // Handle creating remote issue
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !issueTitle.trim() || isSubmittingCreate) return;

    try {
      setIsSubmittingCreate(true);
      const labels = issueLabels
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      await createGitHubIssueFromTaskAction({
        todoId: task.id,
        repoFullName: selectedRepo,
        title: issueTitle.trim(),
        body: issueBody.trim() || null,
        labels,
      });

      toast.success(`Created GitHub issue in ${selectedRepo}!`);
      setIsCreateOpen(false);
      onTaskUpdated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create GitHub issue");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle linking existing issue
  const handleLinkIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkRepo || !selectedIssueNumber || isSubmittingLink) return;

    try {
      setIsSubmittingLink(true);
      await linkExistingTaskAction({
        todoId: task.id,
        repoFullName: linkRepo,
        issueNumber: selectedIssueNumber,
      });

      toast.success(`Linked to ${linkRepo} #${selectedIssueNumber}`);
      setIsLinkOpen(false);
      onTaskUpdated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to link issue");
    } finally {
      setIsSubmittingLink(false);
    }
  };

  // Handle retry sync
  const handleRetrySync = async () => {
    if (!task.githubMapping) return;
    try {
      setIsRetryingSync(true);
      const res = await retryTaskSyncAction(task.githubMapping.id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
      onTaskUpdated?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setIsRetryingSync(false);
    }
  };

  // Handle unlink
  const handleUnlink = async () => {
    if (!task.githubMapping) return;
    try {
      setIsUnlinking(true);
      await unlinkTaskAction(task.githubMapping.id);
      toast.success("Unlinked GitHub issue (task preserved).");
      setIsUnlinkDialogOpen(false);
      onTaskUpdated?.();
    } catch {
      toast.error("Failed to unlink issue");
    } finally {
      setIsUnlinking(false);
    }
  };

  const mapping = task.githubMapping;
  const isLinked = !!mapping || !!task.sourceGithubIssueUrl;

  return (
    <div className="space-y-2">
      {/* Linked State Banner */}
      {isLinked ? (
        <div className="rounded-xl border border-border bg-secondary/30 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FolderGit2Icon className="size-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                  {mapping?.repositoryFullName || task.sourceGithubRepo || "GitHub Repository"}
                  <Badge variant="outline" className="text-[10px] font-mono px-1 py-0">
                    #{mapping?.issueNumber || "issue"}
                  </Badge>
                </span>
                <p className="text-muted-foreground text-[11px] truncate">
                  {mapping?.issueTitle || task.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {mapping?.issueState && (
                <Badge
                  variant="outline"
                  className={`text-[10px] capitalize ${
                    mapping.issueState === "open"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400"
                      : "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400"
                  }`}
                >
                  {mapping.issueState}
                </Badge>
              )}

              <a
                href={mapping?.issueUrl || task.sourceGithubIssueUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                title="Open on GitHub"
              >
                <ExternalLinkIcon className="size-3.5" />
              </a>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsUnlinkDialogOpen(true)}
                className="size-6 text-muted-foreground hover:text-destructive cursor-pointer"
                title="Unlink GitHub issue"
              >
                <UnlinkIcon className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Sync Status Row */}
          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
            <div className="flex items-center gap-1.5">
              {mapping?.syncStatus === "error" ? (
                <span className="flex items-center gap-1 text-rose-500 font-medium">
                  <AlertCircleIcon className="size-3" />
                  Sync Error: {mapping.lastSyncError || "API error"}
                </span>
              ) : mapping?.syncStatus === "synced" ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2Icon className="size-3" />
                  Bidirectional Sync Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <RefreshCwIcon className="size-3 animate-spin" />
                  Pending Sync
                </span>
              )}
            </div>

            {mapping?.syncStatus === "error" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRetrySync}
                disabled={isRetryingSync}
                className="h-6 px-2 text-[10px] gap-1 cursor-pointer"
              >
                <RefreshCwIcon className={`size-2.5 ${isRetryingSync ? "animate-spin" : ""}`} />
                Retry
              </Button>
            )}
          </div>
        </div>
      ) : (
        /* Not Linked: Offer Actions */
        <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-3 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderGit2Icon className="size-4 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">GitHub Integration</p>
              <p className="text-[11px] text-muted-foreground">
                Create a GitHub issue from this task or link to an existing issue.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLinkOpen(true)}
              disabled={!connectionStatus?.isConnected}
              className="h-7 text-[11px] gap-1 cursor-pointer"
            >
              <Link2Icon className="size-3" />
              Link Issue
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleOpenCreateModal}
              disabled={!connectionStatus?.isConnected}
              className="h-7 text-[11px] gap-1 cursor-pointer"
            >
              <PlusIcon className="size-3" />
              Create Issue
            </Button>
          </div>
        </div>
      )}

      {/* Dialog: Create GitHub Issue */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <FolderGit2Icon className="size-4 text-primary" />
              Create GitHub Issue
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review and confirm the issue details. This will create an issue in your selected GitHub repository and establish live bidirectional synchronization.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateIssue} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Repository</label>
              <select
                value={selectedRepo}
                onChange={(e) => setSelectedRepo(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                required
              >
                {repositories.map((r) => (
                  <option key={r.id} value={r.fullName} className="bg-card text-foreground">
                    {r.fullName} {r.private ? "(Private)" : "(Public)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Issue Title</label>
              <Input
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="Title..."
                className="text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Description</label>
              <textarea
                value={issueBody}
                onChange={(e) => setIssueBody(e.target.value)}
                rows={3}
                placeholder="Issue description..."
                className="w-full rounded-lg border border-border bg-secondary/30 p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Labels (comma-separated)</label>
              <Input
                value={issueLabels}
                onChange={(e) => setIssueLabels(e.target.value)}
                placeholder="e.g. bug, enhancement, ui"
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingCreate}
                className="text-xs gap-1.5"
              >
                {isSubmittingCreate && <Loader2Icon className="size-3 animate-spin" />}
                Confirm & Create Issue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Link Existing GitHub Issue */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="max-w-md border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Link2Icon className="size-4 text-primary" />
              Link Existing GitHub Issue
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select an open issue to link to this task. Any updates will synchronize automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLinkIssue} className="space-y-3 pt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Repository</label>
              <select
                value={linkRepo}
                onChange={(e) => setLinkRepo(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                required
              >
                {repositories.map((r) => (
                  <option key={r.id} value={r.fullName} className="bg-card text-foreground">
                    {r.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Issue</label>
              {isLoadingIssues ? (
                <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                  <Loader2Icon className="size-3.5 animate-spin" />
                  Loading issues from GitHub...
                </div>
              ) : repoIssues.length === 0 ? (
                <p className="py-2 text-xs text-muted-foreground">No open issues found in this repository.</p>
              ) : (
                <select
                  value={selectedIssueNumber || ""}
                  onChange={(e) => setSelectedIssueNumber(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                  required
                >
                  {repoIssues.map((issue) => (
                    <option key={issue.id} value={issue.number} className="bg-card text-foreground">
                      #{issue.number} — {issue.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLinkOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingLink || !selectedIssueNumber}
                className="text-xs gap-1.5"
              >
                {isSubmittingLink && <Loader2Icon className="size-3 animate-spin" />}
                Link to Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog: Unlink Issue */}
      <Dialog open={isUnlinkDialogOpen} onOpenChange={setIsUnlinkDialogOpen}>
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Unlink GitHub Issue?</DialogTitle>
            <DialogDescription className="text-xs">
              This will disconnect the issue from this task. Your task notes, checklist steps, and history will remain completely intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUnlinkDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleUnlink}
              disabled={isUnlinking}
              className="text-xs"
            >
              {isUnlinking ? "Unlinking..." : "Unlink Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
