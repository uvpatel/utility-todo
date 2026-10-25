"use client";

import * as React from "react";
import {
  ActivityIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  ExternalLinkIcon,
  FolderGit2Icon,
  GitBranchIcon,
  GitPullRequestIcon,
  HelpCircleIcon,
  LayersIcon,
  Link2Icon,
  LockIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  SlidersIcon,
  Trash2Icon,
  UnlockIcon,
  UnlinkIcon,
  XCircleIcon,
  ZapIcon,
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
  convertGitHubIssueToTask,
  disconnectGitHub,
  getAllUserMappedTasks,
  getGitHubRepositories,
  getRepositoryActivity,
  getRepositoryChecks,
  reconcileAllMappingsAction,
  retryTaskSyncAction,
  syncGitHubRepositories,
  toggleRepositorySelection,
  unlinkTaskAction,
  updateGitHubSyncSettingsAction,
  type GitHubConnectionStatus,
} from "@/lib/actions/github";
import type {
  GitHubActivityEventDTO,
  GitHubCheckRunDTO,
  GitHubIssueDTO,
  GitHubPullRequestDTO,
} from "@/lib/integrations/github";
import type { githubIssueMappings, githubRepositories, githubSyncSettings, todos } from "@/schema/schema";
import { toast } from "sonner";
import Link from "next/link";

interface GitHubDashboardProps {
  initialConnection: GitHubConnectionStatus;
  initialRepositories: (typeof githubRepositories.$inferSelect)[];
  initialOpenIssues: GitHubIssueDTO[];
  initialPullRequests: GitHubPullRequestDTO[];
  initialMappedTasks: Array<{
    mapping: typeof githubIssueMappings.$inferSelect;
    todo: typeof todos.$inferSelect;
  }>;
  initialSyncSettings: typeof githubSyncSettings.$inferSelect | null;
}

