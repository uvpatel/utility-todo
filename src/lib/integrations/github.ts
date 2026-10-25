import crypto from "crypto";
import { Octokit } from "octokit";

export interface GitHubRepoDTO {
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
}

export interface GitHubIssueDTO {
  id: string;
  number: number;
  title: string;
  body: string | null;
  htmlUrl: string;
  state: "open" | "closed";
  author: string;
  labels: string[];
  assignee?: string | null;
  createdAt: string;
  updatedAt: string;
  repositoryFullName?: string;
}

export interface GitHubPullRequestDTO {
  id: string;
  number: number;
  title: string;
  body: string | null;
  htmlUrl: string;
  state: "open" | "closed" | "merged";
  draft: boolean;
  author: string;
  headRef: string;
  baseRef: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  repositoryFullName: string;
}

export interface GitHubCheckRunDTO {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "timed_out"
    | "action_required"
    | "skipped"
    | null;
  htmlUrl: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface GitHubActivityEventDTO {
  id: string;
  type: string;
  actor: string;
  actorAvatarUrl?: string;
  repoName: string;
  action?: string;
  title?: string;
  url?: string;
  createdAt: string;
}

export interface GitHubAppConfigStatus {
  isConfigured: boolean;
  isAppConfigured: boolean;
  hasAppId: boolean;
  hasPrivateKey: boolean;
  hasWebhookSecret: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  appSlug: string | null;
  missingKeys: string[];
}

// -------------------------------------------------------------
// AES-256-GCM Token Encryption (Authenticated symmetric encryption)
// -------------------------------------------------------------
function getEncryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET || "utility-todo-secure-secret-key-default-32";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptGitHubToken(token: string): string {
  try {
    const iv = crypto.randomBytes(12);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("GitHub token encryption error:", err);
    return token;
  }
}

export function decryptGitHubToken(encryptedData: string): string {
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) return encryptedData;
    const [ivHex, authTagHex, encryptedText] = parts;
    if (ivHex.length !== 24 || authTagHex.length !== 32 || encryptedText.length % 2 !== 0) {
      return encryptedData;
    }
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("GitHub token decryption error:", err);
    return encryptedData;
  }
}

