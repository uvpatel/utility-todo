import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { githubInstallations, githubRepositories } from "@/schema/schema";
import { eq } from "drizzle-orm";
import {
  createOctokitClient,
  encryptGitHubToken,
  exchangeGitHubCode,
  fetchInstallationMetadata,
  fetchInstallationRepositories,
  fetchUserRepositories,
  getGitHubAppConfigStatus,
  verifyGitHubOAuthState,
} from "@/lib/integrations/github";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = new URL("/settings/integrations", request.url);

  if (error) {
    baseUrl.searchParams.set("github_error", errorDescription || error);
    return NextResponse.redirect(baseUrl);
  }

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Validate state parameter to protect against CSRF and replay attacks
  if (!state || !verifyGitHubOAuthState(state, session.user.id)) {
    baseUrl.searchParams.set("github_error", "invalid_state");
    return NextResponse.redirect(baseUrl);
  }

  const appConfig = getGitHubAppConfigStatus();
  let accountLogin = session.user.name?.toLowerCase().replace(/\s+/g, "-") || "developer";
  let accountAvatarUrl: string | null = session.user.image || null;
  let accountType = "User";
  let finalInstallationId = installationId;
  let accessToken: string | null = null;
  let discoveredRepos: Array<{
    id: string;
    name: string;
    fullName: string;
    owner: string;
    private: boolean;
    htmlUrl: string;
    description: string | null;
    defaultBranch: string;
    openIssuesCount: number;
    openPrsCount?: number;
  }> = [];

  // Flow A: GitHub App Installation flow (recommended)
  if (installationId && appConfig.isAppConfigured) {
    try {
      const meta = await fetchInstallationMetadata(installationId);
      accountLogin = meta.account?.login || accountLogin;
      accountAvatarUrl = meta.account?.avatar_url || accountAvatarUrl;
      accountType = meta.account?.type || accountType;

      discoveredRepos = await fetchInstallationRepositories(installationId);
    } catch (appErr) {
      console.error("Error retrieving GitHub App installation details:", appErr);
      baseUrl.searchParams.set(
        "github_error",
        appErr instanceof Error ? appErr.message : "installation_metadata_failed"
      );
      return NextResponse.redirect(baseUrl);
    }
  }

  // Flow B: OAuth user code exchange (if code is provided)
  if (code) {
    const tokenData = await exchangeGitHubCode(code);
    if (tokenData?.access_token) {
      accessToken = tokenData.access_token;
      try {
        const octokit = createOctokitClient(accessToken);
        const { data: userProfile } = await octokit.rest.users.getAuthenticated();
        accountLogin = userProfile.login;
        accountAvatarUrl = userProfile.avatar_url;
        accountType = userProfile.type || accountType;

        if (discoveredRepos.length === 0) {
          discoveredRepos = await fetchUserRepositories(accessToken);
        }
      } catch (err) {
        console.error("Failed to fetch GitHub authenticated user via token:", err);
      }
    }
  }

  if (!finalInstallationId) {
    finalInstallationId = `user_${session.user.id.slice(0, 8)}_${Date.now()}`;
  }

  const encryptedToken = accessToken ? encryptGitHubToken(accessToken) : null;

  // Upsert installation record in PostgreSQL
  const [existing] = await db
    .select()
    .from(githubInstallations)
    .where(eq(githubInstallations.userId, session.user.id))
    .limit(1);

  if (existing) {
    await db
      .update(githubInstallations)
      .set({
        installationId: finalInstallationId,
        accountLogin,
        accountType,
        accountAvatarUrl,
        accessToken: encryptedToken || existing.accessToken,
        repositorySelection: setupAction === "request" ? "selected" : "all",
        lastSyncError: null,
        updatedAt: new Date(),
      })
      .where(eq(githubInstallations.id, existing.id));
  } else {
    await db.insert(githubInstallations).values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      installationId: finalInstallationId,
      accountLogin,
      accountType,
      accountAvatarUrl,
      targetType: accountType,
      repositorySelection: "all",
      accessToken: encryptedToken,
      permissions: JSON.stringify({ issues: "write", metadata: "read", pull_requests: "read" }),
    });
  }

  // Synchronize discovered repositories into PostgreSQL
  if (discoveredRepos.length > 0) {
    for (const repo of discoveredRepos) {
      const [existingRepo] = await db
        .select()
        .from(githubRepositories)
        .where(
          eq(githubRepositories.userId, session.user.id)
        )
        .limit(1);

      if (existingRepo) {
        await db
          .update(githubRepositories)
          .set({
            name: repo.name,
            fullName: repo.fullName,
            owner: repo.owner,
            private: repo.private,
            htmlUrl: repo.htmlUrl,
            description: repo.description,
            defaultBranch: repo.defaultBranch,
            openIssuesCount: repo.openIssuesCount,
            openPrsCount: repo.openPrsCount || 0,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(githubRepositories.id, existingRepo.id));
      } else {
        await db.insert(githubRepositories).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          installationId: finalInstallationId,
          githubRepoId: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          owner: repo.owner,
          private: repo.private,
          htmlUrl: repo.htmlUrl,
          description: repo.description,
          defaultBranch: repo.defaultBranch,
          openIssuesCount: repo.openIssuesCount,
          openPrsCount: repo.openPrsCount || 0,
          isSelected: true,
          lastSyncedAt: new Date(),
        });
      }
    }
  }

  baseUrl.searchParams.set("github_status", "connected");
  return NextResponse.redirect(baseUrl);
}
