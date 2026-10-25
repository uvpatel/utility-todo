"use client";

import * as React from "react";
import {
  CalendarIcon,
  CheckCircle2Icon,
  GitPullRequestIcon,
  InboxIcon,
  MailIcon,
  SearchIcon,
  SparklesIcon,
  MessageSquareIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertCircleIcon,
  ExternalLinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GmailConnectionCard } from "@/components/gmail-connection-card";
import { EmailToTaskDialog } from "@/components/email-to-task-dialog";
import { GitHubConnectionCard } from "@/components/github-connection-card";
import { GitHubRepositoryList } from "@/components/github-repository-list";
import { getGmailMessages, type GmailConnectionStatus } from "@/lib/actions/gmail";
import { getGitHubConnection, getGitHubRepositories, type GitHubConnectionStatus } from "@/lib/actions/github";
import type { GmailEmailMessage } from "@/lib/integrations/gmail";
import type { githubRepositories } from "@/schema/schema";
import Link from "next/link";

interface IntegrationsPageProps {
  initialStatus: GmailConnectionStatus;
  initialMessages?: GmailEmailMessage[];
  initialNextPageToken?: string;
  initialTotalEstimate?: number;
  queryStatus?: string;
  queryError?: string;
  initialGitHubStatus?: GitHubConnectionStatus;
  initialGitHubRepositories?: (typeof githubRepositories.$inferSelect)[];
  githubStatusParam?: string;
  githubErrorParam?: string;
}