// -------------------------------------------------------------
// HMAC-Signed OAuth State Generation with 10-Minute Expiry
// -------------------------------------------------------------
export function createGitHubOAuthState(userId: string): string {
  const secret = process.env.BETTER_AUTH_SECRET || "utility-todo-state-secret-default";
  const payload = JSON.stringify({
    userId,
    timestamp: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  });
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${hmac}`).toString("base64url");
}

export function verifyGitHubOAuthState(state: string, expectedUserId: string): boolean {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const dotIndex = decoded.lastIndexOf(".");
    if (dotIndex === -1) return false;

    const payloadStr = decoded.substring(0, dotIndex);
    const signature = decoded.substring(dotIndex + 1);
    if (!payloadStr || !signature) return false;

    const secret = process.env.BETTER_AUTH_SECRET || "utility-todo-state-secret-default";
    const expectedSig = crypto.createHmac("sha256", secret).update(payloadStr).digest("hex");

    const sigBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return false;
    }

    const payload = JSON.parse(payloadStr);
    if (payload.userId !== expectedUserId) return false;

    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - payload.timestamp > tenMinutes) return false;

    return true;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// GitHub Webhook Verification (HMAC-SHA256, timing-safe)
// -------------------------------------------------------------
export function verifyGitHubWebhookSignature(payload: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secret = process.env.GITHUB_WEBHOOK_SECRET || process.env.BETTER_AUTH_SECRET || "utility-todo-webhook-secret";

  try {
    const parts = signatureHeader.split("=");
    if (parts.length !== 2 || parts[0] !== "sha256") return false;
    const providedSig = parts[1];

    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    const sigBuf = Buffer.from(providedSig, "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");

    if (sigBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// GitHub App JWT & Installation Token Management
// -------------------------------------------------------------
export function formatPrivateKey(rawKey: string): string {
  let key = rawKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  key = key.replace(/\\n/g, "\n");

  if (!key.includes("-----BEGIN")) {
    try {
      const decoded = Buffer.from(key, "base64").toString("utf8");
      if (decoded.includes("-----BEGIN")) {
        key = decoded;
      }
    } catch {
      // not base64
    }
  }
  return key;
}

export function isValidPrivateKey(key: string): boolean {
  try {
    const formatted = formatPrivateKey(key);
    crypto.createPrivateKey(formatted);
    return true;
  } catch {
    return false;
  }
}

export function getGitHubAppConfigStatus(): GitHubAppConfigStatus {
  const appId = process.env.GITHUB_APP_ID;
  const rawKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const appSlug = process.env.GITHUB_APP_NAME || process.env.GITHUB_APP_SLUG || null;

  const hasAppId = !!appId && appId.trim().length > 0;
  const hasPrivateKey = !!rawKey && isValidPrivateKey(rawKey);
  const hasWebhookSecret = !!webhookSecret && !webhookSecret.includes("how to take") && webhookSecret.trim().length > 0;
  const hasClientId = !!clientId && clientId.trim().length > 0;
  const hasClientSecret = !!clientSecret && clientSecret.trim().length > 0;

  const missingKeys: string[] = [];
  if (!hasAppId) missingKeys.push("GITHUB_APP_ID");
  if (!hasPrivateKey) missingKeys.push("GITHUB_APP_PRIVATE_KEY");
  if (!hasWebhookSecret) missingKeys.push("GITHUB_WEBHOOK_SECRET");

  const isAppConfigured = hasAppId && hasPrivateKey;

  return {
    isConfigured: isAppConfigured,
    isAppConfigured,
    hasAppId,
    hasPrivateKey,
    hasWebhookSecret,
    hasClientId,
    hasClientSecret,
    appSlug,
    missingKeys,
  };
}

export function generateGitHubAppJWT(customAppId?: string, customPrivateKey?: string): string {
  const appId = customAppId || process.env.GITHUB_APP_ID;
  const rawKey = customPrivateKey || process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !rawKey) {
    throw new Error("GitHub App credentials missing (GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY).");
  }

  const privateKey = formatPrivateKey(rawKey);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iat: now - 60,
    exp: now + 10 * 60,
    iss: appId,
  };

  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsigned = `${encode(header)}.${encode(payload)}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey, "base64url");

  return `${unsigned}.${signature}`;
}

// In-memory token cache for App Installation Access Tokens: installationId -> { token, expiresAt }
const installationTokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getInstallationAccessToken(installationId: string): Promise<string> {
  const cached = installationTokenCache.get(installationId);
  const now = Date.now();
  if (cached && cached.expiresAt - now > 5 * 60 * 1000) {
    return cached.token;
  }

  const jwt = generateGitHubAppJWT();
  const res = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create installation access token (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const token = data.token as string;
  const expiresAt = new Date(data.expires_at).getTime();

  installationTokenCache.set(installationId, { token, expiresAt });
  return token;
}

// -------------------------------------------------------------
// Connection URL Construction
// -------------------------------------------------------------
export function getGitHubConnectUrl(state: string): string {
  const appSlug = process.env.GITHUB_APP_NAME || process.env.GITHUB_APP_SLUG || "utility-todo-github";
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (appSlug && appSlug !== "your-app-slug") {
    return `https://github.com/apps/${appSlug}/installations/new?state=${encodeURIComponent(state)}`;
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/github/callback`;
  const params = new URLSearchParams({
    client_id: clientId || "",
    redirect_uri: redirectUri,
    state,
    scope: "repo,read:user,user:email",
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeGitHubCode(code: string): Promise<{
  access_token: string;
  token_type: string;
  scope?: string;
  error?: string;
} | null> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to exchange GitHub code:", err);
    return null;
  }
}

// -------------------------------------------------------------
// Octokit Client Helper
// -------------------------------------------------------------
export function createOctokitClient(accessToken?: string): Octokit {
  return new Octokit({
    auth: accessToken || undefined,
  });
}

// -------------------------------------------------------------
// GitHub API Methods (Real Data Only)
// -------------------------------------------------------------

/**
 * Fetch installation metadata from GitHub App API
 */
export async function fetchInstallationMetadata(installationId: string) {
  const jwt = generateGitHubAppJWT();
  const res = await fetch(`https://api.github.com/app/installations/${installationId}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch installation metadata (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * List repositories accessible to a GitHub App installation
 */
export async function fetchInstallationRepositories(installationId: string): Promise<GitHubRepoDTO[]> {
  const token = await getInstallationAccessToken(installationId);
  const octokit = createOctokitClient(token);

  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });

  return data.repositories.map((repo) => ({
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    private: repo.private,
    htmlUrl: repo.html_url,
    description: repo.description,
    defaultBranch: repo.default_branch,
    openIssuesCount: repo.open_issues_count || 0,
  }));
}

/**
 * List user repositories via OAuth token
 */
export async function fetchUserRepositories(accessToken: string): Promise<GitHubRepoDTO[]> {
  const octokit = createOctokitClient(accessToken);
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
    affiliation: "owner,collaborator,organization_member",
  });

  return data.map((repo) => ({
    id: String(repo.id),
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner.login,
    private: repo.private,
    htmlUrl: repo.html_url,
    description: repo.description,
    defaultBranch: repo.default_branch,
    openIssuesCount: repo.open_issues_count || 0,
  }));
}

