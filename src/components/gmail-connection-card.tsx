"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LogOutIcon,
  MailIcon,
  RefreshCwIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { connectDemoGmailAccount, disconnectGmail, type GmailConnectionStatus } from "@/lib/actions/gmail";
import { useRouter } from "next/navigation";

interface GmailConnectionCardProps {
  initialStatus: GmailConnectionStatus;
  onRefresh?: () => void;
}

export function GmailConnectionCard({
  initialStatus,
  onRefresh,
}: GmailConnectionCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const status = initialStatus;

  const handleConnectDemo = async () => {
    setIsLoading(true);
    try {
      const res = await connectDemoGmailAccount();
      if (res.success) {
        toast.success(res.message);
        router.refresh();
        if (onRefresh) onRefresh();
      }
    } catch {
      toast.error("Failed to connect demo Gmail account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Gmail?")) return;
    setIsLoading(true);
    try {
      const res = await disconnectGmail();
      if (res.success) {
        toast.success("Gmail disconnected");
        router.refresh();
        if (onRefresh) onRefresh();
      }
    } catch {
      toast.error("Failed to disconnect Gmail");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Branding & Status */}
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
            <MailIcon className="size-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-foreground">Google Gmail</h3>
              {status.isConnected ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Connected
                </span>
              ) : (
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Not Connected
                </span>
              )}

              {status.isDemo && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                  Demo Account
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Connect your Gmail account to inspect recent actionable emails, extract tasks with AI, and import action items directly into your PostgreSQL task workspace.
            </p>

            {status.isConnected && status.email && (
              <div className="pt-1 text-xs font-mono text-foreground flex items-center gap-2">
                <span className="text-muted-foreground">Authorized account:</span>
                <span className="font-semibold underline decoration-dotted underline-offset-2">
                  {status.email}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {status.isConnected ? (
            <>
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="h-8 gap-1.5 text-xs cursor-pointer"
                  title="Sync inbox"
                >
                  <RefreshCwIcon className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  <span>Sync Mail</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <LogOutIcon className="size-3.5" />
                <span>Disconnect</span>
              </Button>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                asChild
                className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium shadow-xs cursor-pointer"
              >
                <a href="/api/integrations/gmail/connect">
                  <MailIcon className="size-3.5" />
                  <span>Connect with Google</span>
                </a>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleConnectDemo}
                disabled={isLoading}
                className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                title="Instant test mode without configuring Google OAuth in Google Cloud"
              >
                <SparklesIcon className="size-3.5 text-amber-500" />
                <span>Demo Inbox</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Security disclaimer footer */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ShieldCheckIcon className="size-3.5 text-primary" />
          <span>Restricted read-only access (<code className="font-mono text-[10px]">gmail.readonly</code>). Tokens encrypted at rest with AES-256.</span>
        </div>
        <span className="text-[10px]">OAuth 2.0 Web Server</span>
      </div>
    </div>
  );
}