export function IntegrationsPage({
  initialStatus,
  initialMessages = [],
  initialNextPageToken,
  initialTotalEstimate,
  queryStatus,
  queryError,
  initialGitHubStatus = {
    isConnected: false,
    isAppConfigured: false,
    appConfig: {
      isConfigured: false,
      isAppConfigured: false,
      hasAppId: false,
      hasPrivateKey: false,
      hasWebhookSecret: false,
      hasClientId: false,
      hasClientSecret: false,
      appSlug: null,
      missingKeys: ["GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY"],
    },
  },
  initialGitHubRepositories = [],
  githubStatusParam,
  githubErrorParam,
}: IntegrationsPageProps) {
  const [status, setStatus] = React.useState<GmailConnectionStatus>(initialStatus);
  const [gitHubStatus, setGitHubStatus] = React.useState<GitHubConnectionStatus>(initialGitHubStatus);
  const [gitHubRepos, setGitHubRepos] = React.useState<typeof initialGitHubRepositories>(initialGitHubRepositories);
  const [activeTab, setActiveTab] = React.useState<"all" | "github" | "gmail">("all");
  const [messages, setMessages] = React.useState<GmailEmailMessage[]>(initialMessages);
  const [nextPageToken, setNextPageToken] = React.useState<string | undefined>(initialNextPageToken);
  const [pageTokensHistory, setPageTokensHistory] = React.useState<string[]>([]);
  const [totalEstimate, setTotalEstimate] = React.useState<number | undefined>(initialTotalEstimate);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<"all" | "unread" | "actionable">("all");
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [selectedEmailForTask, setSelectedEmailForTask] = React.useState<GmailEmailMessage | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false);
  const [convertedEmailIds, setConvertedEmailIds] = React.useState<Record<string, string>>({});
  const [previewEmail, setPreviewEmail] = React.useState<GmailEmailMessage | null>(null);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);
    getGmailMessages({
      search: searchQuery.trim() || undefined,
      filter: activeFilter,
    })
      .then((res) => {
        if (isMounted) {
          setMessages(res.messages);
          setNextPageToken(res.nextPageToken);
          setTotalEstimate(res.resultSizeEstimate);
          setPageTokensHistory([]);
        }
      })
      .catch((err) => {
        console.error("Error loading messages:", err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingMessages(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, activeFilter]);

  const handleManualSync = () => {
    setIsLoadingMessages(true);
    getGmailMessages({
      search: searchQuery.trim() || undefined,
      filter: activeFilter,
    })
      .then((res) => {
        setMessages(res.messages);
        setNextPageToken(res.nextPageToken);
        setTotalEstimate(res.resultSizeEstimate);
        setPageTokensHistory([]);
        setStatus((prev) => ({
          ...prev,
          isConnected: res.isConnected,
          isDemo: res.isDemo,
        }));
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  };

  const handleNextPage = () => {
    if (!nextPageToken || isLoadingMessages) return;
    const currentToken = nextPageToken;
    setIsLoadingMessages(true);

    getGmailMessages({
      search: searchQuery.trim() || undefined,
      filter: activeFilter,
      pageToken: currentToken,
    })
      .then((res) => {
        setMessages(res.messages);
        setPageTokensHistory((prev) => [...prev, currentToken]);
        setNextPageToken(res.nextPageToken);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  };

  const handlePreviousPage = () => {
    if (pageTokensHistory.length === 0 || isLoadingMessages) return;
    const previousHistory = [...pageTokensHistory];
    previousHistory.pop(); // pop current page
    const prevToken = previousHistory.length > 0 ? previousHistory[previousHistory.length - 1] : undefined;

    setIsLoadingMessages(true);
    getGmailMessages({
      search: searchQuery.trim() || undefined,
      filter: activeFilter,
      pageToken: prevToken,
    })
      .then((res) => {
        setMessages(res.messages);
        setPageTokensHistory(previousHistory);
        setNextPageToken(res.nextPageToken);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  };

  const handleOpenConvert = (email: GmailEmailMessage) => {
    setSelectedEmailForTask(email);
    setIsTaskDialogOpen(true);
  };

  const handleTaskConverted = (taskId: string) => {
    if (selectedEmailForTask) {
      setConvertedEmailIds((prev) => ({
        ...prev,
        [selectedEmailForTask.id]: taskId,
      }));
    }
  };

  const refreshGitHubData = async () => {
    try {
      const [newStatus, newRepos] = await Promise.all([
        getGitHubConnection(),
        getGitHubRepositories(),
      ]);
      setGitHubStatus(newStatus);
      setGitHubRepos(newRepos);
    } catch (err) {
      console.error("Failed to refresh GitHub data:", err);
    }
  };

  const renderOAuthBanner = () => {
    if (queryStatus === "connected") {
      return (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
          <span>Google Gmail account connected successfully. You can now browse emails and convert them into tasks.</span>
        </div>
      );
    }

    if (githubStatusParam === "connected") {
      return (
        <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2Icon className="size-4 shrink-0 text-emerald-500" />
          <span>GitHub account and repositories connected successfully. You can now browse repositories, sync issues, and convert them to tasks.</span>
        </div>
      );
    }

    if (githubErrorParam) {
      let description = "An error occurred during GitHub authorization.";
      if (githubErrorParam === "invalid_state") {
        description = "Security state verification failed (possible CSRF attempt or request expired). Please try connecting again.";
      }

      return (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircleIcon className="size-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">GitHub Authorization Error</span>
            <p className="text-[11px] opacity-90">{description}</p>
          </div>
        </div>
      );
    }

    if (queryError) {
      let description = "An error occurred during Google OAuth authorization.";
      if (queryError === "missing_google_credentials") {
        description = "Google Client ID and Secret are not configured in your .env file. You can either provide GOOGLE_CLIENT_ID or use the instant Demo Inbox button below.";
      } else if (queryError === "invalid_state") {
        description = "Security state verification failed (possible CSRF attempt or request expired). Please try connecting again.";
      } else if (queryError === "authorization_cancelled") {
        description = "Google account authorization was cancelled.";
      } else if (queryError === "token_exchange_failed") {
        description = "Failed to exchange authorization code for Google access tokens. Please verify your client credentials.";
      }

      return (
        <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-800 dark:text-rose-300">
          <AlertCircleIcon className="size-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold">OAuth Connection Error</span>
            <p className="text-[11px] opacity-90">{description}</p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-8 max-w-6xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-card border border-border shadow-xs text-xl">
            ⚡
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Integrations & Connected Apps
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Connect external services to automate task creation, sync communications, and eliminate manual copy-pasting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Link href="/todo">
              <InboxIcon className="size-3.5" />
              <span>Open Tasks</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* OAuth Result Alert Banner */}
      {renderOAuthBanner()}

      {/* Category Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "all"
              ? "bg-secondary text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Integrations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("github")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "github"
              ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GitPullRequestIcon className="size-3.5 text-purple-500" />
          <span>GitHub</span>
          {gitHubStatus.isConnected && (
            <span className="size-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gmail")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === "gmail"
              ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MailIcon className="size-3.5 text-rose-500" />
          <span>Gmail</span>
          {status.isConnected && (
            <span className="size-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* 1. GitHub Integration Section */}
      {(activeTab === "all" || activeTab === "github") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <span>GitHub Repositories & Code</span>
              {gitHubStatus.isConnected && (
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-mono border border-emerald-500/20">
                  Live
                </span>
              )}
            </h2>
            {gitHubStatus.isConnected && (
              <Link
                href="/github"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
              >
                <span>Open GitHub Dashboard</span>
                <ExternalLinkIcon className="size-3" />
              </Link>
            )}
          </div>
          <GitHubConnectionCard
            initialStatus={gitHubStatus}
            onRefresh={refreshGitHubData}
          />
          {gitHubStatus.isConnected && (
            <GitHubRepositoryList
              initialRepositories={gitHubRepos}
              onRepositoriesUpdated={refreshGitHubData}
            />
          )}
        </section>
      )}

      {/* 2. Gmail Integration Primary Card */}
      {(activeTab === "all" || activeTab === "gmail") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Email & Inbox Integration
            </h2>
          </div>
          <GmailConnectionCard
            initialStatus={status}
            onRefresh={handleManualSync}
          />
        </section>
      )}

      {/* 3. Live Gmail Message Browser & Task Converter (Visible when connected) */}
      {(activeTab === "all" || activeTab === "gmail") && status.isConnected && (
        <section className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          {/* Section Header */}
          <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between bg-card">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MailIcon className="size-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>Gmail Inbox & Action Items</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {messages.length} messages
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select an email to extract actionable steps and convert it directly into a scheduled task.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 p-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                  activeFilter === "all"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("unread")}
                className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                  activeFilter === "unread"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("actionable")}
                className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  activeFilter === "actionable"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <SparklesIcon className="size-3 text-amber-500" />
                <span>Actionable</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="border-b border-border/60 bg-secondary/30 px-6 py-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search emails by sender, subject, or keyword..."
                className="h-9 pl-9 border-border bg-background text-xs text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Messages Table / List */}
          {isLoadingMessages ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-xs text-muted-foreground">
              <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <span>Fetching emails from Gmail...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-xs text-muted-foreground">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-3">
                <MailIcon className="size-6" />
              </div>
              <span className="font-semibold text-foreground">No emails found</span>
              <p className="mt-1 text-muted-foreground max-w-sm">
                No matching messages found for your search filter. Try clearing your search keywords.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {messages.map((email) => {
                const isConverted = Boolean(convertedEmailIds[email.id]);

                return (
                  <div
                    key={email.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-6 hover:bg-secondary/40 transition-colors group ${
                      email.isUnread ? "bg-primary/5 dark:bg-primary/5" : ""
                    }`}
                  >
                    {/* Left: Sender & Subject & Snippet */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="flex size-9 items-center justify-center rounded-full bg-secondary border border-border text-xs font-semibold text-foreground shrink-0 mt-0.5">
                        {email.fromName ? email.fromName[0].toUpperCase() : "M"}
                      </div>

                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-medium truncate ${email.isUnread ? "text-foreground font-bold" : "text-foreground"}`}>
                            {email.fromName}
                          </span>
                          <span className="text-[11px] text-muted-foreground truncate hidden md:inline">
                            &lt;{email.fromEmail}&gt;
                          </span>

                          {email.isUnread && (
                            <span className="size-1.5 rounded-full bg-primary shrink-0" />
                          )}

                          {email.suggestedPriority === "urgent" && (
                            <span className="rounded-md bg-rose-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                              Urgent
                            </span>
                          )}

                          {email.suggestedPriority === "high" && (
                            <span className="rounded-md bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                              High Priority
                            </span>
                          )}

                          {isConverted && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2Icon className="size-3" />
                              Task Created
                            </span>
                          )}
                        </div>

                        <div className={`text-xs ${email.isUnread ? "font-semibold text-foreground" : "font-normal text-foreground"}`}>
                          {email.subject}
                        </div>

                        <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                          {email.snippet}
                        </p>
                      </div>
                    </div>

                    {/* Right: Date & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                      <div className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <ClockIcon className="size-3" />
                        <span>
                          {new Date(email.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewEmail(email)}
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Preview
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleOpenConvert(email)}
                          className={`h-8 gap-1.5 text-xs font-medium cursor-pointer shadow-xs ${
                            isConverted
                              ? "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                              : "bg-primary text-primary-foreground hover:bg-primary/90"
                          }`}
                        >
                          {isConverted ? (
                            <>
                              <CheckCircle2Icon className="size-3 text-emerald-500" />
                              <span>Convert Again</span>
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="size-3" />
                              <span>Convert to Task</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {(nextPageToken || pageTokensHistory.length > 0) && (
            <div className="flex items-center justify-between border-t border-border/60 bg-secondary/30 px-6 py-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Page {pageTokensHistory.length + 1}</span>
                {totalEstimate ? (
                  <span className="font-mono text-[11px] text-muted-foreground/75">
                    ({totalEstimate} total in mailbox)
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageTokensHistory.length === 0 || isLoadingMessages}
                  onClick={handlePreviousPage}
                  className="h-8 gap-1 text-xs cursor-pointer"
                >
                  <ChevronLeftIcon className="size-3.5" />
                  <span>Previous</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={!nextPageToken || isLoadingMessages}
                  onClick={handleNextPage}
                  className="h-8 gap-1 text-xs cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRightIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. Preview Email Modal Drawer */}
      {previewEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  {previewEmail.subject}
                </h3>
                <div className="text-xs text-muted-foreground">
                  From: <span className="font-medium text-foreground">{previewEmail.from}</span>
                </div>
                <div className="text-[11px] font-mono text-muted-foreground">
                  Date: {new Date(previewEmail.date).toLocaleString()}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewEmail(null)}
                className="size-8 text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            <div className="max-h-72 overflow-y-auto whitespace-pre-line rounded-lg border border-border bg-secondary/40 p-4 text-xs text-foreground leading-relaxed font-sans">
              {previewEmail.bodyText || previewEmail.snippet}
            </div>

            {previewEmail.suggestedActionItems.length > 0 && (
              <div className="rounded-lg border border-border/80 bg-primary/5 p-3 space-y-1.5">
                <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <SparklesIcon className="size-3" />
                  <span>Suggested Action Items:</span>
                </div>
                <ul className="text-xs text-foreground space-y-1 list-disc list-inside">
                  {previewEmail.suggestedActionItems.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewEmail(null)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const target = previewEmail;
                  setPreviewEmail(null);
                  handleOpenConvert(target);
                }}
                className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium cursor-pointer"
              >
                <SparklesIcon className="size-3" />
                <span>Convert to Task</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Other Available Integrations */}
      <section className="space-y-4 pt-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Other Workspace Integrations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* GitHub */}
          <div
            onClick={() => setActiveTab("github")}
            className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs cursor-pointer hover:border-purple-500/50 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <GitPullRequestIcon className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">GitHub Issues & PRs</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Discover repositories, monitor branches, and convert GitHub issues directly to prioritized tasks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                {gitHubStatus.isConnected ? "Connected & Active" : "App Integration"}
              </span>
              <span className="text-muted-foreground text-[11px]">
                {gitHubStatus.isConnected ? `${gitHubRepos.length} Repos` : "Ready"}
              </span>
            </div>
          </div>

          {/* Slack */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs opacity-75">
            <div className="space-y-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                <MessageSquareIcon className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Slack Bot Notifications</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receive morning daily standup summaries and due-date alerts right in your team channels.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-muted-foreground">Coming Soon</span>
              <span className="text-muted-foreground text-[11px]">V2 Roadmap</span>
            </div>
          </div>

          {/* Google Calendar */}
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs opacity-75">
            <div className="space-y-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                <CalendarIcon className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Google Calendar Sync</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Two-way synchronization for task deadlines and estimated deep work focus blocks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-muted-foreground">Coming Soon</span>
              <span className="text-muted-foreground text-[11px]">V2 Roadmap</span>
            </div>
          </div>
        </div>
      </section>

      {/* Task Creation Modal */}
      <EmailToTaskDialog
        email={selectedEmailForTask}
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onSuccess={handleTaskConverted}
      />
    </div>
  );
}