/**
 * Fetch issues for a repository
 */
export async function fetchRepositoryIssues(
  accessToken: string,
  owner: string,
  repo: string,
  options?: {
    state?: "open" | "closed" | "all";
    per_page?: number;
    page?: number;
  }
): Promise<GitHubIssueDTO[]> {
  const octokit = createOctokitClient(accessToken);
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: options?.state || "open",
    sort: "updated",
    direction: "desc",
    per_page: options?.per_page || 50,
    page: options?.page || 1,
  });

  return data
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      id: String(issue.id),
      number: issue.number,
      title: issue.title,
      body: issue.body || null,
      htmlUrl: issue.html_url,
      state: issue.state as "open" | "closed",
      author: issue.user?.login || "unknown",
      assignee: issue.assignee?.login || null,
      labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name || "")).filter(Boolean),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    }));
}

/**
 * Fetch single issue by number
 */
export async function fetchIssueByNumber(
  accessToken: string,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<GitHubIssueDTO | null> {
  try {
    const octokit = createOctokitClient(accessToken);
    const { data: issue } = await octokit.rest.issues.get({
      owner,
      repo,
      issue_number: issueNumber,
    });

    return {
      id: String(issue.id),
      number: issue.number,
      title: issue.title,
      body: issue.body || null,
      htmlUrl: issue.html_url,
      state: issue.state as "open" | "closed",
      author: issue.user?.login || "unknown",
      assignee: issue.assignee?.login || null,
      labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name || "")).filter(Boolean),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
    };
  } catch (err) {
    console.error(`Error fetching issue #${issueNumber} for ${owner}/${repo}:`, err);
    return null;
  }
}

/**
 * Fetch pull requests for a repository
 */
export async function fetchRepositoryPullRequests(
  accessToken: string,
  owner: string,
  repo: string,
  options?: {
    state?: "open" | "closed" | "all";
    per_page?: number;
    page?: number;
  }
): Promise<GitHubPullRequestDTO[]> {
  const octokit = createOctokitClient(accessToken);
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: options?.state || "open",
    sort: "updated",
    direction: "desc",
    per_page: options?.per_page || 30,
    page: options?.page || 1,
  });

  return data.map((pr) => ({
    id: String(pr.id),
    number: pr.number,
    title: pr.title,
    body: pr.body || null,
    htmlUrl: pr.html_url,
    state: pr.merged_at ? "merged" : (pr.state as "open" | "closed"),
    draft: !!pr.draft,
    author: pr.user?.login || "unknown",
    headRef: pr.head?.ref || "branch",
    baseRef: pr.base?.ref || "main",
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at || null,
    repositoryFullName: `${owner}/${repo}`,
  }));
}

/**
 * Check commit CI/checks status
 */
