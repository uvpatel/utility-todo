"use client";

import * as React from "react";
import {
  ExternalLinkIcon,
  FolderGit2Icon,
  GitBranchIcon,
  GitPullRequestIcon,
  LockIcon,
  SearchIcon,
  UnlockIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitHubIssueDialog } from "./github-issue-dialog";
import { toggleRepositorySelection } from "@/lib/actions/github";
import type { githubRepositories } from "@/schema/schema";
import { toast } from "sonner";

type RepositoryItem = typeof githubRepositories.$inferSelect;

interface GitHubRepositoryListProps {
  initialRepositories: RepositoryItem[];
  onRepositoriesUpdated?: () => void;
}

export function GitHubRepositoryList({
  initialRepositories,
  onRepositoriesUpdated,
}: GitHubRepositoryListProps) {
  const [repositories, setRepositories] = React.useState<RepositoryItem[]>(initialRepositories);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterMode, setFilterMode] = React.useState<"all" | "selected" | "private" | "public">("all");
  const [activeRepoForIssues, setActiveRepoForIssues] = React.useState<string | null>(null);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = React.useState(false);
  const [togglingMap, setTogglingMap] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    Promise.resolve().then(() => {
      setRepositories(initialRepositories);
    });
  }, [initialRepositories]);

  const handleToggleSync = async (repo: RepositoryItem) => {
    const newSelected = !repo.isSelected;
    setTogglingMap((prev) => ({ ...prev, [repo.id]: true }));

    // Optimistic update
    setRepositories((prev) =>
      prev.map((r) => (r.id === repo.id ? { ...r, isSelected: newSelected } : r))
    );

    try {
      await toggleRepositorySelection(repo.id, newSelected);
      toast.success(
        newSelected
          ? `Added ${repo.name} to active sync`
          : `Removed ${repo.name} from active sync`
      );
      onRepositoriesUpdated?.();
    } catch {
      // Revert optimistic update
      setRepositories((prev) =>
        prev.map((r) => (r.id === repo.id ? { ...r, isSelected: !newSelected } : r))
      );
      toast.error("Failed to update repository sync state");
    } finally {
      setTogglingMap((prev) => ({ ...prev, [repo.id]: false }));
    }
  };

  const handleOpenIssues = (repoFullName: string) => {
    setActiveRepoForIssues(repoFullName);
    setIsIssueDialogOpen(true);
  };

  // Filtered repositories
  const filteredRepos = React.useMemo(() => {
    return repositories.filter((repo) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = repo.fullName.toLowerCase().includes(q);
        const matchDesc = repo.description?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchDesc) return false;
      }

      // Filter mode
      if (filterMode === "selected" && !repo.isSelected) return false;
      if (filterMode === "private" && !repo.private) return false;
      if (filterMode === "public" && repo.private) return false;

      return true;
    });
  }, [repositories, searchQuery, filterMode]);

  return (
    <section className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between bg-card">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <FolderGit2Icon className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <span>Synchronized Repositories</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                {repositories.length} total
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Toggle which repositories to monitor and browse issues to convert into tasks.
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-secondary/60 p-1 text-xs">
          {(["all", "selected", "private", "public"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilterMode(mode)}
              className={`rounded-md px-3 py-1 font-medium capitalize transition-colors cursor-pointer ${
                filterMode === mode
                  ? "bg-card text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 border-b border-border/40 bg-secondary/20">
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories by name, owner, or topic..."
            className="h-8 pl-9 text-xs bg-card"
          />
        </div>
      </div>

      {/* Repositories Grid */}
      <div className="p-4 sm:p-6">
        {filteredRepos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-xs text-muted-foreground">
            <FolderGit2Icon className="size-8 text-muted-foreground/40 mb-2" />
            <span className="font-semibold text-foreground">No repositories match your filter</span>
            <p className="mt-1 text-muted-foreground max-w-sm">
              Try adjusting your search query or sync more repositories from your GitHub account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredRepos.map((repo) => {
              const isToggling = !!togglingMap[repo.id];

              return (
                <div
                  key={repo.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all shadow-xs ${
                    repo.isSelected
                      ? "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50"
                      : "border-border/70 bg-card hover:border-border opacity-70"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {repo.private ? (
                          <span title="Private Repository">
                            <LockIcon className="size-3.5 text-amber-500 shrink-0" />
                          </span>
                        ) : (
                          <span title="Public Repository">
                            <UnlockIcon className="size-3.5 text-muted-foreground shrink-0" />
                          </span>
                        )}
                        <a
                          href={repo.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-xs text-foreground hover:text-purple-600 dark:hover:text-purple-400 truncate flex items-center gap-1"
                        >
                          <span className="truncate">{repo.fullName}</span>
                          <ExternalLinkIcon className="size-2.5 opacity-60" />
                        </a>
                      </div>

                      <Badge
                        variant={repo.isSelected ? "default" : "outline"}
                        className={`text-[9px] px-1.5 py-0 ${
                          repo.isSelected
                            ? "bg-purple-600 text-white"
                            : "text-muted-foreground border-border"
                        }`}
                      >
                        {repo.isSelected ? "Syncing" : "Paused"}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {repo.description || "No description provided."}
                    </p>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <GitBranchIcon className="size-2.5 text-muted-foreground" />
                        {repo.defaultBranch || "main"}
                      </span>
                      <span>•</span>
                      <span>{repo.openIssuesCount} issues</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenIssues(repo.fullName)}
                        className="h-7 px-2 text-[11px] gap-1 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 cursor-pointer"
                      >
                        <GitPullRequestIcon className="size-3" />
                        <span>Issues</span>
                      </Button>

                      <Button
                        type="button"
                        variant={repo.isSelected ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleToggleSync(repo)}
                        disabled={isToggling}
                        className="h-7 px-2 text-[11px] cursor-pointer"
                      >
                        {isToggling
                          ? "..."
                          : repo.isSelected
                          ? "Pause"
                          : "Enable Sync"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GitHub Issue to Task Conversion Modal */}
      <GitHubIssueDialog
        repoFullName={activeRepoForIssues}
        open={isIssueDialogOpen}
        onOpenChange={setIsIssueDialogOpen}
        onTaskCreated={() => onRepositoriesUpdated?.()}
      />
    </section>
  );
}
