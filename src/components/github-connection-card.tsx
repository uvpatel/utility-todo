"use client";

import * as React from "react";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FolderGit2Icon,
  GitForkIcon,
  GitPullRequestIcon,
  HelpCircleIcon,
  InfoIcon,
  KeyRoundIcon,
  RadioIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  disconnectGitHub,
  syncGitHubRepositories,
  type GitHubConnectionStatus,
} from "@/lib/actions/github";
import { toast } from "sonner";
import Image from "next/image";

interface GitHubConnectionCardProps {
  initialStatus: GitHubConnectionStatus;
  onRefresh?: () => void;
}

export function GitHubConnectionCard({ initialStatus, onRefresh }: GitHubConnectionCardProps) {
  const [status, setStatus] = React.useState<GitHubConnectionStatus>(initialStatus);
  const [prevInitialStatus, setPrevInitialStatus] = React.useState(initialStatus);
  if (initialStatus !== prevInitialStatus) {
    setPrevInitialStatus(initialStatus);
    setStatus(initialStatus);
  }
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = React.useState(false);
  const [isSetupDialogOpen, setIsSetupDialogOpen] = React.useState(false);

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await syncGitHubRepositories();
      toast.success(res.message);
      setStatus((prev) => ({
        ...prev,
        lastSyncedAt: new Date(),
        totalReposCount: res.count,
      }));
      onRefresh?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to sync repositories");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnectGitHub();
      setStatus((prev) => ({
        ...prev,
        isConnected: false,
        accountLogin: undefined,
        installationId: undefined,
        totalReposCount: 0,
        selectedReposCount: 0,
      }));
      setIsDisconnectDialogOpen(false);
      toast.success("GitHub App disconnected successfully. All local tasks preserved.");
      onRefresh?.();
    } catch {
      toast.error("Failed to disconnect GitHub");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const appConfig = status.appConfig || {
    isConfigured: false,
    hasAppId: false,
    hasPrivateKey: false,
    hasWebhookSecret: false,
    missingKeys: ["GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY"],
  };

  // Render setup modal dialog for account `uvpatel`
  const renderSetupDialog = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const callbackUrl = `${origin}/api/integrations/github/callback`;
    const webhookUrl = `${origin}/api/integrations/github/webhook`;

    return (
      <Dialog open={isSetupDialogOpen} onOpenChange={setIsSetupDialogOpen}>
        <DialogContent className="max-w-2xl border-border bg-card p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
              <KeyRoundIcon className="size-5 text-purple-500" />
              <span>GitHub App Configuration Checklist (Account: uvpatel)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              To connect your GitHub account (<span className="font-mono text-foreground">uvpatel</span>) and repositories securely using GitHub App installation tokens, configure your application settings in the GitHub Developer Portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs text-foreground">
            {/* Environment Variable Audit */}
            <div className="rounded-xl border border-border bg-secondary/30 p-3.5 space-y-2">
              <h4 className="font-semibold text-xs flex items-center justify-between text-foreground">
                <span>Environment Configuration Status</span>
                <Badge
                  variant={appConfig.isConfigured ? "default" : "destructive"}
                  className="text-[10px]"
                >
                  {appConfig.isConfigured ? "Configured" : "Incomplete"}
                </Badge>
              </h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span>GITHUB_APP_ID:</span>
                  <span className={appConfig.hasAppId ? "text-emerald-500" : "text-rose-500"}>
                    {appConfig.hasAppId ? "✓ Present" : "✗ Missing"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GITHUB_APP_PRIVATE_KEY:</span>
                  <span className={appConfig.hasPrivateKey ? "text-emerald-500" : "text-rose-500"}>
                    {appConfig.hasPrivateKey ? "✓ Valid RSA PEM Key" : "✗ Missing / Invalid PEM"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GITHUB_WEBHOOK_SECRET:</span>
                  <span className={appConfig.hasWebhookSecret ? "text-emerald-500" : "text-amber-500"}>
                    {appConfig.hasWebhookSecret ? "✓ Configured" : "⚠ Not set (Webhooks unverified)"}
                  </span>
                </div>
              </div>
            </div>

            {/* Portal Configuration Settings */}
            <div className="space-y-3">
              <h4 className="font-semibold text-xs text-foreground">
                GitHub App Portal Registration Parameters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg border border-border bg-background space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Homepage URL</span>
                  <p className="font-mono text-xs select-all break-all">{origin}</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-background space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Callback URL</span>
                  <p className="font-mono text-xs select-all break-all">{callbackUrl}</p>
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-background space-y-0.5 sm:col-span-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Webhook URL</span>
                  <p className="font-mono text-xs select-all break-all">{webhookUrl}</p>
                </div>
              </div>
            </div>

            {/* Required Permissions */}
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-foreground">Required Repository Permissions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 rounded-lg border border-border bg-secondary/20 flex items-center justify-between">
                  <span>Issues</span>
                  <Badge variant="outline" className="text-[10px] font-mono">Read & Write</Badge>
                </div>
                <div className="p-2 rounded-lg border border-border bg-secondary/20 flex items-center justify-between">
                  <span>Pull Requests</span>
                  <Badge variant="outline" className="text-[10px] font-mono">Read-only</Badge>
                </div>
                <div className="p-2 rounded-lg border border-border bg-secondary/20 flex items-center justify-between">
                  <span>Commit Statuses / Checks</span>
                  <Badge variant="outline" className="text-[10px] font-mono">Read-only</Badge>
                </div>
                <div className="p-2 rounded-lg border border-border bg-secondary/20 flex items-center justify-between">
                  <span>Metadata</span>
                  <Badge variant="outline" className="text-[10px] font-mono">Read-only (Mandatory)</Badge>
                </div>
              </div>
            </div>

            {/* Subscribed Events */}
            <div className="space-y-2">
              <h4 className="font-semibold text-xs text-foreground">Subscribed Webhook Events</h4>
              <div className="flex flex-wrap gap-1.5">
                {["installation", "installation_repositories", "issues", "pull_request", "check_run"].map((ev) => (
                  <Badge key={ev} variant="secondary" className="font-mono text-[10px]">
                    {ev}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Instructions to Generate PEM */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                <InfoIcon className="size-4 shrink-0" />
                <span>How to Generate Your RSA Private Key</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                In your GitHub App settings, scroll to <strong>Private keys</strong> and click <strong>Generate a private key</strong>. Save the downloaded <span className="font-mono">.pem</span> file, convert newlines to literal <span className="font-mono">\n</span> or base64-encode it, and assign it to <span className="font-mono">GITHUB_APP_PRIVATE_KEY</span> in your <span className="font-mono">.env</span> file.
              </p>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSetupDialogOpen(false)}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              asChild
              size="sm"
              className="text-xs bg-foreground text-background hover:bg-foreground/90 gap-1.5"
            >
              <a
                href="https://github.com/settings/apps"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>Open GitHub App Settings</span>
                <ExternalLinkIcon className="size-3.5" />
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Render when disconnected
  if (!status.isConnected) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <FolderGit2Icon className="size-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">GitHub Integration</h3>
                {appConfig.isConfigured ? (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Disconnected
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <ShieldAlertIcon className="size-3" />
                    App Unconfigured
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Install and connect the GitHub App on your GitHub account (<span className="font-mono text-foreground">uvpatel</span>) to synchronize repositories, convert issues into actionable tasks, and receive real-time webhook updates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSetupDialogOpen(true)}
              className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <HelpCircleIcon className="size-3.5 text-purple-500" />
              <span>Setup Guide</span>
            </Button>

            <Button
              asChild
              className="h-9 gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 px-4 text-xs font-medium cursor-pointer shadow-xs"
            >
              <a href="/api/integrations/github/connect">
                <GitForkIcon className="size-3.5" />
                <span>Connect GitHub App</span>
              </a>
            </Button>
          </div>
        </div>

        {/* Missing configuration notice banner if app not configured */}
        {!appConfig.isConfigured && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircleIcon className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">GitHub App Credentials Incomplete</span>
              <p className="text-[11px] leading-relaxed opacity-90">
                Missing environment keys: <span className="font-mono font-bold">{appConfig.missingKeys?.join(", ") || "GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY"}</span>. Click &ldquo;Setup Guide&rdquo; above for instructions on generating your RSA key and configuring your GitHub App for <span className="font-mono">uvpatel</span>.
              </p>
            </div>
          </div>
        )}

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
            <CheckCircle2Icon className="size-3.5 text-emerald-500 shrink-0" />
            <span>Targeted Repository Selection</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
            <GitPullRequestIcon className="size-3.5 text-purple-500 shrink-0" />
            <span>1-Click Issue to Task Import</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
            <ShieldCheckIcon className="size-3.5 text-blue-500 shrink-0" />
            <span>HMAC Webhooks & Loop Prevention</span>
          </div>
        </div>

        {renderSetupDialog()}
      </div>
    );
  }

  // Render when connected
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-6">
      {/* Header with Account Profile */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          {status.accountAvatarUrl ? (
            <Image
              src={status.accountAvatarUrl}
              alt={status.accountLogin || "GitHub"}
              width={44}
              height={44}
              unoptimized
              className="size-11 rounded-full border border-border object-cover"
            />
          ) : (
            <div className="flex size-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-sm border border-purple-500/20">
              GH
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                @{status.accountLogin || "uvpatel"}
              </h3>
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {status.accountType || "User"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Installation ID: <span className="font-mono text-foreground font-semibold">{status.installationId}</span>
              {status.repositorySelection && (
                <span> • Scope: <strong className="capitalize">{status.repositorySelection}</strong></span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="h-8 gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCwIcon className={`size-3.5 ${isSyncing ? "animate-spin text-primary" : "text-muted-foreground"}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Repos"}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsSetupDialogOpen(true)}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            title="View app configuration & permissions"
          >
            <HelpCircleIcon className="size-3.5" />
            <span className="hidden sm:inline">App Info</span>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <a
              href={`https://github.com/settings/installations/${status.installationId || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Manage repository permissions on GitHub"
            >
              <ExternalLinkIcon className="size-3.5" />
              <span className="hidden sm:inline">Manage</span>
            </a>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsDisconnectDialogOpen(true)}
            className="h-8 gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
          >
            <Trash2Icon className="size-3.5" />
            <span className="hidden sm:inline">Disconnect</span>
          </Button>
        </div>
      </div>

      {/* Sync Error Banner if applicable */}
      {status.lastSyncError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircleIcon className="size-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <span className="font-semibold">Recent Synchronization Issue</span>
            <p className="text-[11px] leading-relaxed opacity-90 break-all">{status.lastSyncError}</p>
          </div>
        </div>
      )}

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border/50 text-xs">
        <div className="p-3 rounded-xl bg-secondary/30 space-y-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <FolderGit2Icon className="size-3 text-purple-500" />
            Authorized Repos
          </span>
          <p className="text-lg font-bold font-mono text-foreground">
            {status.totalReposCount ?? 0}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-secondary/30 space-y-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2Icon className="size-3 text-emerald-500" />
            Synced Repos
          </span>
          <p className="text-lg font-bold font-mono text-foreground">
            {status.selectedReposCount ?? 0}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-secondary/30 space-y-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <RefreshCwIcon className="size-3 text-blue-500" />
            Last Synced
          </span>
          <p className="text-xs font-mono text-foreground mt-1">
            {status.lastSyncedAt
              ? new Date(status.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Just now"}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-secondary/30 space-y-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <RadioIcon className="size-3 text-amber-500" />
            Last Webhook
          </span>
          <p className="text-xs font-mono text-foreground mt-1 truncate">
            {status.lastWebhookAt
              ? `${status.lastWebhookEvent || "event"} (${new Date(status.lastWebhookAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`
              : "Awaiting webhook"}
          </p>
        </div>
      </div>

      {renderSetupDialog()}

      {/* Disconnect Confirmation Dialog */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent className="border-border bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertCircleIcon className="size-5 text-rose-500" />
              Disconnect GitHub Account?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-2">
              Are you sure you want to disconnect @{status.accountLogin || "uvpatel"}? Disconnecting will remove your synchronized repository links and webhook listeners. <strong>All of your local tasks, checklists, notes, and Kanban items will remain permanently preserved.</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="text-xs">
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="text-xs font-medium cursor-pointer"
            >
              {isDisconnecting ? "Disconnecting..." : "Confirm Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