export async function fetchCommitChecks(
  accessToken: string,
  owner: string,
  repo: string,
  ref: string
): Promise<GitHubCheckRunDTO[]> {
  try {
    const octokit = createOctokitClient(accessToken);
    const { data } = await octokit.rest.checks.listForRef({
      owner,
      repo,
      ref,
      per_page: 15,
    });

    return data.check_runs.map((run) => ({
      id: run.id,
      name: run.name,
      status: run.status as "queued" | "in_progress" | "completed",
      conclusion: (run.conclusion ?? null) as GitHubCheckRunDTO["conclusion"],
      htmlUrl: run.html_url,
      startedAt: run.started_at,
      completedAt: run.completed_at,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetch recent repository activity events
 */
export async function fetchRepositoryActivity(
  accessToken: string,
  owner: string,
  repo: string
): Promise<GitHubActivityEventDTO[]> {
  try {
    const octokit = createOctokitClient(accessToken);
    const { data } = await octokit.rest.activity.listRepoEvents({
      owner,
      repo,
      per_page: 25,
    });

    return data.map((event) => {
      let action: string | undefined = undefined;
      let title: string | undefined = undefined;
      let url: string | undefined = undefined;

      const payload = event.payload as Record<string, unknown> | undefined;
      if (payload) {
        action = typeof payload.action === "string" ? payload.action : undefined;
        const issue = payload.issue as { number?: number; title?: string; html_url?: string } | undefined;
        const pr = payload.pull_request as { number?: number; title?: string; html_url?: string } | undefined;
        const commits = payload.commits as Array<{ message?: string }> | undefined;

        if (issue) {
          title = `#${issue.number} ${issue.title}`;
          url = issue.html_url;
        } else if (pr) {
          title = `PR #${pr.number} ${pr.title}`;
          url = pr.html_url;
        } else if (commits && commits[0]) {
          title = commits[0].message;
        }
      }

      return {
        id: event.id,
        type: event.type || "Event",
        actor: event.actor.display_login || event.actor.login,
        actorAvatarUrl: event.actor.avatar_url,
        repoName: event.repo.name,
        action,
        title,
        url,
        createdAt: event.created_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error(`Error fetching activity for ${owner}/${repo}:`, err);
    return [];
  }
}

/**
 * Check repository write permissions
 */
export async function checkRepositoryPermission(
  accessToken: string,
  owner: string,
  repo: string
): Promise<{ canWrite: boolean; permission?: string }> {
  try {
    const octokit = createOctokitClient(accessToken);
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    const permissions = repoData.permissions;
    const canWrite = !!(permissions?.push || permissions?.admin);
    return {
      canWrite,
      permission: permissions?.admin ? "admin" : permissions?.push ? "push" : "pull",
    };
  } catch {
    return { canWrite: false };
  }
}

/**
 * Create a new GitHub issue
 */
export async function createRemoteGitHubIssue(
  accessToken: string,
  owner: string,
  repo: string,
  input: {
    title: string;
    body?: string | null;
    labels?: string[];
    assignees?: string[];
  }
): Promise<GitHubIssueDTO> {
  const octokit = createOctokitClient(accessToken);
  const { data: issue } = await octokit.rest.issues.create({
    owner,
    repo,
    title: input.title,
    body: input.body || undefined,
    labels: input.labels && input.labels.length > 0 ? input.labels : undefined,
    assignees: input.assignees && input.assignees.length > 0 ? input.assignees : undefined,
  });

  return {
    id: String(issue.id),
    number: issue.number,
    title: issue.title,
    body: issue.body || null,
    htmlUrl: issue.html_url,
    state: issue.state as "open" | "closed",
    author: issue.user?.login || "unknown",
    assignee: issue.assignee?.login || null,
    labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name || "")).filter(Boolean),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  };
}

/**
 * Update an existing GitHub issue
 */
export async function updateRemoteGitHubIssue(
  accessToken: string,
  owner: string,
  repo: string,
  issueNumber: number,
  updates: {
    title?: string;
    body?: string | null;
    state?: "open" | "closed";
    labels?: string[];
    assignees?: string[];
  }
): Promise<GitHubIssueDTO> {
  const octokit = createOctokitClient(accessToken);
  const { data: issue } = await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    title: updates.title,
    body: updates.body !== undefined ? (updates.body || "") : undefined,
    state: updates.state,
    labels: updates.labels,
    assignees: updates.assignees,
  });

  return {
    id: String(issue.id),
    number: issue.number,
    title: issue.title,
    body: issue.body || null,
    htmlUrl: issue.html_url,
    state: issue.state as "open" | "closed",
    author: issue.user?.login || "unknown",
    assignee: issue.assignee?.login || null,
    labels: issue.labels.map((l) => (typeof l === "string" ? l : l.name || "")).filter(Boolean),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
  };
}