export function GitHubDashboard({
  initialConnection,
  initialRepositories,
  initialOpenIssues,
  initialPullRequests,
  initialMappedTasks,
  initialSyncSettings,
}: GitHubDashboardProps) {
  const [connection, setConnection] = React.useState<GitHubConnectionStatus>(initialConnection);
  const [repositories, setRepositories] = React.useState(initialRepositories);
  const [openIssues, setOpenIssues] = React.useState<GitHubIssueDTO[]>(initialOpenIssues);
  const [pullRequests, setPullRequests] = React.useState<GitHubPullRequestDTO[]>(initialPullRequests);
  const [mappedTasks, setMappedTasks] = React.useState(initialMappedTasks);
  const [syncSettings, setSyncSettings] = React.useState(initialSyncSettings);

  const [activeTab, setActiveTab] = React.useState<
    "overview" | "issues" | "prs" | "checks" | "mapped" | "repos" | "settings"
  >("overview");

  // Filtering & Search
  const [selectedRepoFilter, setSelectedRepoFilter] = React.useState<string>("all");
  const [issueStateFilter, setIssueStateFilter] = React.useState<"open" | "closed" | "all">("open");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Loading states
  const [isSyncingRepos, setIsSyncingRepos] = React.useState(false);
  const [isReconciling, setIsReconciling] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = React.useState(false);
  const [convertingIssueMap, setConvertingIssueMap] = React.useState<Record<string, boolean>>({});
  const [retryingMappingMap, setRetryingMappingMap] = React.useState<Record<string, boolean>>({});
  const [unlinkingMappingMap, setUnlinkingMappingMap] = React.useState<Record<string, boolean>>({});

  // CI Checks & Activity state for selected repo
  const [selectedInspectRepo, setSelectedInspectRepo] = React.useState<string | null>(null);
  const [repoChecks, setRepoChecks] = React.useState<GitHubCheckRunDTO[]>([]);
  const [repoActivity, setRepoActivity] = React.useState<GitHubActivityEventDTO[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);

  // Active selected repositories
  const selectedRepos = React.useMemo(() => {
    return repositories.filter((r) => r.isSelected);
  }, [repositories]);

  // Load checks when "checks" tab or inspect repo changes
  React.useEffect(() => {
    const targetRepo = selectedInspectRepo || (selectedRepos[0]?.fullName ?? repositories[0]?.fullName);
    if (!targetRepo || !connection.isConnected) return;

    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) setIsLoadingDetails(true);
      return Promise.all([
        getRepositoryChecks(targetRepo).catch(() => []),
        getRepositoryActivity(targetRepo).catch(() => []),
      ]);
    }).then(([checks, activity]) => {
      if (isMounted) {
        setRepoChecks(checks);
        setRepoActivity(activity);
        setIsLoadingDetails(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedInspectRepo, selectedRepos, repositories, connection.isConnected]);

  // Sync Repositories action
  const handleSyncRepos = async () => {
    try {
      setIsSyncingRepos(true);
      const res = await syncGitHubRepositories();
      toast.success(res.message);
      const refreshed = await getGitHubRepositories();
      setRepositories(refreshed);
      setConnection((prev) => ({
        ...prev,
        lastSyncedAt: new Date(),
        totalReposCount: refreshed.length,
        selectedReposCount: refreshed.filter((r) => r.isSelected).length,
      }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to sync repositories");
    } finally {
      setIsSyncingRepos(false);
    }
  };

  // Toggle repository selection
  const handleToggleRepo = async (repoId: string, current: boolean) => {
    const next = !current;
    setRepositories((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, isSelected: next } : r))
    );

    try {
      await toggleRepositorySelection(repoId, next);
      toast.success(next ? "Added to sync pool" : "Removed from sync pool");
    } catch {
      setRepositories((prev) =>
        prev.map((r) => (r.id === repoId ? { ...r, isSelected: current } : r))
      );
      toast.error("Failed to update repository sync setting");
    }
  };

  // Reconcile all mapped tasks
  const handleReconcile = async () => {
    try {
      setIsReconciling(true);
      const res = await reconcileAllMappingsAction();
      toast.success(`Reconciliation finished: ${res.synced} synchronized, ${res.errors} errors.`);
      const refreshedMappings = await getAllUserMappedTasks();
      setMappedTasks(refreshedMappings);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Reconciliation failed");
    } finally {
      setIsReconciling(false);
    }
  };

  // Convert issue to task
  const handleConvertIssue = async (issue: GitHubIssueDTO, repoFullName: string) => {
    const key = `${repoFullName}#${issue.number}`;
    try {
      setConvertingIssueMap((prev) => ({ ...prev, [key]: true }));
      const res = await convertGitHubIssueToTask({
        repoFullName,
        issueNumber: issue.number,
        title: issue.title,
        body: issue.body,
        htmlUrl: issue.htmlUrl,
        priority: "high",
      });

      if (res.alreadyExisted) {
        toast.info("Task already linked to this issue.");
      } else {
        toast.success(`Created task [#${issue.number}] in your workspace!`);
      }

      const refreshed = await getAllUserMappedTasks();
      setMappedTasks(refreshed);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create task from issue");
    } finally {
      setConvertingIssueMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Retry individual mapping sync
  const handleRetryMapping = async (mappingId: string) => {
    try {
      setRetryingMappingMap((prev) => ({ ...prev, [mappingId]: true }));
      const res = await retryTaskSyncAction(mappingId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
      const refreshed = await getAllUserMappedTasks();
      setMappedTasks(refreshed);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetryingMappingMap((prev) => ({ ...prev, [mappingId]: false }));
    }
  };

  // Unlink mapping
  const handleUnlinkMapping = async (mappingId: string) => {
    try {
      setUnlinkingMappingMap((prev) => ({ ...prev, [mappingId]: true }));
      await unlinkTaskAction(mappingId);
      toast.success("Unlinked issue (task preserved).");
      setMappedTasks((prev) => prev.filter((m) => m.mapping.id !== mappingId));
    } catch {
      toast.error("Failed to unlink issue");
    } finally {
      setUnlinkingMappingMap((prev) => ({ ...prev, [mappingId]: false }));
    }
  };

  // Update sync settings toggle
  const handleToggleSetting = async (
    key: "syncStatusChanges" | "syncTitleChanges" | "syncDescriptionChanges" | "autoSyncOnWebhook",
    val: boolean
  ) => {
    if (!syncSettings) return;
    setSyncSettings((prev) => (prev ? { ...prev, [key]: val } : null));
    try {
      await updateGitHubSyncSettingsAction({ [key]: val });
      toast.success("Sync settings updated");
    } catch {
      toast.error("Failed to update settings");
    }
  };

  // Disconnect GitHub
  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnectGitHub();
      setConnection({
        isConnected: false,
        isAppConfigured: connection.isAppConfigured,
        appConfig: connection.appConfig,
      });
      setRepositories([]);
      setOpenIssues([]);
      setPullRequests([]);
      setMappedTasks([]);
      setIsDisconnectDialogOpen(false);
      toast.success("GitHub App disconnected. All local tasks preserved.");
    } catch {
      toast.error("Failed to disconnect");
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Check if an issue is already mapped
  const isIssueMapped = (repoFullName: string, issueNumber: number) => {
    return mappedTasks.some(
      (m) =>
        m.mapping.repositoryFullName === repoFullName &&
        m.mapping.issueNumber === issueNumber
    );
  };

  // Filtered issues
  const filteredIssues = React.useMemo(() => {
    return openIssues.filter((issue) => {
      if (selectedRepoFilter !== "all" && !issue.htmlUrl.includes(selectedRepoFilter)) return false;
      if (issueStateFilter !== "all" && issue.state !== issueStateFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = issue.title.toLowerCase().includes(q);
        const matchBody = issue.body?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchBody) return false;
      }
      return true;
    });
  }, [openIssues, issueStateFilter, searchQuery, selectedRepoFilter]);

  // Current active inspect repo object
  const activeRepoObj = React.useMemo(() => {
    const target = selectedInspectRepo || (selectedRepos[0]?.fullName ?? repositories[0]?.fullName);
    return repositories.find((r) => r.fullName === target) || null;
  }, [repositories, selectedInspectRepo, selectedRepos]);

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Header & Connection Hero */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <FolderGit2Icon className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  GitHub Workspace
                </h1>
                {connection.isConnected ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground gap-1">
                    Disconnected
                  </Badge>
                )}
                {!connection.isAppConfigured && !connection.isConnected && (
                  <Badge variant="destructive" className="text-[10px]">
                    App Unconfigured
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {connection.isConnected
                  ? `Connected as @${connection.accountLogin || "uvpatel"} (${selectedRepos.length} / ${repositories.length} repos active for sync)`
                  : "Connect your GitHub App to monitor development activity, track PRs, and synchronize issues with tasks."}
              </p>
            </div>
          </div>

          {/* Connection Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {connection.isConnected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncRepos}
                  disabled={isSyncingRepos}
                  className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <RefreshCwIcon className={`size-3.5 ${isSyncingRepos ? "animate-spin text-primary" : ""}`} />
                  Refresh Repos
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReconcile}
                  disabled={isReconciling}
                  className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <CheckCircle2Icon className={`size-3.5 ${isReconciling ? "animate-spin text-emerald-500" : ""}`} />
                  Reconcile Tasks
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Link href="/settings/integrations">
                    <SlidersIcon className="size-3.5" />
                    Settings
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDisconnectDialogOpen(true)}
                  className="h-8 text-xs gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                >
                  <Trash2Icon className="size-3.5" />
                  Disconnect
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5 cursor-pointer"
                >
                  <Link href="/settings/integrations">
                    <HelpCircleIcon className="size-3.5 text-purple-500" />
                    Setup Guide
                  </Link>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5 cursor-pointer bg-foreground text-background hover:bg-foreground/90"
                >
                  <a href="/api/integrations/github/connect">
                    <ZapIcon className="size-3.5" />
                    Connect GitHub App
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Metric Cards Row */}
        {connection.isConnected && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/50">
            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Sync Repos
              </span>
              <div className="text-xl font-bold text-foreground mt-1">
                {selectedRepos.length}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  / {repositories.length}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Open Issues
              </span>
              <div className="text-xl font-bold text-foreground mt-1">
                {openIssues.length}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Pull Requests
              </span>
              <div className="text-xl font-bold text-foreground mt-1 flex items-center gap-1.5">
                <GitPullRequestIcon className="size-4 text-purple-500" />
                {pullRequests.length}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-secondary/30 p-3">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Linked Tasks
              </span>
              <div className="text-xl font-bold text-foreground mt-1 flex items-center gap-1.5">
                <Link2Icon className="size-4 text-emerald-500" />
                {mappedTasks.length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-border pb-px overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayersIcon className="size-3.5" />
          Overview & Activity
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("issues")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "issues"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderGit2Icon className="size-3.5" />
          Issues ({openIssues.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("prs")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "prs"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GitPullRequestIcon className="size-3.5" />
          Pull Requests ({pullRequests.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("checks")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "checks"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2Icon className="size-3.5" />
          CI & Checks ({repoChecks.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mapped")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "mapped"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2Icon className="size-3.5" />
          Linked Tasks ({mappedTasks.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("repos")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "repos"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GitBranchIcon className="size-3.5" />
          Repositories ({repositories.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
            activeTab === "settings"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersIcon className="size-3.5" />
          Sync Rules
        </button>
      </div>

      {/* Disconnected State Notice */}
      {!connection.isConnected && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto border border-purple-500/20">
            <FolderGit2Icon className="size-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h2 className="text-base font-bold text-foreground">Connect GitHub App to Get Started</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Authenticate your GitHub account (<span className="font-mono text-foreground font-semibold">uvpatel</span>) via GitHub App to monitor development pull requests, sync issues bidirectionally, and inspect CI check runs in real time.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button asChild variant="outline" size="sm" className="text-xs">
              <Link href="/settings/integrations">
                Open Settings & Setup Checklist
              </Link>
            </Button>
            <Button asChild size="sm" className="text-xs bg-foreground text-background hover:bg-foreground/90">
              <a href="/api/integrations/github/connect">
                <ZapIcon className="size-3.5 mr-1" />
                Connect GitHub
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: OVERVIEW */}
      {connection.isConnected && activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent PR Activity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <GitPullRequestIcon className="size-4 text-purple-500" />
                Development Pull Requests
              </h2>
              <span className="text-xs text-muted-foreground">
                Development streams (not converted to tasks)
              </span>
            </div>

            <div className="space-y-3">
              {pullRequests.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
                  No active pull requests found across authorized repositories.
                </div>
              ) : (
                pullRequests.slice(0, 6).map((pr) => (
                  <div
                    key={pr.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize font-medium ${
                            pr.state === "merged"
                              ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                              : pr.state === "closed"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                              : pr.draft
                              ? "bg-secondary text-muted-foreground"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          }`}
                        >
                          {pr.draft ? "Draft" : pr.state}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground font-semibold">#{pr.number}</span>
                        <h3 className="text-xs font-semibold text-foreground truncate max-w-md">
                          {pr.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {pr.body || "No description provided."}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                        <span className="font-mono bg-secondary/80 px-1.5 py-0.5 rounded text-foreground font-medium">
                          {pr.headRef} → {pr.baseRef}
                        </span>
                        <span>•</span>
                        <span>by @{pr.author}</span>
                        <span>•</span>
                        <span className="text-muted-foreground/80">{pr.repositoryFullName}</span>
                      </div>
                    </div>

                    <a
                      href={pr.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-7 items-center justify-center rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                      title="Open PR on GitHub"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Repos & Sync Health */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldCheckIcon className="size-4 text-emerald-500" />
              Synchronization Health
            </h2>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Webhook Verification:</span>
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <CheckCircle2Icon className="size-3" /> HMAC-SHA256 Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Echo Loop Prevention:</span>
                <span className="text-emerald-500 font-medium flex items-center gap-1">
                  <CheckCircle2Icon className="size-3" /> Origin Tagging Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Conflict Strategy:</span>
                <span className="font-mono text-foreground uppercase text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                  {syncSettings?.conflictStrategy || "newer_wins"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-muted-foreground">Last Webhook Event:</span>
                <span className="font-mono text-foreground text-[11px]">
                  {connection.lastWebhookEvent || "None received yet"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Reconcile:</span>
                <span className="text-foreground">
                  {connection.lastSyncedAt
                    ? new Date(connection.lastSyncedAt).toLocaleTimeString()
                    : "Not run yet"}
                </span>
              </div>
            </div>

            {/* Active Repositories Mini List */}
            <h3 className="text-xs font-semibold text-foreground pt-2">Active Sync Repositories</h3>
            <div className="space-y-2">
              {selectedRepos.slice(0, 4).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/20 p-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-foreground truncate block">{r.name}</span>
                    <span className="text-[10px] text-muted-foreground">{r.owner}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {r.openIssuesCount} issues
                  </Badge>
                </div>
              ))}
            </div>

            {/* Live Repository Activity Stream */}
            {repoActivity.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ActivityIcon className="size-3.5 text-purple-500" />
                  Recent Repository Events
                </h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {repoActivity.slice(0, 5).map((evt) => (
                    <div
                      key={evt.id}
                      className="rounded-lg border border-border bg-secondary/15 p-2 text-[11px] space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="font-semibold text-foreground">@{evt.actor}</span>
                        <span className="text-[10px]">{evt.type.replace("Event", "")}</span>
                      </div>
                      {evt.title && (
                        <p className="text-muted-foreground truncate font-mono text-[10px]">
                          {evt.title}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ISSUES */}
      {connection.isConnected && activeTab === "issues" && (
        <div className="space-y-4">
          {/* Controls: Search, State Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search issues by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs bg-card"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <select
                value={selectedRepoFilter}
                onChange={(e) => setSelectedRepoFilter(e.target.value)}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground outline-none cursor-pointer"
              >
                <option value="all">All Repositories</option>
                {repositories.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center rounded-lg border border-border bg-card p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setIssueStateFilter("open")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    issueStateFilter === "open"
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => setIssueStateFilter("closed")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    issueStateFilter === "closed"
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Closed
                </button>
                <button
                  type="button"
                  onClick={() => setIssueStateFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    issueStateFilter === "all"
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-3">
            {filteredIssues.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
                No issues match your current filters. Make sure repositories are included in your active sync pool.
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const repoName = issue.repositoryFullName || selectedRepos[0]?.fullName || "uvpatel/utility-todo";
                const isMapped = isIssueMapped(repoName, issue.number);
                const isConverting = convertingIssueMap[`${repoName}#${issue.number}`];

                return (
                  <div
                    key={issue.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground font-semibold">
                          #{issue.number}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            issue.state === "open"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : "bg-purple-500/10 text-purple-600 border-purple-500/30"
                          }`}
                        >
                          {issue.state}
                        </Badge>
                        <h3 className="text-sm font-semibold text-foreground">{issue.title}</h3>
                      </div>

                      {issue.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {issue.body}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap pt-0.5">
                        <span>by @{issue.author}</span>
                        <span>•</span>
                        <span className="font-mono">{issue.repositoryFullName || repoName}</span>
                        {issue.labels.map((lbl) => (
                          <span
                            key={lbl}
                            className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground"
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <a
                        href={issue.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Open on GitHub"
                      >
                        <ExternalLinkIcon className="size-3.5" />
                      </a>

                      {isMapped ? (
                        <Badge variant="outline" className="text-xs gap-1 py-1 px-2.5 text-emerald-600 border-emerald-500/30">
                          <CheckCircle2Icon className="size-3" />
                          Linked Task
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          disabled={isConverting}
                          onClick={() => handleConvertIssue(issue, repoName)}
                          className="h-8 text-xs gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <PlusIcon className="size-3.5" />
                          {isConverting ? "Creating..." : "Create Task"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PULL REQUESTS */}
      {connection.isConnected && activeTab === "prs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Pull Requests Visibility</h2>
              <p className="text-xs text-muted-foreground">
                Pull requests represent development throughput and branch merges. They are monitored here as code activity rather than task items.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pullRequests.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
                No pull requests found across authorized repositories.
              </div>
            ) : (
              pullRequests.map((pr) => (
                <div
                  key={pr.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize font-medium ${
                          pr.state === "merged"
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                            : pr.state === "closed"
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                            : pr.draft
                            ? "bg-secondary text-muted-foreground"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        }`}
                      >
                        {pr.draft ? "Draft" : pr.state}
                      </Badge>
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        #{pr.number}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">{pr.title}</h3>
                    </div>

                    {pr.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{pr.body}</p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap pt-0.5">
                      <span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-foreground font-medium">
                        {pr.headRef} → {pr.baseRef}
                      </span>
                      <span>•</span>
                      <span>by @{pr.author}</span>
                      <span>•</span>
                      <span>Updated {new Date(pr.updatedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="text-muted-foreground/80">{pr.repositoryFullName}</span>
                    </div>
                  </div>

                  <a
                    href={pr.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground self-end sm:self-center shrink-0 cursor-pointer"
                    title="Open PR on GitHub"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CI & CHECKS */}
      {connection.isConnected && activeTab === "checks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Continuous Integration & Commit Statuses</h2>
              <p className="text-xs text-muted-foreground">
                Real-time check runs from GitHub Actions and status checks for your repository branches.
              </p>
            </div>
            {repositories.length > 0 && (
              <select
                value={selectedInspectRepo || (selectedRepos[0]?.fullName ?? repositories[0]?.fullName)}
                onChange={(e) => setSelectedInspectRepo(e.target.value)}
                className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground outline-none cursor-pointer"
              >
                {repositories.map((r) => (
                  <option key={r.id} value={r.fullName}>
                    {r.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-muted-foreground">
              <RefreshCwIcon className="size-5 animate-spin text-primary mb-2" />
              <span>Fetching latest check runs and commit statuses...</span>
            </div>
          ) : repoChecks.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-xs text-muted-foreground">
              No recent check runs found for the default branch of {activeRepoObj?.fullName || "the selected repository"}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {repoChecks.map((chk) => (
                <div
                  key={chk.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {chk.conclusion === "success" ? (
                      <CheckCircle2Icon className="size-4 text-emerald-500 shrink-0" />
                    ) : chk.conclusion === "failure" ? (
                      <XCircleIcon className="size-4 text-rose-500 shrink-0" />
                    ) : chk.status === "in_progress" ? (
                      <RefreshCwIcon className="size-4 text-amber-500 animate-spin shrink-0" />
                    ) : (
                      <ClockIcon className="size-4 text-muted-foreground shrink-0" />
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{chk.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] capitalize ${
                            chk.conclusion === "success"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : chk.conclusion === "failure"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {chk.conclusion || chk.status}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>
                          Started: {chk.startedAt ? new Date(chk.startedAt).toLocaleTimeString() : "Pending"}
                        </span>
                        {chk.completedAt && (
                          <span>• Completed: {new Date(chk.completedAt).toLocaleTimeString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {chk.htmlUrl && (
                    <a
                      href={chk.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-7 items-center justify-center rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                      title="View Check Run on GitHub"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: LINKED TASKS */}
      {connection.isConnected && activeTab === "mapped" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Synchronized Todo Tasks</h2>
              <p className="text-xs text-muted-foreground">
                All tasks actively mapped to GitHub issues with real-time sync state.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconcile}
              disabled={isReconciling}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCwIcon className={`size-3.5 ${isReconciling ? "animate-spin text-primary" : ""}`} />
              Reconcile All
            </Button>
          </div>

          <div className="space-y-3">
            {mappedTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
                No linked tasks yet. Convert an issue from the Issues tab or link a task inside the Task Details drawer.
              </div>
            ) : (
              mappedTasks.map(({ mapping, todo }) => (
                <div
                  key={mapping.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                        #{mapping.issueNumber}
                      </span>
                      <h3 className="text-sm font-semibold text-foreground">{todo.title}</h3>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          todo.completed
                            ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        }`}
                      >
                        {todo.completed ? "Completed" : "Active"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Repo: {mapping.repositoryFullName}</span>
                      <span>•</span>
                      <span>
                        Last synced: {new Date(mapping.lastSyncedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {mapping.syncStatus === "error" && (
                      <p className="text-xs text-rose-500 font-medium pt-1">
                        Sync error: {mapping.lastSyncError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {mapping.syncStatus === "error" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={retryingMappingMap[mapping.id]}
                        onClick={() => handleRetryMapping(mapping.id)}
                        className="h-8 text-xs gap-1 cursor-pointer"
                      >
                        <RefreshCwIcon className={`size-3 ${retryingMappingMap[mapping.id] ? "animate-spin" : ""}`} />
                        Retry
                      </Button>
                    )}

                    <a
                      href={mapping.issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Open on GitHub"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </a>

                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={unlinkingMappingMap[mapping.id]}
                      onClick={() => handleUnlinkMapping(mapping.id)}
                      className="h-8 text-xs text-muted-foreground hover:text-rose-600 cursor-pointer"
                      title="Unlink issue (local task preserved)"
                    >
                      <UnlinkIcon className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: REPOSITORIES */}
      {connection.isConnected && activeTab === "repos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Repository Access Management</h2>
              <p className="text-xs text-muted-foreground">
                Toggle which repositories are included in the active task synchronization pool.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncRepos}
              disabled={isSyncingRepos}
              className="h-8 text-xs gap-1.5 cursor-pointer"
            >
              <RefreshCwIcon className={`size-3.5 ${isSyncingRepos ? "animate-spin text-primary" : ""}`} />
              Refresh from GitHub
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-sm text-foreground truncate">{repo.fullName}</h3>
                      {repo.private ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.2 rounded">
                          <LockIcon className="size-2.5" /> Private
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.2 rounded">
                          <UnlockIcon className="size-2.5" /> Public
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {repo.description || "No description provided"}
                    </p>
                  </div>

                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    title="Open on GitHub"
                  >
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                    <span className="flex items-center gap-1">
                      <GitBranchIcon className="size-3" />
                      {repo.defaultBranch}
                    </span>
                    <span>{repo.openIssuesCount} issues</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={repo.isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleRepo(repo.id, repo.isSelected)}
                      className="h-7 text-xs cursor-pointer"
                    >
                      {repo.isSelected ? "Syncing" : "Include"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: SYNC RULES & SETTINGS */}
      {connection.isConnected && activeTab === "settings" && syncSettings && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Bidirectional Synchronization Rules</h2>
            <p className="text-xs text-muted-foreground">
              Define which attributes synchronize automatically between GitHub issues and Utility Todo tasks.
            </p>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-5">
            {/* Webhook Sync Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-foreground">Real-time Webhook Synchronization</p>
                <p className="text-[11px] text-muted-foreground">
                  Instantly synchronize issue updates via verified HMAC-SHA256 GitHub webhooks.
                </p>
              </div>
              <input
                type="checkbox"
                checked={syncSettings.autoSyncOnWebhook}
                onChange={(e) => handleToggleSetting("autoSyncOnWebhook", e.target.checked)}
                className="size-4 accent-primary cursor-pointer"
              />
            </div>

            <div className="h-px bg-border/40" />

            {/* Status Sync Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-foreground">Synchronize Status (Completed ↔ Closed)</p>
                <p className="text-[11px] text-muted-foreground">
                  Marking a task complete closes the GitHub issue; reopening the issue reopens the task.
                </p>
              </div>
              <input
                type="checkbox"
                checked={syncSettings.syncStatusChanges}
                onChange={(e) => handleToggleSetting("syncStatusChanges", e.target.checked)}
                className="size-4 accent-primary cursor-pointer"
              />
            </div>

            <div className="h-px bg-border/40" />

            {/* Title Sync Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-foreground">Synchronize Title Changes</p>
                <p className="text-[11px] text-muted-foreground">
                  Renaming a task updates the GitHub issue title and vice versa.
                </p>
              </div>
              <input
                type="checkbox"
                checked={syncSettings.syncTitleChanges}
                onChange={(e) => handleToggleSetting("syncTitleChanges", e.target.checked)}
                className="size-4 accent-primary cursor-pointer"
              />
            </div>

            <div className="h-px bg-border/40" />

            {/* Description Sync Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-foreground">Synchronize Descriptions & Notes</p>
                <p className="text-[11px] text-muted-foreground">
                  Changes to task notes update the GitHub issue body.
                </p>
              </div>
              <input
                type="checkbox"
                checked={syncSettings.syncDescriptionChanges}
                onChange={(e) => handleToggleSetting("syncDescriptionChanges", e.target.checked)}
                className="size-4 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertCircleIcon className="size-4 text-rose-500" />
              Disconnect GitHub?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1">
              Disconnecting will remove repository links and synchronization tokens. <strong>All of your local tasks, notes, checklists, and Kanban board items will remain permanently preserved.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDisconnectDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="text-xs cursor-pointer"
            >
              {isDisconnecting ? "Disconnecting..." : "Confirm Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
